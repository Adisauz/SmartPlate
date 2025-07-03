from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str

class MealBase(BaseModel):
    name: str
    calories: int
    image: Optional[str] = None

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
    calories: int

class PantryItemCreate(PantryItemBase):
    pass

class PantryItemOut(PantryItemBase):
    id: int
    user_id: int 