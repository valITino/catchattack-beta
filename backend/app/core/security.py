from datetime import datetime, timedelta, timezone
from typing import Optional, Literal

from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from .config import settings


def _load_users() -> dict:
    users: dict[str, dict[str, str]] = {}
    raw = getattr(settings, "users", [])
    for item in raw:
        users[item["username"]] = item
    return users


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")
ALGORITHM = "HS256"


class TokenData(BaseModel):
    sub: str
    role: Literal["admin", "analyst", "viewer"]


def create_access_token(username: str, role: str, expires_minutes: int = 120) -> str:
    expire = datetime.now(tz=timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode = {"sub": username, "role": role, "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        return TokenData(sub=payload["sub"], role=payload["role"])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    return decode_token(token)


def require_role(*allowed_roles: str):
    def checker(user: TokenData = Depends(get_current_user)) -> TokenData:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden: role not allowed")
        return user

    return checker


USERS = _load_users()


def verify_user_password(username: str, password: str) -> Optional[dict]:
    user = USERS.get(username)
    if not user:
        return None
    return user if user["password"] == password else None

