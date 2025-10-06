import os
import io
from typing import Dict, List

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from ultralytics import YOLO
from PIL import Image
import logging

# Optional HEIF/HEIC support
try:
    import pillow_heif  # type: ignore[import-not-found]
    pillow_heif.register_heif_opener()
except ImportError:
    pass  # continue without HEIF

# Import authentication config
from auth import SECRET_KEY, ALGORITHM

# Logger for debugging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
os.environ['YOLO_PROFILING'] = '0'
# FastAPI router
router = APIRouter(prefix="/detect", tags=["detection"])
security = HTTPBearer(auto_error=False)

# Load YOLO model (downloads yolov8n.pt if not present)
try:
    model = YOLO("yolov8n.pt")
    logger.info("YOLOv8n model loaded successfully")
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


@router.post("/food-items")
async def detect_food_items(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user)
):
    """Detect food items in an uploaded image using YOLO"""
    try:
        # Validate file type
        if file.content_type and not file.content_type.startswith("image/"):
            return {"success": False, "detected_items": [], "total_items": 0, "error": "File must be an image"}

        # Read and open image
        image_data = await file.read()
        try:
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
        except Exception as pil_err:
            return {"success": False, "detected_items": [], "total_items": 0, "error": f"Invalid image file: {pil_err}"}

        # Run YOLO
        try:
            results = model.predict(source=image, save=False, verbose=False, stream=False)
        except Exception as yolo_err:
            logger.error(f"YOLO inference failed: {yolo_err}")
            return {"success": False, "detected_items": [], "total_items": 0, "error": f"YOLO inference failed: {yolo_err}"}

        detected_items: List[Dict] = []

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
                            if not any(item["name"] == food_name for item in detected_items):
                                detected_items.append({
                                    "name": food_name,
                                    "confidence": round(confidence * 100, 1),
                                    "yolo_class": class_name
                                })
                    except Exception as parse_err:
                        logger.warning(f"Skipping detection due to parse error: {parse_err}")
                        continue

        detected_items.sort(key=lambda x: x["confidence"], reverse=True)

        return {
            "success": True,
            "detected_items": detected_items,
            "total_items": len(detected_items),
            "message": f"Detected {len(detected_items)} food items" if detected_items else "No food items detected"
        }

    except Exception as e:
        logger.exception(f"Unexpected server error: {e}")
        return {"success": False, "detected_items": [], "total_items": 0, "error": f"Unexpected server error: {str(e)}"}


@router.get("/supported-items")
async def get_supported_items():
    """Get list of food items that can be detected"""
    return {"supported_items": list(FOOD_ITEMS_MAP.values()), "total_count": len(FOOD_ITEMS_MAP)}
