from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import aiosqlite
from database import DB_PATH
from models import UserOut, UserProfileUpdate

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
            "SELECT id, username, name, email, height, weight FROM users WHERE id = ?",
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
            weight=row[5]
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
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Add user_id to values for WHERE clause
        values.append(user_id)
        
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
        await db.execute(query, values)
        await db.commit()
        
        # Fetch updated profile
        cursor = await db.execute(
            "SELECT id, username, name, email, height, weight FROM users WHERE id = ?",
            (user_id,)
        )
        row = await cursor.fetchone()
        
        return UserOut(
            id=row[0],
            username=row[1],
            name=row[2],
            email=row[3],
            height=row[4],
            weight=row[5]
        )

