from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import date
import aiosqlite
from models import MealPlanCreate, MealPlanOut, MealPlanItemBase
from auth import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import DB_PATH

router = APIRouter(prefix="/plans", tags=["plans"])
security = HTTPBearer()

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["user_id"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/", response_model=MealPlanOut)
async def create_plan(plan: MealPlanCreate, user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO meal_plans (user_id, start_date) VALUES (?, ?)",
            (user_id, plan.start_date.isoformat())
        )
        await db.commit()
        plan_id = cursor.lastrowid
        for item in plan.items:
            await db.execute(
                "INSERT INTO meal_plan_items (meal_plan_id, day, meal_id) VALUES (?, ?, ?)",
                (plan_id, item.day, item.meal_id)
            )
        await db.commit()
    return MealPlanOut(id=plan_id, user_id=user_id, start_date=plan.start_date, items=plan.items)

@router.get("/", response_model=List[MealPlanOut])
async def list_plans(user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id, start_date FROM meal_plans WHERE user_id = ?", (user_id,))
        plans = await cursor.fetchall()
        result = []
        for plan in plans:
            plan_id, start_date_str = plan
            cursor2 = await db.execute("SELECT day, meal_id FROM meal_plan_items WHERE meal_plan_id = ?", (plan_id,))
            items = [MealPlanItemBase(day=row[0], meal_id=row[1]) for row in await cursor2.fetchall()]
            result.append(MealPlanOut(id=plan_id, user_id=user_id, start_date=date.fromisoformat(start_date_str), items=items))
    return result

@router.delete("/{plan_id}")
async def delete_plan(plan_id: int, user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM meal_plan_items WHERE meal_plan_id = ?", (plan_id,))
        await db.execute("DELETE FROM meal_plans WHERE id = ? AND user_id = ?", (plan_id, user_id))
        await db.commit()
    return {"message": "Meal plan deleted"}

@router.post("/{plan_id}/add-meal")
async def add_meal_to_plan(plan_id: int, item: MealPlanItemBase, user_id: int = Depends(get_current_user)):
    # Check that the plan belongs to the user
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT user_id FROM meal_plans WHERE id = ?", (plan_id,))
        row = await cursor.fetchone()
        if not row or row[0] != user_id:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        # Insert the meal into the plan
        await db.execute(
            "INSERT INTO meal_plan_items (meal_plan_id, day, meal_id) VALUES (?, ?, ?)",
            (plan_id, item.day, item.meal_id)
        )
        await db.commit()
    return {"message": "Meal added to plan", "plan_id": plan_id, "day": item.day, "meal_id": item.meal_id} 