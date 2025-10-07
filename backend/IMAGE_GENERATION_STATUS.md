# 🖼️ AI Image Generation - Status & Configuration

## ✅ **CURRENT STATUS: IMAGES ENABLED**

AI-generated food images are **NOW ENABLED** with parallel processing!

---

## How It Works

### 1️⃣ **Parallel Image Generation** (Lines 181-211 in `backend/ai.py`)

When a user asks for recipes, the backend:

1. **Gets 2-3 recipe suggestions** from OpenAI (1-2 seconds)
2. **Generates images in parallel** using ThreadPoolExecutor (8-12 seconds)
3. **Returns recipes with images** or placeholders if timeout

```python
# Generate all 3 images simultaneously (not one-by-one)
executor = ThreadPoolExecutor(max_workers=3)
futures = {}

for i, recipe in enumerate(recipes):
    future = executor.submit(generate_food_image, recipe['name'], recipe['ingredients'])
    futures[future] = i

# Wait maximum 15 seconds for all images
for future in concurrent.futures.as_completed(futures, timeout=15):
    recipes[recipe_index]['image'] = future.result()
```

### 2️⃣ **Enhanced Image Prompts** (Lines 59-88)

To fix the "fish animal" issue, images now use detailed prompts:

**Positive Prompt:**
```
A beautifully plated dish of {recipe_name},
made with {ingredients},
professional food photography, top-down view,
served on elegant white plate, garnished,
restaurant quality presentation,
michelin star presentation
```

**Negative Prompt (prevents inappropriate images):**
```
person, people, human, face, body, hands,
raw meat, blood, uncooked, animals, pets,
text, watermark, logo, blurry,
cartoon, anime, illustration
```

This ensures:
- ✅ **Cooked, plated food** (not raw ingredients or animals)
- ✅ **Professional food photography** style
- ✅ **Top-down view** (common in food magazines)
- ✅ **No people, animals, or inappropriate content**

### 3️⃣ **Timeout Protection**

- **Backend timeout:** 15 seconds for image generation
- **Frontend timeout:** 60 seconds total API timeout
- **Fallback:** Empty images (shows placeholder icon) if generation fails

---

## Performance Metrics

| Metric | Sequential (Old) | Parallel (New) |
|--------|-----------------|----------------|
| **Time per image** | 8-10 seconds | 8-10 seconds |
| **Total time (3 recipes)** | 24-30 seconds | 10-15 seconds |
| **Timeout errors** | ❌ Common | ✅ Rare |
| **User experience** | ❌ Poor | ✅ Good |

**Why it's faster:**
- 🚀 **Parallel processing:** All 3 images generate simultaneously
- ⏱️ **15-second timeout:** Prevents hanging if HuggingFace is slow
- 📊 **Graceful degradation:** Returns placeholder if image fails

---

## Configuration Options

### Option A: **Fast Mode (No Images)** ⚡

**Pros:** Ultra-fast (1-2 seconds)
**Cons:** No images, only placeholder icons

To enable, change line 181-211 in `backend/ai.py` to:
```python
# Fast mode: skip images
for recipe in recipes:
    recipe['image'] = ""
```

### Option B: **Slow Mode (With Images)** 🖼️ **(CURRENT)**

**Pros:** Beautiful AI-generated food photos
**Cons:** Slower (10-15 seconds)

Already enabled! Current configuration.

### Option C: **Hybrid Mode** (Future Enhancement)

**How it would work:**
1. Return recipes immediately with placeholders (1-2 sec)
2. Generate images in background
3. Push updates to frontend via WebSocket when ready

Not implemented yet, but possible with WebSocket support.

---

## Image Quality Settings

In `backend/ai.py` line 82-88:

```python
image = client.text_to_image(
    prompt, 
    model="stabilityai/stable-diffusion-xl-base-1.0",
    negative_prompt=negative_prompt,
    guidance_scale=7.5,  # Higher = more adherence to prompt (1-20)
    num_inference_steps=30  # More steps = better quality (20-50)
)
```

**Tuning guide:**
- **`guidance_scale`**: 
  - Lower (3-5) = More creative, less accurate
  - **Current (7.5)** = Balanced
  - Higher (10-15) = More accurate to prompt, less creative

- **`num_inference_steps`**:
  - Lower (20-25) = Faster, lower quality
  - **Current (30)** = Balanced
  - Higher (40-50) = Slower, higher quality

---

## Troubleshooting

### Problem: Images show fish/animals instead of cooked food

**Solution:** Already fixed with enhanced prompts (lines 59-88)
- Added negative prompts to exclude animals, raw meat
- Added "plated dish", "cooked", "garnished" to positive prompt

### Problem: Images taking too long (timeout)

**Solutions:**
1. **Check HuggingFace status:** API might be slow
2. **Reduce quality:**
   - Lower `num_inference_steps` from 30 to 20
   - Lower `guidance_scale` from 7.5 to 5.0
3. **Increase timeout:** Change line 197 from 15 to 20 seconds
4. **Disable images:** Switch to Fast Mode (Option A)



---

## Testing

1. **Start backend:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload --host 192.168.0.193 --port 8000
   ```

2. **Ask AI Chef:**
   ```
   User: "What can I cook?"
   ```

3. **Expected behavior:**
   - Loading indicator appears
   - After 10-15 seconds: 3 recipe cards with images appear
   - If timeout: Recipe cards with placeholder icons appear

4. **Check logs:**
   ```
   ✅ Generated image for recipe 1: uploaded_images/recipe_abc123.png
   ✅ Generated image for recipe 2: uploaded_images/recipe_def456.png
   ✅ Generated image for recipe 3: uploaded_images/recipe_ghi789.png
   ✅ Parsed 3 recipes successfully
   ```

---

## Files Modified

1. **`backend/ai.py`**
   - Lines 59-88: Enhanced image generation prompts
   - Lines 181-211: Parallel image generation with timeout

2. **`frontend/src/utils/api.ts`**
   - Line 8: Increased timeout from 30s to 60s

---

## Summary

✅ **Images are ENABLED**
✅ **Parallel processing** reduces time from 30s to 15s
✅ **Enhanced prompts** prevent inappropriate images
✅ **Timeout protection** prevents app hanging
✅ **Graceful fallback** to placeholders if generation fails

**Result:** Beautiful AI-generated food photos with acceptable performance!

