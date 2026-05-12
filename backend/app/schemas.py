from typing import Dict, Any
from pydantic import BaseModel, EmailStr, Field


class PredictAllRequest(BaseModel):
    code: str
    language: str = "unknown"


class SinglePrediction(BaseModel):
    label: int
    prediction: str
    confidence: float
    probabilities: Dict[str, float]


class PredictAllResponse(BaseModel):
    input: Dict[str, Any]
    predictions: Dict[str, Any]


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_.-]+$")
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    re_password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    username: str = Field(min_length=3, max_length=40)
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
