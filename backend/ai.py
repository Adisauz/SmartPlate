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
        
        # Create a detailed, food-focused prompt with negative prompts to avoid inappropriate images
        ingredients_text = ", ".join(ingredients[:5])  # Limit to first 5 ingredients
        
        # Enhanced prompt with more food-specific details
        prompt = (
            f"A beautifully plated dish of {recipe_name}, "
            f"made with {ingredients_text}, "
            f"professional food photography, top-down view, "
            f"served on elegant white plate, garnished, "
            f"restaurant quality presentation, natural lighting, "
            f"food magazine cover, appetizing, vibrant colors, "
            f"high resolution, detailed texture, gourmet cuisine, "
            f"culinary art, michelin star presentation"
        )
        
        # Negative prompt to avoid generating anything inappropriate
        negative_prompt = (
            "person, people, human, face, body, hands, fingers, "
            "raw meat, blood, uncooked, animals, pets, "
            "text, watermark, logo, blurry, low quality, "
            "cartoon, anime, illustration, painting"
        )
        
        # Use Stable Diffusion XL for better quality
        model = "stabilityai/stable-diffusion-xl-base-1.0"
        
        # Generate the image with negative prompt
        image = client.text_to_image(
            prompt, 
            model=model,
            negative_prompt=negative_prompt,
            guidance_scale=7.5,  # Higher = more adherence to prompt
            num_inference_steps=30  # More steps = better quality
        )
        
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
                        "You are a helpful cooking assistant AI Chef. Follow these rules carefully:\n\n"
                        "📋 **RECIPE REQUESTS** (user asks for recipes, meals, food suggestions, or \"what can I cook\"):\n"
                        "- ALWAYS respond with a JSON array of 2-3 recipe suggestions\n"
                        "- Use this EXACT JSON format:\n\n"
                        "[{\n"
                        '  "name": "Descriptive Recipe Name",\n'
                        '  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", "..."],\n'
                        '  "instructions": "Step 1. Detailed action with specific temperature/time/technique. Include utensils needed.\\nStep 2. Next detailed step with cooking method and visual cues to look for.\\nStep 3. Continue with precise instructions and tips.\\nStep 4. Final plating and serving suggestions.",\n'
                        '  "nutrients": {"calories": 450, "protein": 30, "carbs": 60, "fat": 15},\n'
                        '  "prep_time": 15,\n'
                        '  "cook_time": 25,\n'
                        '  "image": "",\n'
                        '  "id": 1\n'
                        "}]\n\n"
                        "- **IMPORTANT**: Instructions must be highly detailed with:\n"
                        "  * Exact temperatures (e.g., 'Preheat oven to 375°F/190°C')\n"
                        "  * Specific cooking times (e.g., 'Sauté for 3-4 minutes until golden')\n"
                        "  * Visual/sensory cues (e.g., 'until edges are crispy', 'until fragrant')\n"
                        "  * Required utensils for each step (e.g., 'Using a whisk', 'In a large skillet')\n"
                        "  * Cooking techniques (e.g., 'dice finely', 'fold gently', 'sear on high heat')\n"
                        "  * At least 5-8 detailed steps per recipe\n\n"
                        "- After the JSON array, add ONE friendly follow-up question (optional):\n"
                        "  Examples: 'Would you like recipes with fewer calories?', 'Want vegetarian alternatives?', 'Need quicker recipes?'\n\n"
                        "🗨️ **COOKING QUESTIONS** (how-to, tips, techniques, ingredient info):\n"
                        "- Respond with helpful conversational text (no JSON)\n"
                        "- Examples: 'How do I boil an egg?', 'What temperature for chicken?', 'Can I substitute butter?'\n\n"
                        "🎯 **CLASSIFICATION GUIDE**:\n"
                        "- 'What can I cook?' → RECIPE REQUEST (return JSON)\n"
                        "- 'Recipe ideas' → RECIPE REQUEST (return JSON)\n"
                        "- 'Quick meals' → RECIPE REQUEST (return JSON)\n"
                        "- 'What should I make?' → RECIPE REQUEST (return JSON)\n"
                        "- 'Suggest something' → RECIPE REQUEST (return JSON)\n"
                        "- 'How do I...' → COOKING QUESTION (return text)\n"
                        "- 'What is...' → COOKING QUESTION (return text)\n"
                        "- 'Tips for...' → COOKING QUESTION (return text)\n"
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
                
                # ⚡ SLOW MODE: Generate AI images for recipes (10-15 seconds total)
                # This will produce beautiful food images but slower responses
                
                from concurrent.futures import ThreadPoolExecutor
                import concurrent.futures
                
                # Generate images in parallel (still takes ~10 sec total)
                executor = ThreadPoolExecutor(max_workers=3)
                futures = {}
                
                for i, recipe in enumerate(recipes):
                    if isinstance(recipe, dict) and 'name' in recipe and 'ingredients' in recipe:
                        future = executor.submit(generate_food_image, recipe['name'], recipe['ingredients'])
                        futures[future] = i
                        recipe['image'] = ""  # Default to empty
                
                # Wait for all images (with 15 sec timeout)
                try:
                    for future in concurrent.futures.as_completed(futures, timeout=15):
                        try:
                            image_path = future.result()
                            recipe_index = futures[future]
                            if image_path and recipe_index < len(recipes):
                                recipes[recipe_index]['image'] = image_path
                                print(f"✅ Generated image for recipe {recipe_index + 1}: {image_path}")
                        except Exception as e:
                            print(f"❌ Image generation failed for recipe {futures[future]}: {e}")
                            recipes[futures[future]]['image'] = ""
                except concurrent.futures.TimeoutError:
                    print("⚠️ Image generation timed out after 15 seconds, using placeholders")
                    # Leave empty images for recipes that timed out
                
                print(f"✅ Parsed {len(recipes)} recipes successfully")
                
                # Return the updated recipes AND the follow-up text
                result = {
                    "answer": json.dumps(recipes),
                    "follow_up": follow_up_text if follow_up_text else None
                }
                return result
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            print(f"❌ Error parsing JSON response: {e}")
            print(f"Response was: {answer[:200]}...")
            # If JSON parsing fails, return the original answer
            pass
        
        print("⚠️ Returning plain text answer (no JSON detected)")
        return {"answer": answer, "follow_up": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
