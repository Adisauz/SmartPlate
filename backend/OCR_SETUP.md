# OCR Setup Guide for Food Detection

This guide will help you set up Tesseract OCR for the enhanced food detection feature that combines YOLO + OCR + LLM filtering.

## 🎯 Features

The enhanced food detection endpoint (`/detect/food-items`) now:
1. **YOLO Detection** - Detects visible food items in images
2. **OCR Extraction** - Extracts text from receipts, labels, and packages
3. **LLM Filtering** - Uses GPT-3.5 to intelligently combine and filter results

## 📦 Installation

### Windows

1. **Download Tesseract:**
   - Go to: https://github.com/UB-Mannheim/tesseract/wiki
   - Download the latest installer (e.g., `tesseract-ocr-w64-setup-5.3.3.20231005.exe`)
   - Run the installer and note the installation path (usually `C:\Program Files\Tesseract-OCR`)

2. **Add to PATH:**
   - Add Tesseract to your system PATH:
     - Right-click "This PC" → Properties → Advanced System Settings
     - Click "Environment Variables"
     - Under "System variables", find "Path" and click "Edit"
     - Click "New" and add: `C:\Program Files\Tesseract-OCR`
     - Click OK on all dialogs

3. **Install Python Package:**
   ```bash
   pip install pytesseract
   ```

4. **Verify Installation:**
   ```bash
   tesseract --version
   ```

### macOS

```bash
brew install tesseract
pip install pytesseract
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install tesseract-ocr
pip install pytesseract
```

## 🔧 Configuration

If Tesseract is not in your PATH, you can set it manually in the code:

```python
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

## 🚀 Usage

The endpoint automatically uses OCR if:
- `pytesseract` is installed
- Tesseract is available on the system

If OCR is not available, the endpoint will gracefully fall back to YOLO-only detection.

### Example Response

```json
{
  "success": true,
  "detected_items": [
    {"name": "Tomato", "confidence": 95.3, "source": "yolo"},
    {"name": "Milk", "source": "ocr"},
    {"name": "Bread", "source": "ocr"},
    {"name": "Apple", "confidence": 87.2, "source": "yolo"}
  ],
  "total_items": 4,
  "breakdown": {
    "yolo_count": 2,
    "ocr_count": 2,
    "combined_count": 4,
    "llm_filtered": true
  },
  "ocr_text": "Walmart Receipt\nMilk 2%\nBread Whole Wheat\nTotal: $5.99",
  "yolo_items": [
    {"name": "Tomato", "confidence": 95.3},
    {"name": "Apple", "confidence": 87.2}
  ],
  "ocr_items": ["Milk", "Bread"]
}
```

## 🎨 Use Cases

### 1. Receipt Scanning
Upload a grocery receipt to extract all purchased items:
- OCR reads the text
- LLM filters out prices, dates, and store info
- Returns clean list of food items

### 2. Package Label Reading
Take a photo of food packaging:
- YOLO detects the physical items
- OCR reads ingredient lists and product names
- LLM combines both sources

### 3. Mixed Item Detection
Take a photo of your pantry:
- YOLO detects visible fruits and vegetables
- OCR reads labels on cans, boxes, and bottles
- LLM intelligently combines and deduplicates

## 🔑 Environment Variables

Make sure your `.env` file includes:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

The LLM filtering uses GPT-3.5-turbo to intelligently extract and combine food items.

## 🐛 Troubleshooting

### "pytesseract not installed"
```bash
pip install pytesseract
```

### "TesseractNotFoundError"
- Ensure Tesseract is installed (see installation steps above)
- Add Tesseract to your system PATH
- Or set `pytesseract.pytesseract.tesseract_cmd` manually

### "OpenAI not available"
```bash
pip install openai
```

### OCR not detecting text
- Ensure image has clear, readable text
- Try increasing image resolution
- Ensure text is horizontal (Tesseract works best with horizontal text)

## 📊 Performance

- **YOLO**: Fast (~0.5-1s per image)
- **OCR**: Medium (~1-2s per image)
- **LLM Filtering**: Fast (~1-2s per request)
- **Total**: ~2-5s per image (depending on image size and complexity)

## 🎯 Tips for Best Results

1. **For Receipts:**
   - Take photo in good lighting
   - Ensure receipt is flat and text is clear
   - Avoid shadows and glare

2. **For Food Items:**
   - Include product labels in the frame
   - Ensure text is in focus
   - Good lighting helps both YOLO and OCR

3. **For Pantry Photos:**
   - Arrange items so labels are visible
   - Avoid overlapping items
   - Take multiple photos if needed

## 🔄 Fallback Behavior

The system is designed to work even if components are missing:
- **No OCR**: Falls back to YOLO-only detection
- **No LLM**: Returns unfiltered YOLO + OCR results
- **No YOLO**: OCR + LLM still work for text extraction

## 📝 Notes

- The LLM uses GPT-3.5-turbo by default (fast and cost-effective)
- OCR text is truncated to 500 characters in the response (full text is processed)
- Duplicate items are automatically removed by the LLM
- The system is liberal with extraction - includes anything that could be a food item





