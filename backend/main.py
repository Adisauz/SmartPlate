from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from auth import router as auth_router
from meals import router as meals_router
from plans import router as plans_router
from pantry import router as pantry_router
from ai import router as ai_router
from image_upload import router as upload_router
from database import init_db

app = FastAPI()

@app.on_event("startup")
async def on_startup():
    await init_db()

app.include_router(auth_router)
app.include_router(meals_router)
app.include_router(plans_router)
app.include_router(pantry_router)
app.include_router(ai_router)
app.include_router(upload_router)

app.mount("/static", StaticFiles(directory="uploaded_images"), name="static")

@app.get("/")
def root():
    return {"message": "Meal Planner FastAPI MVP is running!"}

# TODO: Implement /auth, /meals, /plans, /pantry, /ask-ai endpoints 