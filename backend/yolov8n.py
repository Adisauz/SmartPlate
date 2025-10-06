

from ultralytics import YOLO
from PIL import Image

# Load YOLO model
model = YOLO("yolov8n.pt")

# Image path
image_path = r"C:\Users\Adithya Sau\Downloads\traning yolo\fruits.jpg"

# Food items mapping
FRUITS_VEGGIES = {
    'apple', 'banana', 'orange', 'lemon', 'lime', 'grapefruit', 'pineapple', 
    'mango', 'watermelon', 'grape', 'strawberry', 'cherry', 'peach', 'pear',
    'tomato', 'cucumber', 'carrot', 'potato', 'onion', 'garlic', 'broccoli',
    'cauliflower', 'cabbage', 'lettuce', 'spinach', 'mushroom'
}

# Open and process image
image = Image.open(image_path)
print(f"Processing: {image_path}\n")

# Run YOLO detection
results = model.predict(source=image, save=False, verbose=False, stream=False)

# Extract fruits and vegetables
detected_items = []
for result in results:
    if result.boxes is not None:
        for i in range(len(result.boxes)):
            class_id = int(result.boxes.cls[i])
            class_name = model.names[class_id].lower()
            confidence = float(result.boxes.conf[i])
            
            if confidence > 0.3 and class_name in FRUITS_VEGGIES:
                detected_items.append({
                    'name': class_name.title(),
                    'confidence': round(confidence * 100, 1)
                })

# Display results
if detected_items:
    print("🍎 Detected Fruits & Vegetables:")
    print("-" * 40)
    for item in detected_items:
        print(f"  • {item['name']}: {item['confidence']}% confidence")
else:
    print("❌ No fruits or vegetables detected")

print(f"\nTotal items found: {len(detected_items)}")