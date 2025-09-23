import os
import json
import uuid
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
from database import DB_PATH
from auth import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/ask-ai", tags=["ai"])
security = HTTPBearer(auto_error=False)


class AIRequest(BaseModel):
    question: str


load_dotenv()


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


def generate_food_image(recipe_name: str, ingredients: List[str]) -> str:
    """Generate a food image using Hugging Face Stable Diffusion"""
    try:
        # Initialize the Hugging Face client
        client = InferenceClient(api_key=os.getenv("HF_TOKEN"))
        
        # Create a detailed prompt for food image generation
        ingredients_text = ", ".join(ingredients[:5])  # Limit to first 5 ingredients
        prompt = f"Delicious {recipe_name}, {ingredients_text}, professional food photography, high quality, appetizing, well-lit, restaurant style, food styling, vibrant colors, detailed"
        
        # Use Stable Diffusion XL for better quality
        model = "stabilityai/stable-diffusion-xl-base-1.0" #hi

        
        # Generate the image
        image = client.text_to_image(prompt, model=model)
        
        # Create uploaded_images directory if it doesn't exist
        os.makedirs("uploaded_images", exist_ok=True)
        
        # Generate unique filename
        image_filename = f"recipe_{uuid.uuid4().hex[:8]}.png"
        image_path = os.path.join("uploaded_images", image_filename)
        
        # Save the image
        image.save(image_path)
        
        return image_path
    except Exception as e:
        print(f"Error generating image: {e}")
        return ""  # Return empty string if image generation fails


@router.post("/")
async def ask_ai(request: AIRequest, user_id: Optional[int] = Depends(get_current_user)):
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or OpenAI is None:
            raise HTTPException(status_code=503, detail="AI service unavailable")

        client = OpenAI(api_key=api_key)  # type: ignore

        pantry_context = ""
        if user_id is not None:
            items = await fetch_user_pantry_items(user_id)
            if items:
                formatted = [f"- {name}" for name in items]
                pantry_context = "\nUser pantry items:\n" + "\n".join(formatted)

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant for meal planning, recipes, nutrition, and cooking tips. "
                        "Keep answers concise and practical. If pantry items are provided, follow these rules: "
                        "1) If the user asks about their pantry, briefly summarize what's available. "
                        "2) Propose 1 dish ideas that use ONLY or MOSTLY pantry items; do not invent ingredients. "
                        "If a small number of staples are missing (max 3), list them as a minimal shopping list. "
                        "3) For each dish, include: a short name, ingredients (mark which ones come from pantry), "
                        "3-6 simple steps, prep/cook time, and a rough calorie estimate. "
                        "4) If pantry is insufficient, state that and suggest minimal add-ons."
                        "5) If the user asks about a specific recipe, provide the recipe with the ingredients and steps."
                        "6) If the user asks about a specific ingredient, provide the ingredient with the recipe and steps."
                        "7) If the user asks about a specific tool, provide the tool with the recipe and steps."
                        "8) If the user asks about a specific kitchen appliance, provide the appliance with the recipe and steps."
                        "9) If the user asks about a specific kitchen tool, provide the tool with the recipe and steps."
                        "10) If the user asks about a specific kitchen appliance, provide the appliance with the recipe and steps."
                        "11) If the user asks about a specific kitchen tool, provide the tool with the recipe and steps."
                        "12) give the output in the following format: "
                        "[{"
                        '"name": "string", '
                        '"ingredients": ["string"], '
                        '"instructions": "string", '
                        '"nutrients": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}, '
                        '"prep_time": 0, '
                        '"cook_time": 0, '
                        '"image": "string", '
                        '"id": 0'
                        "}]"
                        + pantry_context
                    ),
                },
                {"role": "user", "content": request.question},
            ],
            temperature=0.7,
        )

        answer = response.choices[0].message.content if response.choices else ""
        
        # Try to parse the JSON response and generate images
        try:
            # Extract JSON from the response (it might be wrapped in text)
            start_idx = answer.find('[')
            end_idx = answer.rfind(']') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = answer[start_idx:end_idx]
                recipes = json.loads(json_str)
                
                # Generate images for each recipe
                for recipe in recipes:
                    if isinstance(recipe, dict) and 'name' in recipe and 'ingredients' in recipe:
                        image_path = generate_food_image(recipe['name'], recipe['ingredients'])
                        if image_path:
                            recipe['image'] = image_path
                        else:
                            recipe['image'] = ""
                
                # Return the updated recipes with images
                return {"answer": json.dumps(recipes)}
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            print(f"Error parsing JSON response: {e}")
            # If JSON parsing fails, return the original answer
            pass
        
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
