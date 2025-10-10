import os
import json
import uuid
import hashlib
from typing import Optional, List
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
try:
    from openai import OpenAI  # type: ignore
except Exception:
    OpenAI = None  # type: ignore
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import aiosqlite
from huggingface_hub import InferenceClient
from PIL import Image

# Optional Redis cache
try:
    import redis.asyncio as redis  # type: ignore
    REDIS_AVAILABLE = True
except Exception:
    redis = None  # type: ignore
    REDIS_AVAILABLE = False

from database import DB_PATH
from auth import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/ask-ai", tags=["ai"])
security = HTTPBearer()  # require token


class AIRequest(BaseModel):
    question: str


load_dotenv()


def get_cache_enabled() -> bool:
    return REDIS_AVAILABLE and os.getenv("REDIS_DISABLED", "0") != "1"


def get_redis_url() -> str:
    return os.getenv("REDIS_URL", "redis://localhost:6379/0")


_redis_client: Optional["redis.Redis"] = None


async def get_redis() -> Optional["redis.Redis"]:
    global _redis_client
    if not get_cache_enabled():
        return None
    if _redis_client is None:
        try:
            _redis_client = await redis.from_url(get_redis_url(), encoding="utf-8", decode_responses=True)  # type: ignore
        except Exception:
            return None
    return _redis_client


def make_image_cache_key(name: str, ingredients: List[str]) -> str:
    normalized = (name.strip().lower() + "|" + ",".join(sorted([i.strip().lower() for i in ingredients])))
    h = hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]
    return f"recipe_image:{h}"


def make_recent_list_key(user_id: Optional[int]) -> Optional[str]:
    if user_id is None:
        return None
    return f"recent_recipes:{user_id}"


def clamp_list(items: List[str], max_len: int) -> List[str]:
    return items[:max_len]


def generate_food_image(recipe_name: str, ingredients: List[str]) -> str:
    """Generate a food image using Hugging Face Stable Diffusion with lighter compute."""
    try:
        client = InferenceClient(api_key=os.getenv("HF_TOKEN"))
        ingredients_text = ", ".join(ingredients[:5])

        prompt = (
            f"A beautifully plated dish of {recipe_name}, "
            f"made with {ingredients_text}, "
            f"professional food photography, top-down view, "
            f"served on elegant white plate, garnished, "
            f"natural lighting, vibrant colors, high quality"
        )

        negative_prompt = (
            "person, people, human, face, body, hands, fingers, "
            "raw meat, blood, uncooked, animals, pets, text, watermark, logo, blurry, low quality, cartoon"
        )

        # Lighter settings to reduce compute cost/time
        fast_mode = os.getenv("AI_IMAGE_FAST", "1") == "1"
        guidance = 6.0 if fast_mode else 7.5
        steps = 20 if fast_mode else 30

        model = "stabilityai/stable-diffusion-xl-base-1.0"

        image = client.text_to_image(
            prompt,
            model=model,
            negative_prompt=negative_prompt,
            guidance_scale=guidance,
            num_inference_steps=steps,
        )

        os.makedirs("uploaded_images", exist_ok=True)
        image_filename = f"recipe_{uuid.uuid4().hex[:8]}.png"
        image_path = os.path.join("uploaded_images", image_filename)
        image.save(image_path)
        return f"uploaded_images/{image_filename}"
    except Exception as e:
        print(f"Error generating image: {e}")
        return ""


def get_current_user(token: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[int]:
    if token is None:
        return None
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("user_id"))
    except JWTError:
        return None


async def fetch_user_pantry_items(user_id: int) -> List[str]:
    query = "SELECT name FROM pantry_items WHERE user_id = ?"
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(query, (user_id,))
        rows = await cursor.fetchall()
    return [row[0] for row in rows]


async def fetch_user_dietary_preferences(user_id: int) -> dict:
    query = """SELECT dietary_preferences, allergies, cuisine_preferences 
               FROM users WHERE id = ?"""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(query, (user_id,))
        row = await cursor.fetchone()
        if row:
            return {
                "dietary_preferences": row[0],
                "allergies": row[1],
                "cuisine_preferences": row[2]
            }
    return {
        "dietary_preferences": None,
        "allergies": None,
        "cuisine_preferences": None
    }


async def fetch_user_utensils(user_id: int) -> List[str]:
    query = "SELECT name, category FROM utensils WHERE user_id = ?"
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(query, (user_id,))
        rows = await cursor.fetchall()
    return [f"{row[0]} ({row[1]})" for row in rows]


async def save_chat_message(user_id: int, role: str, content: str) -> None:
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                "INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)",
                (user_id, role, content),
            )
            await db.commit()
    except Exception as e:
        print(f"Failed to save chat message: {e}")


async def get_recent_messages(user_id: int, limit: int = 5) -> List[dict]:
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            cursor = await db.execute(
                "SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?",
                (user_id, limit),
            )
            rows = await cursor.fetchall()
        # Reverse to chronological order
        return [{"role": row[0], "content": row[1]} for row in rows[::-1]]
    except Exception as e:
        print(f"Failed to load chat messages: {e}")
        return []


@router.post("/")
async def ask_ai(request: AIRequest, token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Enforce auth
        try:
            payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: Optional[int] = int(payload.get("user_id"))
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or OpenAI is None:
            raise HTTPException(status_code=503, detail="AI service unavailable")

        client = OpenAI(api_key=api_key)  # type: ignore

        pantry_context = ""
        dietary_context = ""
        utensils_context = ""

        recent_msgs = await get_recent_messages(user_id, limit=5)
        
        if user_id is not None:
            # Limit pantry items added to the prompt to reduce tokens
            items = await fetch_user_pantry_items(user_id)
            items = clamp_list(items, 30)
            if items:
                formatted = [f"- {name}" for name in items]
                pantry_context = "\nUser pantry items:\n" + "\n".join(formatted)

            prefs = await fetch_user_dietary_preferences(user_id)
            dietary_parts = []
            if prefs["dietary_preferences"]:
                dietary_parts.append(f"Diet Type: {prefs['dietary_preferences']}")
            if prefs["allergies"]:
                dietary_parts.append(f"⚠️ ALLERGIES (MUST AVOID): {prefs['allergies']}")
            if prefs["cuisine_preferences"]:
                dietary_parts.append(f"Preferred Cuisines: {prefs['cuisine_preferences']}")
            if dietary_parts:
                dietary_context = "\n\nUser Dietary Preferences:\n" + "\n".join(dietary_parts)
            
            utensils = await fetch_user_utensils(user_id)
            utensils = clamp_list(utensils, 25)
            if utensils:
                formatted = [f"- {name}" for name in utensils]
                utensils_context = "\n\nAvailable Kitchen Utensils:\n" + "\n".join(formatted)

        system_msg = {
            "role": "system",
            "content": (
                "You are a helpful cooking assistant AI Chef. Return STRICT JSON ONLY. No markdown, no prose.\n\n"
                "When the user asks for recipes, respond with EXACTLY this JSON object shape:\n"
                "{\n  \"recipes\": [\n    {\n      \"name\": \"Descriptive Recipe Name\",\n      \"ingredients\": [\"ingredient with quantity\", \"ingredient\"],\n      \"instructions\": \"Sentence 1.\\nSentence 2.\\nSentence 3.\",\n      \"nutrients\": {\"calories\": 450, \"protein\": 30, \"carbs\": 60, \"fat\": 15},\n      \"prep_time\": 15,\n      \"cook_time\": 25,\n      \"image\": \"\",\n      \"id\": 1\n    }\n  ],\n  \"follow_up\": \"A short, friendly follow-up question\"\n}\n\n"
                "Rules for instructions: write clear sentences separated by \n, DO NOT prefix with numbers or bullets (no '1.', '-', '•'). Avoid quotes inside sentences when possible. No trailing commas anywhere.\n\n"
                "If the user asks a cooking question (not recipes), reply with a JSON object: {\"answer\": \"text\", \"recipes\": [] } and keep it short.\n\n"
                "Apply dietary and equipment rules strictly.\n"
                + dietary_context
                + pantry_context
                + utensils_context
            ),
        }

        messages = [system_msg]
        for m in recent_msgs:
            clipped = m["content"][:1500]
            messages.append({"role": m["role"], "content": clipped})
        messages.append({"role": "user", "content": request.question})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.6,
            max_tokens=600,
            response_format={"type": "json_object"},
        )

        answer = response.choices[0].message.content if response.choices else ""

        # Persist conversation
        try:
            await save_chat_message(user_id, "user", request.question)
            await save_chat_message(user_id, "assistant", answer)
        except Exception as e:
            print(f"Failed to persist chat: {e}")

        # First try to parse full JSON object
        try:
            parsed_obj = json.loads(answer)
            recipes = parsed_obj.get("recipes") if isinstance(parsed_obj, dict) else None
            follow_up_text = parsed_obj.get("follow_up") if isinstance(parsed_obj, dict) else None

            # If we have recipes array, optionally generate images
            if isinstance(recipes, list):
                # Try cache & generation path (reuse existing code pattern)
                r = await get_redis()
                to_generate = []
                for i, rec in enumerate(recipes):
                    if not isinstance(rec, dict):
                        continue
                    name = rec.get('name') or ''
                    ingredients = rec.get('ingredients') or []
                    cache_key = make_image_cache_key(name, ingredients) if name and ingredients else None
                    img_path = None
                    if r is not None and cache_key is not None:
                        try:
                            img_path = await r.get(cache_key)  # type: ignore
                        except Exception:
                            img_path = None
                    if img_path:
                        rec['image'] = img_path
                    else:
                        rec['image'] = ""
                        to_generate.append(i)

                if to_generate:
                    from concurrent.futures import ThreadPoolExecutor
                    import concurrent.futures
                    executor = ThreadPoolExecutor(max_workers=3)
                    futures = {executor.submit(generate_food_image, recipes[i].get('name', ''), recipes[i].get('ingredients', [])): i for i in to_generate}
                    try:
                        for future in concurrent.futures.as_completed(futures, timeout=12):
                            try:
                                image_path = future.result()
                                idx = futures[future]
                                if image_path:
                                    recipes[idx]['image'] = image_path
                                    r = await get_redis()
                                    if r is not None:
                                        try:
                                            cache_key = make_image_cache_key(recipes[idx].get('name', ''), recipes[idx].get('ingredients', []))
                                            await r.set(cache_key, image_path, ex=7 * 24 * 3600)  # 7 days
                                        except Exception:
                                            pass
                            except Exception as e:
                                print(f"Image generation failed: {e}")
                    except concurrent.futures.TimeoutError:
                        print("Image generation timed out")

                return {"answer": "Here are some recipe suggestions for you:", "recipes": recipes, "follow_up": follow_up_text}
        except Exception as e:
            print(f"Error parsing JSON response: {e}")

        # Fallback: return plain text if not parsable
        return {"answer": answer, "recipes": None, "follow_up": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
