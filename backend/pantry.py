from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import aiosqlite
from models import PantryItemCreate, PantryItemOut
from auth import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import DB_PATH

router = APIRouter(prefix="/pantry", tags=["pantry"])
security = HTTPBearer()

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["user_id"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/", response_model=PantryItemOut)
async def add_pantry_item(item: PantryItemCreate, user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO pantry_items (user_id, name) VALUES (?, ?)",
            (user_id, item.name)
        )
        await db.commit()
        item_id = cursor.lastrowid
    return PantryItemOut(id=item_id, user_id=user_id, name=item.name)

@router.get("/", response_model=List[PantryItemOut])
async def list_pantry_items(
    user_id: int = Depends(get_current_user),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    query = "SELECT id, name FROM pantry_items WHERE user_id = ?"
    params = [user_id]
    if search:
        query += " AND name LIKE ?"
        params.append(f"%{search}%")

    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
    return [PantryItemOut(id=row[0], user_id=user_id, name=row[1]) for row in rows]

@router.delete("/{item_id}")
async def delete_pantry_item(item_id: int, user_id: int = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM pantry_items WHERE id = ? AND user_id = ?", (item_id, user_id))
        await db.commit()
    return {"message": "Pantry item deleted"} 