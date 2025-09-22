import os
import tempfile
from typing import List, Dict
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from ultralytics import YOLO
from PIL import Image
import io
try:
    import pillow_heif  # type: ignore[import-not-found]
    pillow_heif.register_heif_opener()
except Exception:
    # If not available, PIL will still handle common formats (JPEG/PNG)
    pass
from auth import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/detect", tags=["detection"])
security = HTTPBearer(auto_error=False)

# Load YOLO model (local YOLOv11 nano)
model = YOLO('yolo11n.pt')

# Food items mapping - YOLO class names to common food names
# Includes an expanded set of fruits and vegetables + some common food classes
FOOD_ITEMS_MAP = {
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

    # Common COCO food/utensil classes (kept for completeness)
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
    if token is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("user_id"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/food-items")
async def detect_food_items(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user)
):
    """
    Detect food items in an uploaded image using YOLO
    """
    try:
        # Validate file type (be tolerant if content_type is missing or incorrect)
        if file.content_type and not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read image data into memory and open with PIL to avoid temp file IO issues
        image_data = await file.read()
        try:
            image = Image.open(io.BytesIO(image_data)).convert('RGB')
        except Exception as pil_err:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {pil_err}")

        # Run YOLO prediction directly on the PIL image
        results = model.predict(source=image, save=False, verbose=False)

        detected_items = []

        # Process results
        for result in results:
            if result.boxes is not None:
                boxes = result.boxes
                for i in range(len(boxes)):
                    class_id = int(boxes.cls[i])
                    class_name = model.names[class_id]
                    confidence = float(boxes.conf[i])

                    if confidence > 0.5 and class_name.lower() in FOOD_ITEMS_MAP:
                        food_name = FOOD_ITEMS_MAP[class_name.lower()]
                        if not any(item['name'] == food_name for item in detected_items):
                            detected_items.append({
                                'name': food_name,
                                'confidence': round(confidence * 100, 1),
                                'yolo_class': class_name
                            })

        detected_items.sort(key=lambda x: x['confidence'], reverse=True)

        return {
            'success': True,
            'detected_items': detected_items,
            'total_items': len(detected_items),
            'message': f'Detected {len(detected_items)} food items' if detected_items else 'No food items detected'
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@router.get("/supported-items")
async def get_supported_items():
    """
    Get list of food items that can be detected
    """
    return {
        'supported_items': list(FOOD_ITEMS_MAP.values()),
        'total_count': len(FOOD_ITEMS_MAP)
    }

