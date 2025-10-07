from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import aiosqlite
from pydantic import BaseModel
from auth import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import DB_PATH

router = APIRouter(prefix="/utensils", tags=["utensils"])
security = HTTPBearer()


class UtensilCreate(BaseModel):
    name: str
    category: Optional[str] = "Other"


class UtensilOut(BaseModel):
    id: int
    user_id: int
    name: str
    category: str


def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["user_id"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/", response_model=UtensilOut)
async def add_utensil(utensil: UtensilCreate, user_id: int = Depends(get_current_user)):
    """Add a new utensil to user's kitchen inventory"""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO utensils (user_id, name, category) VALUES (?, ?, ?)",
            (user_id, utensil.name, utensil.category or "Other")
        )
        await db.commit()
        utensil_id = cursor.lastrowid
    return UtensilOut(
        id=utensil_id,
        user_id=user_id,
        name=utensil.name,
        category=utensil.category or "Other"
    )


@router.get("/", response_model=List[UtensilOut])
async def list_utensils(
    user_id: int = Depends(get_current_user),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    """Get all utensils for the current user"""
    query = "SELECT id, user_id, name, category FROM utensils WHERE user_id = ?"
    params = [user_id]
    
    if search:
        query += " AND name LIKE ?"
        params.append(f"%{search}%")
    
    if category:
        query += " AND category = ?"
        params.append(category)
    
    query += " ORDER BY category, name"
    
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
    
    return [
        UtensilOut(id=row[0], user_id=row[1], name=row[2], category=row[3])
        for row in rows
    ]


@router.put("/{utensil_id}", response_model=UtensilOut)
async def update_utensil(
    utensil_id: int,
    utensil: UtensilCreate,
    user_id: int = Depends(get_current_user)
):
    """Update a utensil"""
    async with aiosqlite.connect(DB_PATH) as db:
        # Check if utensil exists and belongs to user
        cursor = await db.execute(
            "SELECT id FROM utensils WHERE id = ? AND user_id = ?",
            (utensil_id, user_id)
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Utensil not found")
        
        # Update the utensil
        await db.execute(
            "UPDATE utensils SET name = ?, category = ? WHERE id = ? AND user_id = ?",
            (utensil.name, utensil.category or "Other", utensil_id, user_id)
        )
        await db.commit()
    
    return UtensilOut(
        id=utensil_id,
        user_id=user_id,
        name=utensil.name,
        category=utensil.category or "Other"
    )


@router.delete("/{utensil_id}")
async def delete_utensil(utensil_id: int, user_id: int = Depends(get_current_user)):
    """Delete a utensil"""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "DELETE FROM utensils WHERE id = ? AND user_id = ?",
            (utensil_id, user_id)
        )
        await db.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Utensil not found")
    
    return {"message": "Utensil deleted"}


@router.get("/categories")
async def get_categories(user_id: int = Depends(get_current_user)):
    """Get list of utensil categories"""
    categories = [
        "Cookware",      # Pots, pans, skillets
        "Bakeware",      # Baking sheets, cake pans
        "Knives",        # Chef's knife, paring knife
        "Utensils",      # Spoons, spatulas, whisks
        "Appliances",    # Blender, mixer, food processor
        "Measuring",     # Measuring cups, spoons, scales
        "Prep Tools",    # Cutting board, peeler, grater
        "Storage",       # Containers, jars
        "Other"
    ]
    return {"categories": categories}
