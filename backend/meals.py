from fastapi import APIRouter, HTTPException, Depends
from typing import List
import aiosqlite
import json
from models import MealCreate, MealOut, Nutrients
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
        # Convert ingredients list to JSON string for storage
        ingredients_json = json.dumps(meal.ingredients)
        
        cursor = await db.execute(
            """INSERT INTO meals (name, ingredients, instructions, calories, protein, carbs, fat, prep_time, cook_time, image) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                meal.name,
                ingredients_json,
                meal.instructions,
                meal.nutrients.calories,
                meal.nutrients.protein,
                meal.nutrients.carbs,
                meal.nutrients.fat,
                meal.prep_time,
                meal.cook_time,
                meal.image
            )
        )
        await db.commit()
        meal_id = cursor.lastrowid
    return MealOut(id=meal_id, **meal.dict())

@router.get("/", response_model=List[MealOut])
async def list_meals(user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """SELECT id, name, ingredients, instructions, calories, protein, carbs, fat, prep_time, cook_time, image 
               FROM meals ORDER BY name ASC"""
        )
        rows = await cursor.fetchall()
    
    meals = []
    for row in rows:
        # Parse ingredients JSON, handle None case
        ingredients = json.loads(row[2]) if row[2] else []
        
        # Create nutrients object
        nutrients = Nutrients(
            calories=row[4] or 0,
            protein=row[5] or 0, 
            carbs=row[6] or 0,
            fat=row[7] or 0
        )
        
        meal = MealOut(
            id=row[0],
            name=row[1],
            ingredients=ingredients,
            instructions=row[3] or "",
            nutrients=nutrients,
            prep_time=row[8] or 0,
            cook_time=row[9] or 0,
            image=row[10]
        )
        meals.append(meal)
    
    return meals

@router.get("/{meal_id}", response_model=MealOut)
async def get_meal(meal_id: int, user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """SELECT id, name, ingredients, instructions, calories, protein, carbs, fat, prep_time, cook_time, image 
               FROM meals WHERE id = ?""",
            (meal_id,)
        )
        row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    # Parse ingredients JSON, handle None case
    ingredients = json.loads(row[2]) if row[2] else []
    
    # Create nutrients object
    nutrients = Nutrients(
        calories=row[4] or 0,
        protein=row[5] or 0, 
        carbs=row[6] or 0,
        fat=row[7] or 0
    )
    
    return MealOut(
        id=row[0],
        name=row[1],
        ingredients=ingredients,
        instructions=row[3] or "",
        nutrients=nutrients,
        prep_time=row[8] or 0,
        cook_time=row[9] or 0,
        image=row[10]
    )

@router.delete("/{meal_id}")
async def delete_meal(meal_id: int, user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM meals WHERE id = ?", (meal_id,))
        await db.commit()
    return {"message": "Meal deleted"} 