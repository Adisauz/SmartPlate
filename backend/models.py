from pydantic import BaseModel
from typing import Optional, List
from datetime import date
import json

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str

class Nutrients(BaseModel):
    calories: int
    protein: int
    carbs: int
    fat: int

class MealBase(BaseModel):
    name: str
    ingredients: List[str]
    instructions: str
    nutrients: Nutrients
    prep_time: int = 0  # prep time in minutes
    cook_time: int = 0  # cook time in minutes
    image: Optional[str] = None
    
    @property
    def calories(self) -> int:
        """Backward compatibility property"""
        return self.nutrients.calories
    
    @property
    def total_time(self) -> int:
        """Calculate total time (prep + cook) in minutes"""
        return self.prep_time + self.cook_time

class MealCreate(MealBase):
    pass

class MealOut(MealBase):
    id: int

class MealPlanItemBase(BaseModel):
    day: int  # 0=Monday, 6=Sunday
    meal_id: int

class MealPlanCreate(BaseModel):
    start_date: date
    items: List[MealPlanItemBase]

class MealPlanOut(BaseModel):
    id: int
    user_id: int
    start_date: date
    items: List[MealPlanItemBase]

class MealPlanItemOut(MealPlanItemBase):
    id: int

class PantryItemBase(BaseModel):
    name: str

class PantryItemCreate(PantryItemBase):
    pass

class PantryItemOut(PantryItemBase):
    id: int
    user_id: int 