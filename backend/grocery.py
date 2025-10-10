from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional, List
import aiosqlite
from database import DB_PATH
from models import PantryItemCreate, PantryItemOut
from auth import SECRET_KEY, ALGORITHM

security = HTTPBearer()
router = APIRouter(prefix="/grocery", tags=["grocery"])

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)) -> int:
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["user_id"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/", response_model=PantryItemOut)
async def add_grocery_item(item: PantryItemCreate, user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("INSERT INTO grocery_items (user_id, name) VALUES (?, ?)", (user_id, item.name))
        await db.commit()
        item_id = cursor.lastrowid
    return PantryItemOut(id=item_id, user_id=user_id, name=item.name)

@router.get("/", response_model=List[PantryItemOut])
async def list_grocery_items(
    user_id: int = Depends(get_current_user),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    async with aiosqlite.connect(DB_PATH) as db:
        query = "SELECT id, user_id, name FROM grocery_items WHERE user_id = ?"
        params = [user_id]
        if search:
            query += " AND name LIKE ?"
            params.append(f"%{search}%")
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
    return [PantryItemOut(id=row[0], user_id=user_id, name=row[2]) for row in rows]

@router.delete("/{item_id}")
async def delete_grocery_item(item_id: int, user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM grocery_items WHERE id = ? AND user_id = ?", (item_id, user_id))
        await db.commit()
    return {"message": "Grocery item deleted"}

