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
        
        # Use os.path.join for file system operations
        image_path = os.path.join("uploaded_images", image_filename)
        
        # Save the image
        image.save(image_path)
        
        # ALWAYS return with forward slashes for URL compatibility (not os.path.join)
        return f"uploaded_images/{image_filename}"
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
                        "You are a helpful cooking assistant. When users ask for recipes, meals, or food suggestions, "
                        "ALWAYS respond with a JSON array of 2-3 recipe suggestions in this EXACT format:\n"
                        "[{\n"
                        '  "name": "Recipe Name",\n'
                        '  "ingredients": ["ingredient 1", "ingredient 2"],\n'
                        '  "instructions": "Step 1. Do this\\nStep 2. Do that\\nStep 3. Final step",\n'
                        '  "nutrients": {"calories": 450, "protein": 30, "carbs": 60, "fat": 15},\n'
                        '  "prep_time": 15,\n'
                        '  "cook_time": 25,\n'
                        '  "image": "",\n'
                        '  "id": 1\n'
                        "}]\n\n"
                        "After the JSON, add a friendly follow-up message like:\n"
                        "- 'Would you like recipes with lower calories or different ingredients?'\n"
                        "- 'Looking for something with less fat or more protein?'\n"
                        "- 'Want me to suggest vegetarian or vegan alternatives?'\n"
                        "- 'Need recipes that are quicker to prepare?'\n"
                        "- 'Interested in recipes with more/fewer carbs?'\n\n"
                        "For general cooking questions (not recipe requests), respond normally with helpful text."
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
                
                # Extract any text after the JSON (follow-up message)
                follow_up_text = answer[end_idx:].strip()
                
                # Generate images for each recipe
                for recipe in recipes:
                    if isinstance(recipe, dict) and 'name' in recipe and 'ingredients' in recipe:
                        image_path = generate_food_image(recipe['name'], recipe['ingredients'])
                        if image_path:
                            recipe['image'] = image_path
                        else:
                            recipe['image'] = ""
                
                # Return the updated recipes with images AND the follow-up text
                result = {
                    "answer": json.dumps(recipes),
                    "follow_up": follow_up_text if follow_up_text else None
                }
                return result
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            print(f"Error parsing JSON response: {e}")
            # If JSON parsing fails, return the original answer
            pass
        
        return {"answer": answer, "follow_up": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
