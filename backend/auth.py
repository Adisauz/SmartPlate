from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
import aiosqlite
import redis.asyncio as redis
from database import DB_PATH

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    username: str
    password: str
    name: str

class UserLogin(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register(user: UserRegister):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id FROM users WHERE username = ?", (user.username,))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")
        password_hash = pwd_context.hash(user.password)
        await db.execute("INSERT INTO users (username, password_hash, name) VALUES (?, ?, ?)", (user.username, password_hash, user.name))
        await db.commit()
    return {"message": "User registered successfully"}

@router.post("/login")
async def login(user: UserLogin):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id, password_hash, name FROM users WHERE username = ?", (user.username,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid username")
        if not pwd_context.verify(user.password, row[1]):
            raise HTTPException(status_code=401, detail="Wrong password")
        user_id = row[0]
        name = row[2]
        token = jwt.encode({"user_id": user_id, "username": user.username}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "name": name} 