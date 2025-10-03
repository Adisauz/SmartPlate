# 🍽️ SmartPlate — AI Meal Planner (Mobile + FastAPI)

SmartPlate is an AI-powered meal planning app with a React Native (Expo) frontend and a FastAPI backend. It helps you plan meals, manage your pantry with computer vision, and get personalized recipe ideas with AI.

---

## 🧭 Table of Contents

- Overview
- Features
- Tech Stack
- Project Structure
- Quick Start
- Configuration
- Common Tasks
- Troubleshooting
- Contributing, License, Acknowledgments

---

## 🚀 Features

- **AI Chef Assistant**: Personalized recipe suggestions via OpenAI
- **Smart Pantry Detection**: Detect items from photos using YOLO
- **AI Images**: Generate appetizing recipe images (Stable Diffusion XL)
- **Auth**: JWT-based login and protected APIs
- **Meals & Plans**: CRUD meals, nutrition info, plan by date and meal-type
- **Mobile-first**: Expo app with modern, responsive UI

---

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo SDK 54), TypeScript, React Navigation, Axios
- **Backend**: FastAPI, Python 3.10+, SQLite (aiosqlite), python-jose (JWT)
- **AI**: OpenAI (chat), Ultralytics YOLO (vision), Stable Diffusion XL via Hugging Face

---

## 📁 Project Structure

```
mealplanner/
├── backend/                 # FastAPI backend
│   ├── main.py              # App entry
│   ├── auth.py              # Auth endpoints
│   ├── meals.py             # Meals endpoints
│   ├── pantry.py            # Pantry endpoints
│   ├── plans.py             # Planning endpoints
│   ├── ai.py                # AI chat/recipes
│   ├── yolo_detection.py    # CV detection
│   ├── image_upload.py      # Upload handling
│   ├── database.py          # DB config
│   ├── models.py            # Data models
│   ├── requirements.txt     # Python deps
│   ├── run_server.py        # Dev server (auto IP)
│   └── uploaded_images/     # Static storage
├── frontend/                # React Native app
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── navigation/
│   │   └── utils/
│   ├── package.json
│   └── app.json
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Expo CLI: `npm i -g @expo/cli`
- API keys: OpenAI and Hugging Face

### 1) Backend

```bash
cd mealplanner/backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate
pip install -r requirements.txt

# Environment
set OPENAI_API_KEY=your_openai_api_key         # Windows (PowerShell: $env:OPENAI_API_KEY)
set HF_TOKEN=your_hugging_face_token           # Windows (PowerShell: $env:HF_TOKEN)
# export OPENAI_API_KEY=... && export HF_TOKEN=...   # macOS/Linux

python run_server.py
```

Note the LAN IP shown in the logs (e.g., `http://192.168.x.x:8000`). You will use this in the mobile app.

### 2) Frontend (Expo)

```bash
cd ../frontend
npm install --legacy-peer-deps
```

Open `frontend/src/utils/api.ts` and set `API_BASE` to your backend URL (LAN IP):

```ts
const API_BASE = 'http://192.168.x.x:8000';
```

Then start Expo:

```bash
npx expo start
```

Use Expo Go on your device to scan the QR, or run `--android` / `--ios` for emulators.

---

## 🔧 Configuration

### Backend

- `OPENAI_API_KEY`: Required for AI chat/completions
- `HF_TOKEN`: Required for Stable Diffusion XL image generation
- Database: SQLite by default
- CORS and file uploads are preconfigured for mobile access

### Frontend

- `API_BASE` in `frontend/src/utils/api.ts` must point to your backend (same network)
- Expo config via `app.json`

---

## 🧑‍💻 Common Tasks

- Start backend: `python run_server.py`
- Start app: `npx expo start`
- Update API base URL: edit `frontend/src/utils/api.ts`
- View API docs: visit `/docs` on your backend URL in a browser

---

## 🩹 Troubleshooting

- **App cannot reach backend**: Ensure phone and computer are on the same Wi‑Fi. Verify `API_BASE` uses your machine's LAN IP (not localhost).
- **CORS or 401 errors**: Confirm backend running and JWT token is set; sign in to refresh token.
- **Expo network issues**: Switch Expo connection mode (LAN/Tunnel) in the Dev Tools.
- **Image/Camera permissions**: Accept permissions when prompted in Expo Go.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/awesome`
3. Commit: `git commit -m "Add awesome"`
4. Push: `git push origin feature/awesome`
5. Open a Pull Request

---

## 📄 License

MIT. See `LICENSE` for details.

---

## 🙏 Acknowledgments

- OpenAI
- Ultralytics (YOLO)
- Hugging Face (Stable Diffusion XL)
- Expo
- FastAPI

---

