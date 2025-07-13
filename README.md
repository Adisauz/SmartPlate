# SmartPlate – Meal Planner App

SmartPlate is a robust and scalable **meal planning application** featuring a mobile frontend and a FASTAPI-powered backend. It allows users to create personalized meal plans, manage meals and ingredients, and track nutritional information — all backed by a secure, cloud-ready infrastructure.

---

## 🚀 Key Features

### ✅ User Authentication
- Secure JWT-based authentication: users log in to receive a token, which the app stores and sends with requests for seamless access to protected resources.

### 🍽️ Meal Management (CRUD)
- Create, view, update, and delete meals.
- Each meal supports:
  - Name, description
  - Image upload
  - Nutritional info: calories, protein, carbs, and fat

### 📅 Meal Plans
- Create meal plans for specific date ranges.
- Assign meals to various days and meal types (breakfast, lunch, dinner, snack).

### 🧂 Ingredient Management
- Add and manage ingredients with macros per 100g:
  - Calories, protein, carbs, fat

### 🔌 API
- Built with the FastAPI Framework for interaction with the mobile frontend.
- Exposes secure API endpoints for:
  - Meals
  - Ingredients
  - Meal plans

### 🛠️ Admin Interface
- Full-featured FASTAPI for managing:
  - Users
  - Meals
  - Plans
  - Ingredients

### 🖼️ Image Uploads
- Support for uploading and serving images through the backend.

### 🌐 CORS Support
- Configured to accept requests from the mobile frontend.

### ☁️ Cloud-Ready Database
- Easy switch from local SQLite to PostgreSQL or Amazon Aurora via environment variables.

---

## 🧰 Technologies Used

### Backend
- Python 3.x
- FASTAPI
- PostgreSQL / Amazon Aurora
- sqlite
- `python-dotenv`
- Google gemma 3N

### Frontend
- Mobile app (not included in this repo, but connects to the backend API)

---

## 🗂️ Project Structure (Backend)
backend/
  ai.py               # AI-related endpoints (e.g., Q&A, suggestions)
  auth.py             # User authentication (register, login, JWT handling)
  database.py         # Database initialization and schema (SQLite)
  image_upload.py     # Image upload and serving logic
  main.py             # FastAPI app entry point, router inclusion
  meals.py            # Meal CRUD endpoints and logic
  models.py           # Pydantic models for request/response validation
  pantry.py           # Pantry management endpoints
  plans.py            # Meal plan management endpoints
  requirements.txt    # Python dependencies
  uploaded_images/    # Directory for storing uploaded images
  venv/               # Python virtual environment (dependencies)
