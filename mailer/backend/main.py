import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, engine, Base
from models import User, OtpCode
from auth import verify_password, get_password_hash, create_access_token
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from email_service import generate_otp, send_otp_email

logger = logging.getLogger(__name__)

ADMIN_PASSKEY = os.getenv("ADMIN_PASSKEY", "admin123")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

app = FastAPI(title="Castle Kingdom API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models (Pydantic) for API Validation ---

class UserCreate(BaseModel):
    """Schema for new user registration."""
    userName: str
    email: str
    password: str
    passkey: Optional[str] = None
    kingdomStatus: str = "Kingdom Beginner"
    otp: str  # Required for verification during registration

class OtpRequest(BaseModel):
    """Schema for requesting a new OTP via email."""
    email: str

class UserLogin(BaseModel):
    """Schema for initial login (Email/Password)."""
    email: str
    password: str

class OtpVerify(BaseModel):
    """Schema for verifying a login OTP."""
    email: str
    otp: str

class GoogleLogin(BaseModel):
    """Schema for Google OAuth login."""
    idToken: str

class PasswordResetRequest(BaseModel):
    """Schema for initiating password reset."""
    email: str

class ResetPassword(BaseModel):
    """Schema for finalizing password reset."""
    email: str
    otp: str
    newPassword: str

# --- Authentication Endpoints ---

@app.post("/api/auth/request-signup-otp")
def request_signup_otp(data: OtpRequest, db: Session = Depends(get_db)):
    """
    Step 1 of Signup:
    Validates email availability and sends a 6-digit OTP for verification.
    """
    try:
        # Check if user already exists
        db_user = db.query(User).filter(User.email == data.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="This email is already registered.")
        
        # Generate and store original OTP
        otp = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
        
        # Invalidate any previous OTPs for this email to prevent confusion
        db.query(OtpCode).filter(OtpCode.email == data.email, OtpCode.isUsed == False).update({"isUsed": True})
        
        new_otp = OtpCode(
            email=data.email,
            otp=otp,
            expiresAt=expires_at
        )
        db.add(new_otp)
        db.commit()
        
        # Trigger email delivery
        email_sent = send_otp_email(data.email, otp)
        
        return {
            "message": "Verification code sent to your email." if email_sent else "Verification code generated internally (Check Logs/DBeaver).",
            "email": data.email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup OTP Request Error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to generate verification code. Please try again.")

@app.post("/api/auth/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    """
    Step 2 of Signup:
    Verifies the OTP and creates the new user record.
    """
    try:
        # 1. Retrieve the latest active OTP for this email
        otp_record = db.query(OtpCode).filter(
            OtpCode.email == user.email,
            OtpCode.isUsed == False
        ).order_by(OtpCode.createdAt.desc()).first()
        
        if not otp_record:
            raise HTTPException(status_code=400, detail="No active verification code found. Please request a new one.")
        
        # 2. Check for expiry (5-minute window)
        if datetime.now(timezone.utc) > otp_record.expiresAt:
            otp_record.isUsed = True
            db.commit()
            raise HTTPException(status_code=400, detail="Your verification code has expired.")
        
        # 3. Validate OTP and track attempts
        if otp_record.otp != user.otp:
            otp_record.attempts += 1
            if otp_record.attempts >= 3:
                otp_record.isUsed = True
                db.commit()
                raise HTTPException(status_code=400, detail="Too many failed attempts. This code is now invalid.")
            db.commit()
            raise HTTPException(status_code=400, detail=f"Invalid code. {3 - otp_record.attempts} attempts remaining.")
        
        # 4. OTP successfully verified
        otp_record.isUsed = True

        # Final check for double-registration during the OTP window
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered.")
        
        # Determine Role based on Admin Passkey
        role = "User"
        if user.passkey and user.passkey == ADMIN_PASSKEY:
            role = "Admin"
        elif user.passkey:
            raise HTTPException(status_code=400, detail="Invalid admin passkey.")
        
        # Admins get 'All' kingdoms, regular users get their selection
        level = "All" if role == "Admin" else user.kingdomStatus
        
        # Create User with hashed password
        new_user = User(
            userName=user.userName,
            email=user.email,
            password=get_password_hash(user.password),
            role=role,
            kingdomStatus=level
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Issue JWT Access Token
        access_token = create_access_token(data={"sub": new_user.email, "id": str(new_user.id), "role": new_user.role})
        return {
            "message": "Welcome to the Kingdom! Your account is ready.",
            "access_token": access_token,
            "kingdomStatus": new_user.kingdomStatus,
            "role": new_user.role
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup Verification Error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Signup failed due to a server error.")

@app.post("/api/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    Step 1 of Login (Production Workflow):
    Validates credentials and sends an OTP for 2FA.
    """
    try:
        # Validate Credentials
        db_user = db.query(User).filter(User.email == user.email).first()
        if not db_user or not verify_password(user.password, db_user.password):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        
        # Generate and store 2FA OTP
        otp = generate_otp()
        db.query(OtpCode).filter(OtpCode.email == user.email, OtpCode.isUsed == False).update({"isUsed": True})
        
        new_otp = OtpCode(
            email=user.email,
            otp=otp,
            expiresAt=datetime.now(timezone.utc) + timedelta(minutes=5)
        )
        db.add(new_otp)
        db.commit()
        
        # Trigger email
        email_sent = send_otp_email(user.email, otp)
        
        return {
            "message": "Login code sent to your email." if email_sent else "Login code generated (Check Logs/DBeaver).",
            "email": user.email
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login Step 1 Error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error during login.")

@app.post("/api/auth/verify-otp")
def verify_login_otp(data: OtpVerify, db: Session = Depends(get_db)):
    """
    Step 2 of Login:
    Verifies the 2FA code and issues the session token.
    """
    try:
        otp_record = db.query(OtpCode).filter(
            OtpCode.email == data.email,
            OtpCode.isUsed == False
        ).order_by(OtpCode.createdAt.desc()).first()
        
        if not otp_record or datetime.now(timezone.utc) > otp_record.expiresAt:
            raise HTTPException(status_code=400, detail="Verification code not found or expired.")
        
        if otp_record.otp != data.otp:
            otp_record.attempts += 1
            db.commit()
            if otp_record.attempts >= 3:
                otp_record.isUsed = True
                db.commit()
                raise HTTPException(status_code=400, detail="Code invalidated after too many failed attempts.")
            raise HTTPException(status_code=400, detail="Incorrect verification code.")
        
        # Login Success
        otp_record.isUsed = True
        db.commit()
        
        db_user = db.query(User).filter(User.email == data.email).first()
        access_token = create_access_token(data={"sub": db_user.email, "id": str(db_user.id), "role": db_user.role})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "kingdomStatus": db_user.kingdomStatus,
            "userName": db_user.userName,
            "role": db_user.role
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login Step 2 Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Verification failed.")

@app.post("/api/auth/google")
def google_login(data: GoogleLogin, db: Session = Depends(get_db)):
    """
    Handles Google OAuth Authentication.
    """
    try:
        # Verify Google ID Token integrity
        idinfo = id_token.verify_oauth2_token(data.idToken, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Invalid token issuer.')

        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])

        db_user = db.query(User).filter(User.email == email).first()
        
        if not db_user:
            # Auto-register Google users
            db_user = User(
                userName=name,
                email=email,
                password=None,
                role="User",
                kingdomStatus="Kingdom Beginner"
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            
        access_token = create_access_token(data={"sub": db_user.email, "id": str(db_user.id), "role": db_user.role})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "kingdomStatus": db_user.kingdomStatus,
            "userName": db_user.userName,
            "role": db_user.role
        }
        
    except Exception as e:
        logger.error(f"Google Login Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Google authentication failed.")

# --- Password Reset Flow ---

@app.post("/api/auth/forgot-password")
def forgot_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Step 1 & 2 of Password Reset:
    Validates user existence and sends a recovery OTP.
    """
    try:
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="No account found with this email.")
        
        if user.password is None:
             raise HTTPException(status_code=400, detail="This account uses Google Login. Please sign in with Google.")

        # Generate recovery OTP
        otp = generate_otp()
        db.query(OtpCode).filter(OtpCode.email == data.email, OtpCode.isUsed == False).update({"isUsed": True})
        
        new_otp = OtpCode(
            email=data.email,
            otp=otp,
            expiresAt=datetime.now(timezone.utc) + timedelta(minutes=5)
        )
        db.add(new_otp)
        db.commit()
        
        # Send OTP via mailer
        email_sent = send_otp_email(data.email, otp)
        
        return {
            "message": "Recovery code sent to your email." if email_sent else "Recovery code generated (Check Logs).",
            "email": data.email
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forgot Password Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process recovery request.")

@app.post("/api/auth/verify-reset-otp")
def verify_reset_otp(data: OtpVerify, db: Session = Depends(get_db)):
    """
    Step 4: Validates the recovery OTP.
    """
    try:
        otp_record = db.query(OtpCode).filter(
            OtpCode.email == data.email,
            OtpCode.isUsed == False
        ).order_by(OtpCode.createdAt.desc()).first()
        
        if not otp_record or datetime.now(timezone.utc) > otp_record.expiresAt:
            raise HTTPException(status_code=400, detail="Recovery code not found or expired.")
        
        if otp_record.otp != data.otp:
            otp_record.attempts += 1
            db.commit()
            if otp_record.attempts >= 3:
                otp_record.isUsed = True
                db.commit()
                raise HTTPException(status_code=400, detail="Code invalidated after too many failed attempts.")
            raise HTTPException(status_code=400, detail="Incorrect recovery code.")
        
        return {"message": "OTP verified. You may now reset your password."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify Reset OTP Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Verification failed.")

@app.post("/api/auth/reset-password")
def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    """
    Step 5 & 6: Updates the user password after final verification.
    """
    try:
        # Re-verify OTP one last time for the final action
        otp_record = db.query(OtpCode).filter(
            OtpCode.email == data.email,
            OtpCode.otp == data.otp,
            OtpCode.isUsed == False
        ).first()
        
        if not otp_record or datetime.now(timezone.utc) > otp_record.expiresAt:
            raise HTTPException(status_code=400, detail="Unauthorized reset request or expired code.")
        
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
             raise HTTPException(status_code=404, detail="User not found.")

        # Update and hash new password
        user.password = get_password_hash(data.newPassword)
        otp_record.isUsed = True # Mark OTP as done
        db.commit()
        
        return {"message": "Password successfully reset. Please login."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset Password Error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to reset password.")

@app.get("/api/ping")
def ping():
    """Health check endpoint."""
    try:
        return {"status": "online", "message": "Castle Kingdom API is responsive."}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Health check failed.")
