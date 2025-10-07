from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from auth import router as auth_router
from meals import router as meals_router
from plans import router as plans_router
from pantry import router as pantry_router
from grocery import router as grocery_router
from ai import router as ai_router
from image_upload import router as upload_router
from yolo_detection import router as yolo_router
from user_profile import router as profile_router
from utensils import router as utensils_router
from database import init_db

app = FastAPI()

# CORS for mobile and local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await init_db()

app.include_router(auth_router)      # /auth endpoints
app.include_router(meals_router)     # /meals endpoints
app.include_router(plans_router)     # /plans endpoints
app.include_router(pantry_router)    # /pantry endpoints
app.include_router(grocery_router)   # /grocery endpoints
app.include_router(ai_router)        # /ask-ai endpoint(s)
app.include_router(upload_router)    # image upload endpoints
app.include_router(yolo_router)      # /detect endpoints
app.include_router(profile_router)   # /profile endpoints
app.include_router(utensils_router)  # /utensils endpoints

app.mount("/static", StaticFiles(directory="uploaded_images"), name="static")

@app.get("/")
def root():
    return {"message": "Meal Planner FastAPI MVP is running!"} 
