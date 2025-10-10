# SmartPlate

An AI‑assisted meal planning app built with a React Native (Expo) frontend and a FastAPI backend. SmartPlate helps you plan what to cook next by combining three inputs: what you have in your pantry, the equipment in your kitchen, and your dietary preferences. It generates practical recipes with step‑by‑step instructions, nutrition, and grocery lists.

---

## Features

- AI Chef (OpenAI)
  - Generates recipe ideas tailored to pantry items, dietary preferences, and available equipment
  - Produces detailed, step‑by‑step instructions (temps, times, techniques, required tools)
  - Creates appetizing images for recipes via Stable Diffusion XL
- Pantry
  - Add items manually or detect items from photos via YOLO
  - Use pantry contents to drive recipe suggestions and shopping lists
- Kitchen equipment
  - Track your tools by category (cookware, bakeware, knives, appliances, measuring, prep tools, storage)
  - AI prefers recipes you can actually make; warns when a specialty tool is missing
- Meal planning
  - Weekly planner by day and meal type (breakfast, lunch, dinner, snacks)
  - Add AI or saved recipes directly to plan
- Nutrition
  - Calories, protein, carbs, fat; goals and daily progress
- Accounts & security
  - JWT‑based auth with password reset
- Mobile‑first
  - React Native (Expo), TypeScript, clean UI, responsive on iOS and Android

---

## How it works

- Frontend (React Native + Expo)
  - TypeScript app with screens for AI Chef, Pantry (with photo detection), Meal Planner, Grocery, Saved Meals, Profile, Utensils
  - Axios client with token interceptor; consistent theming and navigation
- Backend (FastAPI)
  - Async endpoints for auth, meals, plans, pantry, grocery, utensils, AI
  - SQLite storage (aiosqlite), JSON‑encoded lists for ingredients
  - Static serving for generated images
- AI/ML
  - OpenAI GPT for chat/recipes
  - Ultralytics YOLO for pantry detection from photos
  - Stable Diffusion XL (via Hugging Face) for recipe images

---

## Quick start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Expo CLI: `npm i -g @expo/cli`
- API keys: OpenAI and Hugging Face

### Backend
```
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate
pip install -r requirements.txt

# Environment (examples)
# PowerShell
$env:OPENAI_API_KEY="sk-..."
$env:HF_TOKEN="hf_..."

python run_server.py
```
Note the LAN URL (e.g., `http://192.168.x.x:8000`) for the mobile app.

### Frontend
```
cd ../frontend
npm install --legacy-peer-deps
```
Edit `src/utils/api.ts` and set:
```
const API_BASE = 'http://192.168.x.x:8000';
```
Start Expo:
```
npx expo start
```
Open in Expo Go or an emulator.

---

## Configuration

Backend environment variables:
- `OPENAI_API_KEY` – required for AI chat/completions
- `HF_TOKEN` – required for Stable Diffusion image generation
- `REDIS_URL` – optional; enable Redis cache (e.g., `redis://localhost:6379/0`)
- `REDIS_DISABLED` – set to `1` to disable Redis cache
- `AI_IMAGE_FAST` – set to `1` to use lighter SDXL settings (faster/cheaper)

Frontend:
- `API_BASE` in `frontend/src/utils/api.ts` must point to your backend LAN URL

---

## Redis caching (optional)

Redis is used to reduce latency and cost for AI image generation and to keep short chat history.

- Caches generated recipe image paths for 7 days (keyed by recipe name + ingredients)
- Stores last 10 recipe result sets per user (`recent_recipes:{user_id}`)
- Speeds up repeated requests (“quick meals” / “similar recipes”) and avoids re‑generating the same image

Start Redis on Windows (fastest via Docker):
```
docker run -d --name redis -p 6379:6379 redis:7-alpine
```
Then set:
```
# PowerShell
$env:REDIS_URL="redis://localhost:6379/0"
```
If you don’t run Redis, the app continues to work (cache disabled).

---

## Scalability

This project is structured to scale horizontally:

- **Stateless APIs**: JWT auth with FastAPI → can run multiple app instances behind a load balancer
- **Async I/O**: FastAPI + aiosqlite/DB client + Redis cache → lower latency under load
- **Static assets**: images are served from `/static` and can be moved to S3/GCS + CDN easily

Recommended path to production:

1. **Containerize & fan out**
   - Dockerize backend/frontend; run uvicorn/gunicorn with multiple workers
   - Nginx/ALB in front; enable keep‑alive and compression

2. **Database upgrade**
   - Move SQLite → Postgres (managed: RDS/Cloud SQL)
   - Add indexes on hot paths (meals.name, meal_plan_items.meal_plan_id, pantry_items.user_id)
   - Use Alembic + SQLAlchemy for migrations and types

3. **Caching & queues**
   - Redis for image path cache (done), chat short‑term memory, plan fragments
   - Background jobs (Celery/RQ) for heavy tasks (YOLO, SDXL, LLM) to keep API responsive

4. **Media & CDN**
   - Store generated images in S3/GCS; save URLs in DB
   - Serve via CDN with cache‑busting filenames

5. **Observability & limits**
   - Structured logs, request IDs, metrics (p95 latency, queue depth)
   - Per‑user rate limits on `/ask-ai` and `/detect`, timeouts, input validation

With these steps, you can scale from dev to thousands of users: multiple API pods, a worker pool for AI tasks, managed Postgres, and a Redis cache/queue.

---

## API overview

- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- Meals: `GET/POST /meals/`, `GET/DELETE /meals/{id}`
- Plans: `GET/POST /plans/`, `GET/DELETE /plans/{id}`, `POST /plans/{id}/add-meal`, `DELETE /plans/{id}/meals/{meal_id}`
- Pantry: `GET/POST/PUT/DELETE /pantry/` (with search)
- Grocery: `GET/POST/DELETE /grocery/`
- Utensils: `GET/POST/PUT/DELETE /utensils/`, `GET /utensils/categories`
- AI: `POST /ask-ai/` (question → answer + structured `recipes[]`)

Interactive docs: `/docs` and `/redoc` on your backend URL.

---

## Project structure (abridged)

```
mealplanner/
├── backend/
│   ├── main.py                # FastAPI app + routers
│   ├── auth.py                # authentication
│   ├── meals.py               # meals CRUD
│   ├── plans.py               # weekly meal planning
│   ├── pantry.py              # pantry items
│   ├── grocery.py             # grocery list
│   ├── utensils.py            # kitchen equipment
│   ├── user_profile.py        # profile + nutrition
│   ├── ai.py                  # AI chat/recipes (Redis cache optional)
│   ├── yolo_detection.py      # pantry detection
│   ├── image_upload.py        # uploads
│   ├── database.py            # schema + migrations
│   └── uploaded_images/
└── frontend/
    ├── src/
    │   ├── screens/
    │   │   ├── AIChefScreen.tsx
    │   │   ├── PantryScreen.tsx
    │   │   ├── UtensilsScreen.tsx
    │   │   ├── MealPlannerScreen.tsx
    │   │   ├── GroceryListScreen.tsx
    │   │   ├── SavedMealsScreen.tsx
    │   │   ├── RecipeDetailScreen.tsx
    │   │   ├── ProfileScreen.tsx
    │   │   ├── OnboardingScreen.tsx
    │   │   └── Login/Forgot/Reset
    │   └── utils/api.ts
    └── app.json, package.json, tsconfig.json
```

---

## Development

- Start backend: `python run_server.py`
- Start app: `npx expo start`
- API docs: visit `/docs` on your backend URL

Common issues:
- Phone can’t reach backend: ensure both are on the same Wi‑Fi and `API_BASE` uses your computer’s LAN IP (not `localhost`)
- 401s: login again to refresh token
- Expo network: try switching connection mode (LAN/Tunnel)

---

## Notes on design

- Equipment‑aware recipes: the AI uses your utensils list to avoid suggesting recipes you can’t make and flags missing tools with alternatives
- Dietary safety: the AI respects allergies and dietary preferences when generating recipes
- Image generation is optional; if unavailable, the app falls back gracefully

---

## License

MIT. See `LICENSE` for details.
