from datetime import datetime, timedelta, timezone
from typing import Literal
import uuid

from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.hash import bcrypt

from .config import settings
from app.db.session import SessionLocal
from app.db import models


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")
ALGORITHM = "HS256"


class TokenData(BaseModel):
    sub: str
    role: Literal["admin", "analyst", "viewer"]
    jti: str


def create_access_token(username: str, role: str, expires_minutes: int = 120) -> str:
    expire = datetime.now(tz=timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode = {
        "sub": username,
        "role": role,
        "exp": expire,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        return TokenData(sub=payload["sub"], role=payload["role"], jti=payload["jti"])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    return decode_token(token)


def require_role(*allowed_roles: str):
    def checker(user: TokenData = Depends(get_current_user)) -> TokenData:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden: role not allowed")
        return user

    return checker


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_user_password_db(db: Session, username: str, password: str):
    u = db.query(models.User).filter(models.User.username == username).one_or_none()
    if not u:
        return None
    if not bcrypt.verify(password, u.password_hash):
        return None
    return {"username": u.username, "role": u.role}
