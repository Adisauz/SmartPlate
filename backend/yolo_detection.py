import os
import io
import json
from typing import Dict, List, Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from ultralytics import YOLO
from PIL import Image
import logging
from dotenv import load_dotenv

# OCR support
try:
    import pytesseract
    # Set Tesseract path for Windows (comment out if Tesseract is in PATH)
    # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logging.warning("pytesseract not installed. OCR functionality will be disabled.")

# OpenAI for LLM filtering
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logging.warning("OpenAI not installed. LLM filtering will be disabled.")

# Optional HEIF/HEIC support
try:
    import pillow_heif  # type: ignore[import-not-found]
    pillow_heif.register_heif_opener()
except ImportError:
    pass  # continue without HEIF

# Import authentication config
from auth import SECRET_KEY, ALGORITHM

load_dotenv()

# Logger for debugging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
os.environ['YOLO_PROFILING'] = '0'
# FastAPI router
router = APIRouter(prefix="/detect", tags=["detection"])
security = HTTPBearer(auto_error=False)

# Load YOLO model (downloads yolov8n.pt if not present)
try:
    model = YOLO("best.pt")
    logger.info("best model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load YOLO model: {e}")
    raise RuntimeError("YOLO model could not be loaded")

# Food items mapping
FOOD_ITEMS_MAP: Dict[str, str] = {
    # Fruits
    'apple': 'Apple',
    'banana': 'Banana',
    'orange': 'Orange',
    'lemon': 'Lemon',
    'lime': 'Lime',
    'grapefruit': 'Grapefruit',
    'tangerine': 'Tangerine',
    'mandarin': 'Mandarin Orange',
    'pineapple': 'Pineapple',
    'mango': 'Mango',
    'papaya': 'Papaya',
    'watermelon': 'Watermelon',
    'cantaloupe': 'Cantaloupe',
    'honeydew': 'Honeydew',
    'grape': 'Grapes',
    'strawberry': 'Strawberry',
    'blueberry': 'Blueberry',
    'raspberry': 'Raspberry',
    'blackberry': 'Blackberry',
    'cranberry': 'Cranberry',
    'cherry': 'Cherry',
    'peach': 'Peach',
    'nectarine': 'Nectarine',
    'plum': 'Plum',
    'apricot': 'Apricot',
    'kiwi': 'Kiwi',
    'pomegranate': 'Pomegranate',
    'pear': 'Pear',
    'fig': 'Fig',
    'date': 'Date',
    'coconut': 'Coconut',
    'avocado': 'Avocado',
    'persimmon': 'Persimmon',
    'guava': 'Guava',
    'lychee': 'Lychee',
    'longan': 'Longan',
    'dragon fruit': 'Dragon Fruit',
    'passion fruit': 'Passion Fruit',
    'starfruit': 'Starfruit',
    'durian': 'Durian',
    'jackfruit': 'Jackfruit',
    'plantain': 'Plantain',
    'mulberry': 'Mulberry',
    'gooseberry': 'Gooseberry',

    # Vegetables
    'tomato': 'Tomato',
    'cucumber': 'Cucumber',
    'carrot': 'Carrot',
    'potato': 'Potato',
    'sweet potato': 'Sweet Potato',
    'yam': 'Yam',
    'onion': 'Onion',
    'garlic': 'Garlic',
    'ginger': 'Ginger',
    'beet': 'Beet',
    'radish': 'Radish',
    'turnip': 'Turnip',
    'parsnip': 'Parsnip',
    'pumpkin': 'Pumpkin',
    'butternut squash': 'Butternut Squash',
    'acorn squash': 'Acorn Squash',
    'spaghetti squash': 'Spaghetti Squash',
    'zucchini': 'Zucchini',
    'eggplant': 'Eggplant',
    'bell pepper': 'Bell Pepper',
    'pepper': 'Pepper',
    'chili pepper': 'Chili Pepper',
    'jalapeno': 'Jalapeño',
    'serrano': 'Serrano Pepper',
    'habanero': 'Habanero',
    'corn': 'Corn',
    'peas': 'Peas',
    'green bean': 'Green Beans',
    'asparagus': 'Asparagus',
    'broccoli': 'Broccoli',
    'cauliflower': 'Cauliflower',
    'cabbage': 'Cabbage',
    'brussels sprout': 'Brussels Sprouts',
    'lettuce': 'Lettuce',
    'romaine': 'Romaine Lettuce',
    'spinach': 'Spinach',
    'kale': 'Kale',
    'arugula': 'Arugula',
    'collard greens': 'Collard Greens',
    'mustard greens': 'Mustard Greens',
    'swiss chard': 'Swiss Chard',
    'celery': 'Celery',
    'mushroom': 'Mushroom',
    'okra': 'Okra',
    'artichoke': 'Artichoke',
    'leek': 'Leek',
    'scallion': 'Scallion',
    'green onion': 'Green Onion',
    'chive': 'Chives',
    'fennel': 'Fennel',
    'shallot': 'Shallot',

    # Herbs
    'cilantro': 'Cilantro',
    'parsley': 'Parsley',
    'basil': 'Basil',
    'dill': 'Dill',
    'mint': 'Mint',
    'rosemary': 'Rosemary',
    'thyme': 'Thyme',
    'sage': 'Sage',
    'oregano': 'Oregano',
    'bay leaf': 'Bay Leaf',

    # COCO food/utensil classes
    'sandwich': 'Sandwich',
    'pizza': 'Pizza',
    'hot dog': 'Hot Dog',
    'donut': 'Donut',
    'cake': 'Cake',
    'bottle': 'Bottle',
    'cup': 'Cup',
    'bowl': 'Bowl',
    'spoon': 'Spoon',
    'knife': 'Knife',
    'fork': 'Fork',
}


def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """Validate JWT token and return user_id"""
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: user_id missing")
        return int(user_id)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")


def extract_text_from_image(image: Image.Image) -> Optional[str]:
    """Extract text from image using OCR (Tesseract)"""
    if not TESSERACT_AVAILABLE:
        logger.warning("Tesseract not available, skipping OCR")
        return None
    
    try:
        text = pytesseract.image_to_string(image)
        logger.info(f"OCR extracted text: {text[:200]}...")  # Log first 200 chars
        return text.strip()
    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        return None


def filter_items_with_llm(yolo_items: List[Dict], ocr_text: Optional[str]) -> Dict:
    """Use LLM to filter and combine YOLO detections with OCR text to extract food items"""
    if not OPENAI_AVAILABLE:
        logger.warning("OpenAI not available, returning unfiltered results")
        return {
            "yolo_items": yolo_items,
            "ocr_items": [],
            "combined_items": yolo_items,
            "llm_filtered": False
        }
    
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Prepare the prompt
        yolo_list = [item["name"] for item in yolo_items]
        
        prompt = f"""You are a food item extraction assistant. Analyze the following data and extract ALL food, grocery, and pantry items.

YOLO Detected Items (from image):
{json.dumps(yolo_list, indent=2)}

OCR Extracted Text (from receipt/label/package):
{ocr_text if ocr_text else "No text detected"}

Task:
1. Extract all food/grocery items from the OCR text (ignore prices, dates, store names, addresses)
2. Combine with YOLO detected items
3. Remove duplicates
4. Return ONLY food, ingredients, beverages, and grocery items
5. Format as a clean JSON array

Return format:
{{
  "items": ["item1", "item2", "item3", ...],
  "source": "combined" | "yolo_only" | "ocr_only"
}}

Be liberal with extraction - include anything that could be a food item, ingredient, or beverage."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a food item extraction assistant. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        result_text = response.choices[0].message.content.strip()
        logger.info(f"LLM response: {result_text}")
        
        # Parse JSON response
        try:
            parsed = json.loads(result_text)
            extracted_items = parsed.get("items", [])
            source = parsed.get("source", "combined")
            
            # Convert to standard format
            ocr_items = [{"name": item, "source": "ocr"} for item in extracted_items if item.lower() not in [y["name"].lower() for y in yolo_items]]
            combined = yolo_items + ocr_items
            
            return {
                "yolo_items": yolo_items,
                "ocr_items": ocr_items,
                "combined_items": combined,
                "llm_filtered": True,
                "source": source
            }
        except json.JSONDecodeError as je:
            logger.error(f"Failed to parse LLM JSON response: {je}")
            return {
                "yolo_items": yolo_items,
                "ocr_items": [],
                "combined_items": yolo_items,
                "llm_filtered": False,
                "error": "JSON parse error"
            }
    
    except Exception as e:
        logger.error(f"LLM filtering failed: {e}")
        return {
            "yolo_items": yolo_items,
            "ocr_items": [],
            "combined_items": yolo_items,
            "llm_filtered": False,
            "error": str(e)
        }


@router.post("/food-items")
async def detect_food_items(
    file: UploadFile = File(None),
    image: UploadFile = File(None),
    user_id: int = Depends(get_current_user)
):
    """Detect food items in an uploaded image using YOLO + OCR + LLM filtering"""
    try:
        # Accept either 'file' or 'image' form field
        upload = file or image
        if upload is None:
            raise HTTPException(status_code=422, detail="No image provided. Send multipart/form-data with field 'file' or 'image'.")

        # Validate file type
        if upload.content_type and not upload.content_type.startswith("image/"):
            return {"success": False, "detected_items": [], "total_items": 0, "error": "File must be an image"}

        # Read and open image
        image_data = await upload.read()
        try:
            image_obj = Image.open(io.BytesIO(image_data)).convert("RGB")
        except Exception as pil_err:
            return {"success": False, "detected_items": [], "total_items": 0, "error": f"Invalid image file: {pil_err}"}

        # ===== STEP 1: Run YOLO Detection =====
        yolo_items: List[Dict] = []
        try:
            results = model.predict(source=image_obj, save=False, verbose=False, stream=False)
            
            # Process detections
            for result in results:
                if result.boxes is not None:
                    boxes = result.boxes
                    for i in range(len(boxes)):
                        try:
                            class_id = int(boxes.cls[i].item())
                            confidence = float(boxes.conf[i].item())
                            class_name = model.names[class_id]

                            if confidence > 0.5:
                                food_name = FOOD_ITEMS_MAP.get(class_name.lower(), class_name)
                                if not any(item["name"] == food_name for item in yolo_items):
                                    yolo_items.append({
                                        "name": food_name,
                                        "confidence": round(confidence * 100, 1),
                                        "yolo_class": class_name,
                                        "source": "yolo"
                                    })
                        except Exception as parse_err:
                            logger.warning(f"Skipping detection due to parse error: {parse_err}")
                            continue

            yolo_items.sort(key=lambda x: x["confidence"], reverse=True)
            logger.info(f"YOLO detected {len(yolo_items)} items")
            
        except Exception as yolo_err:
            logger.error(f"YOLO inference failed: {yolo_err}")
            yolo_items = []

        # ===== STEP 2: Run OCR (Tesseract) =====
        ocr_text = extract_text_from_image(image_obj)
        
        # ===== STEP 3: Combine with LLM Filtering =====
        llm_result = filter_items_with_llm(yolo_items, ocr_text)
        
        combined_items = llm_result.get("combined_items", yolo_items)
        
        return {
            "success": True,
            "detected_items": combined_items,
            "total_items": len(combined_items),
            "message": f"Detected {len(combined_items)} food items",
            "breakdown": {
                "yolo_count": len(yolo_items),
                "ocr_count": len(llm_result.get("ocr_items", [])),
                "combined_count": len(combined_items),
                "llm_filtered": llm_result.get("llm_filtered", False)
            },
            "ocr_text": ocr_text[:500] if ocr_text else None,  # First 500 chars for debugging
            "yolo_items": [{"name": item["name"], "confidence": item.get("confidence", 0)} for item in yolo_items],
            "ocr_items": [item["name"] for item in llm_result.get("ocr_items", [])]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected server error: {e}")
        return {"success": False, "detected_items": [], "total_items": 0, "error": f"Unexpected server error: {str(e)}"}


@router.get("/supported-items")
async def get_supported_items():
    """Get list of food items that can be detected"""
    return {"supported_items": list(FOOD_ITEMS_MAP.values()), "total_count": len(FOOD_ITEMS_MAP)}
