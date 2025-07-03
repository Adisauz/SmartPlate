from fastapi import APIRouter, HTTPException, Depends
from typing import List
import aiosqlite
from models import MealCreate, MealOut
from auth import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import DB_PATH

router = APIRouter(prefix="/meals", tags=["meals"])
security = HTTPBearer()

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["user_id"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/", response_model=MealOut)
async def create_meal(meal: MealCreate, user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO meals (name, calories, image) VALUES (?, ?, ?)",
            (meal.name, meal.calories, meal.image)
        )
        await db.commit()
        meal_id = cursor.lastrowid
    return MealOut(id=meal_id, **meal.dict())

@router.get("/", response_model=List[MealOut])
async def list_meals(user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id, name, calories, image FROM meals ORDER BY name ASC")
        rows = await cursor.fetchall()
    return [MealOut(id=row[0], name=row[1], calories=row[2], image=row[3]) for row in rows]

@router.delete("/{meal_id}")
async def delete_meal(meal_id: int, user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM meals WHERE id = ?", (meal_id,))
        await db.commit()
    return {"message": "Meal deleted"} 