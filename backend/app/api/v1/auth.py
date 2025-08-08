from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from ...core.security import create_access_token, verify_user_password

router = APIRouter(prefix="/auth", tags=["auth"])

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

@router.post("/token", response_model=TokenOut, summary="Get JWT token")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = verify_user_password(form.username, form.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(form.username, user["role"])
    return TokenOut(access_token=token, role=user["role"])
