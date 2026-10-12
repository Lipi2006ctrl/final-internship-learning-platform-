from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from database import Base
import uuid
from datetime import datetime, timezone

def safe_now():
    try:
        return datetime.now(timezone.utc)
    except Exception as e:
        # Fallback to naive if timezone fails for some extreme reason
        return datetime.utcnow()

class User(Base):
    __tablename__ = "user"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(String(50), nullable=False, default="User")
    userName = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=True)
    kingdomStatus = Column(String(50), default="Kingdom Beginner")
    createdAt = Column(DateTime(timezone=True), default=safe_now)
    isDeleted = Column(Boolean, default=False)

class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)
    options = Column(JSONB)
    correctAnswer = Column(Text)
    difficultyLevel = Column(String(50))

class OtpCode(Base):
    __tablename__ = "otp_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False)
    otp = Column(String(6), nullable=False)
    attempts = Column(Integer, default=0)
    createdAt = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expiresAt = Column(DateTime(timezone=True), nullable=False)
    isUsed = Column(Boolean, default=False)
