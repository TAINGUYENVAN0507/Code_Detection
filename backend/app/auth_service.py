import hashlib
import os
from datetime import datetime, timedelta, timezone

import bcrypt
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError, PyMongoError


MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "code_detection")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-key")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=3000)
db = client[MONGODB_DB_NAME]
users_collection = db["users"]

try:
    users_collection.create_index("email", unique=True)
    users_collection.create_index("username", unique=True)
except Exception as exc:
    print(f"MongoDB index setup skipped: {exc}")


def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
    }


def hash_password(password: str):
    password_digest = hashlib.sha256(password.encode("utf-8")).digest()
    return bcrypt.hashpw(password_digest, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str):
    password_digest = hashlib.sha256(password.encode("utf-8")).digest()
    return bcrypt.checkpw(password_digest, password_hash.encode("utf-8"))


def create_access_token(user_id: str):
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": user_id,
        "exp": expires_at,
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_user(username: str, email: str, password: str):
    user = {
        "username": username.strip().lower(),
        "email": email.lower(),
        "password_hash": hash_password(password),
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = users_collection.insert_one(user)
    except DuplicateKeyError as exc:
        existing_user = users_collection.find_one(
            {
                "$or": [
                    {"username": user["username"]},
                    {"email": user["email"]},
                ]
            }
        )
        duplicate_field = (
            "Username" if existing_user and existing_user.get("username") == user["username"] else "Email"
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{duplicate_field} is already registered",
        ) from exc
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to MongoDB",
        ) from exc

    user["_id"] = result.inserted_id
    return user


def authenticate_user(username: str, password: str):
    try:
        user = users_collection.find_one({"username": username.strip().lower()})
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to MongoDB",
        ) from exc

    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    return user


def get_user_by_id(user_id: str):
    if not ObjectId.is_valid(user_id):
        return None

    try:
        return users_collection.find_one({"_id": ObjectId(user_id)})
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to MongoDB",
        ) from exc


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except JWTError as exc:
        raise credentials_error from exc

    if not user_id:
        raise credentials_error

    user = get_user_by_id(user_id)

    if not user:
        raise credentials_error

    return user
