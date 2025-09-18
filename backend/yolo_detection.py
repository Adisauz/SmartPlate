import os
import tempfile
from typing import List, Dict
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from ultralytics import YOLO
from PIL import Image
import io
from auth import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/detect", tags=["detection"])
security = HTTPBearer(auto_error=False)

# Load YOLO model
model = YOLO('yolov8n.pt')

# Food items mapping - YOLO class names to common food names
FOOD_ITEMS_MAP = {
    'apple': 'Apple',
    'banana': 'Banana',
    'orange': 'Orange',
    'broccoli': 'Broccoli',
    'carrot': 'Carrot',
    'hot dog': 'Hot Dog',
    'pizza': 'Pizza',
    'donut': 'Donut',
    'cake': 'Cake',
    'sandwich': 'Sandwich',
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
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        
        # Create temporary file for YOLO processing
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
            tmp_file.write(image_data)
            tmp_file_path = tmp_file.name
        
        try:
            # Run YOLO prediction
            results = model.predict(source=tmp_file_path, save=False, verbose=False)
            
            detected_items = []
            
            # Process results
            for result in results:
                if result.boxes is not None:
                    boxes = result.boxes
                    for i in range(len(boxes)):
                        # Get class name and confidence
                        class_id = int(boxes.cls[i])
                        class_name = model.names[class_id]
                        confidence = float(boxes.conf[i])
                        
                        # Only include food items with confidence > 0.5
                        if confidence > 0.5 and class_name.lower() in FOOD_ITEMS_MAP:
                            food_name = FOOD_ITEMS_MAP[class_name.lower()]
                            
                            # Check if item already detected (avoid duplicates)
                            if not any(item['name'] == food_name for item in detected_items):
                                detected_items.append({
                                    'name': food_name,
                                    'confidence': round(confidence * 100, 1),
                                    'yolo_class': class_name
                                })
            
            # Sort by confidence (highest first)
            detected_items.sort(key=lambda x: x['confidence'], reverse=True)
            
            return {
                'success': True,
                'detected_items': detected_items,
                'total_items': len(detected_items),
                'message': f'Detected {len(detected_items)} food items' if detected_items else 'No food items detected'
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
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

