from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
import aiosqlite
import redis.asyncio as redis
import secrets
from datetime import datetime, timedelta
from database import DB_PATH

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class ForgotPassword(BaseModel):
    username: str

class ResetPassword(BaseModel):
    token: str
    new_password: str

@router.post("/register")
async def register(user: UserRegister):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id FROM users WHERE LOWER(username) = LOWER(?)", (user.username,))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")
        password_hash = pwd_context.hash(user.password)
        await db.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (user.username, password_hash))
        await db.commit()
    return {"message": "User registered successfully"}

@router.post("/login")
async def login(user: UserLogin):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id, password_hash, username, name FROM users WHERE LOWER(username) = LOWER(?)", (user.username,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid username")
        if not pwd_context.verify(user.password, row[1]):
            raise HTTPException(status_code=401, detail="Wrong password")
        user_id = row[0]
        username = row[2]
        name = row[3] or username  # Use name if available, otherwise username
        exp = datetime.utcnow() + timedelta(hours=12)
        token = jwt.encode({"user_id": user_id, "username": username, "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "username": username, "name": name}

@router.post("/forgot-password")
async def forgot_password(request: ForgotPassword):
    async with aiosqlite.connect(DB_PATH) as db:
        # Check if user exists
        cursor = await db.execute("SELECT id FROM users WHERE LOWER(username) = LOWER(?)", (request.username,))
        user_row = await cursor.fetchone()
        
        if not user_row:
            # For security, don't reveal if username exists or not
            return {"message": "If the username exists, a reset token has been generated"}
        
        user_id = user_row[0]
        
        # Generate a secure random token
        reset_token = secrets.token_urlsafe(32)
        
        # Set expiration time (24 hours from now)
        expires_at = datetime.now() + timedelta(hours=24)
        
        # Save the reset token to database
        await db.execute(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
            (user_id, reset_token, expires_at)
        )
        await db.commit()
        
        # In production, you would email this token to the user
        # For development, we'll return it directly
        return {
            "message": "Password reset token generated",
            "reset_token": reset_token,
            "note": "In production, this token would be sent via email"
        }

@router.post("/reset-password")
async def reset_password(request: ResetPassword):
    async with aiosqlite.connect(DB_PATH) as db:
        # Find the reset token
        cursor = await db.execute("""
            SELECT user_id, expires_at, used FROM password_reset_tokens 
            WHERE token = ?
        """, (request.token,))
        token_row = await cursor.fetchone()
        
        if not token_row:
            raise HTTPException(status_code=400, detail="Invalid reset token")
        
        user_id, expires_at_str, used = token_row
        
        # Check if token is already used
        if used:
            raise HTTPException(status_code=400, detail="Reset token has already been used")
        
        # Check if token is expired
        expires_at = datetime.fromisoformat(expires_at_str)
        if datetime.now() > expires_at:
            raise HTTPException(status_code=400, detail="Reset token has expired")
        
        # Hash the new password
        password_hash = pwd_context.hash(request.new_password)
        
        # Update the user's password
        await db.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (password_hash, user_id)
        )
        
        # Mark the token as used
        await db.execute(
            "UPDATE password_reset_tokens SET used = TRUE WHERE token = ?",
            (request.token,)
        )
        
        await db.commit()
        
        return {"message": "Password has been reset successfully"} 