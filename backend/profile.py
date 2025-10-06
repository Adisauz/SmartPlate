from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import aiosqlite
from database import DB_PATH
from models import UserOut, UserProfileUpdate
from datetime import date
from typing import Dict

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
security = HTTPBearer()

router = APIRouter(prefix="/profile", tags=["profile"])

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["user_id"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/", response_model=UserOut)
async def get_profile(user_id: int = Depends(get_current_user)):
    """Get the current user's profile information"""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """SELECT id, username, name, email, height, weight, 
               daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fat_goal,
               breakfast_time, lunch_time, dinner_time, snack_time,
               dietary_preferences, allergies, cuisine_preferences
               FROM users WHERE id = ?""",
            (user_id,)
        )
        row = await cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserOut(
            id=row[0],
            username=row[1],
            name=row[2],
            email=row[3],
            height=row[4],
            weight=row[5],
            daily_calorie_goal=row[6],
            daily_protein_goal=row[7],
            daily_carbs_goal=row[8],
            daily_fat_goal=row[9],
            breakfast_time=row[10],
            lunch_time=row[11],
            dinner_time=row[12],
            snack_time=row[13],
            dietary_preferences=row[14],
            allergies=row[15],
            cuisine_preferences=row[16]
        )

@router.put("/", response_model=UserOut)
async def update_profile(
    profile: UserProfileUpdate,
    user_id: int = Depends(get_current_user)
):
    """Update the current user's profile information"""
    async with aiosqlite.connect(DB_PATH) as db:
        # Build update query dynamically based on provided fields
        update_fields = []
        values = []
        
        if profile.name is not None:
            update_fields.append("name = ?")
            values.append(profile.name)
        
        if profile.email is not None:
            update_fields.append("email = ?")
            values.append(profile.email)
        
        if profile.height is not None:
            update_fields.append("height = ?")
            values.append(profile.height)
        
        if profile.weight is not None:
            update_fields.append("weight = ?")
            values.append(profile.weight)
        
        if profile.daily_calorie_goal is not None:
            update_fields.append("daily_calorie_goal = ?")
            values.append(profile.daily_calorie_goal)
        
        if profile.daily_protein_goal is not None:
            update_fields.append("daily_protein_goal = ?")
            values.append(profile.daily_protein_goal)
        
        if profile.daily_carbs_goal is not None:
            update_fields.append("daily_carbs_goal = ?")
            values.append(profile.daily_carbs_goal)
        
        if profile.daily_fat_goal is not None:
            update_fields.append("daily_fat_goal = ?")
            values.append(profile.daily_fat_goal)
        
        if profile.breakfast_time is not None:
            update_fields.append("breakfast_time = ?")
            values.append(profile.breakfast_time)
        
        if profile.lunch_time is not None:
            update_fields.append("lunch_time = ?")
            values.append(profile.lunch_time)
        
        if profile.dinner_time is not None:
            update_fields.append("dinner_time = ?")
            values.append(profile.dinner_time)
        
        if profile.snack_time is not None:
            update_fields.append("snack_time = ?")
            values.append(profile.snack_time)
        
        if profile.dietary_preferences is not None:
            update_fields.append("dietary_preferences = ?")
            values.append(profile.dietary_preferences)
        
        if profile.allergies is not None:
            update_fields.append("allergies = ?")
            values.append(profile.allergies)
        
        if profile.cuisine_preferences is not None:
            update_fields.append("cuisine_preferences = ?")
            values.append(profile.cuisine_preferences)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Add user_id to values for WHERE clause
        values.append(user_id)
        
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
        await db.execute(query, values)
        await db.commit()
        
        # Fetch updated profile
        cursor = await db.execute(
            """SELECT id, username, name, email, height, weight,
               daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fat_goal,
               breakfast_time, lunch_time, dinner_time, snack_time,
               dietary_preferences, allergies, cuisine_preferences
               FROM users WHERE id = ?""",
            (user_id,)
        )
        row = await cursor.fetchone()
        
        return UserOut(
            id=row[0],
            username=row[1],
            name=row[2],
            email=row[3],
            height=row[4],
            weight=row[5],
            daily_calorie_goal=row[6],
            daily_protein_goal=row[7],
            daily_carbs_goal=row[8],
            daily_fat_goal=row[9],
            breakfast_time=row[10],
            lunch_time=row[11],
            dinner_time=row[12],
            snack_time=row[13],
            dietary_preferences=row[14],
            allergies=row[15],
            cuisine_preferences=row[16]
        )

@router.get("/nutrition/today", response_model=Dict)
async def get_today_nutrition(user_id: int = Depends(get_current_user)):
    """Get today's nutrition intake from meal plan"""
    today = date.today()
    weekday = today.weekday()  # 0=Monday, 6=Sunday
    
    async with aiosqlite.connect(DB_PATH) as db:
        # Get today's meals from the meal plan
        cursor = await db.execute("""
            SELECT m.calories, m.protein, m.carbs, m.fat
            FROM meal_plan_items mpi
            JOIN meal_plans mp ON mpi.meal_plan_id = mp.id
            JOIN meals m ON mpi.meal_id = m.id
            WHERE mp.user_id = ? AND mpi.day = ?
        """, (user_id, weekday))
        
        meals = await cursor.fetchall()
        
        # Calculate totals
        total_calories = sum(meal[0] or 0 for meal in meals)
        total_protein = sum(meal[1] or 0 for meal in meals)
        total_carbs = sum(meal[2] or 0 for meal in meals)
        total_fat = sum(meal[3] or 0 for meal in meals)
        
        return {
            "calories": total_calories,
            "protein": total_protein,
            "carbs": total_carbs,
            "fat": total_fat
        }