import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# Configure logging
logger = logging.getLogger(__name__)

SECRET_KEY = "supersecretjwtkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        return False

def get_password_hash(password):
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Password hashing error: {str(e)}")
        raise e

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"JWT creation error: {str(e)}")
        raise e