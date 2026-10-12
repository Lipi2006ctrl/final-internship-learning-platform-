import os
import secrets
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure logging
logger = logging.getLogger(__name__)

def generate_otp():
    """
    Generates a cryptographically secure 6-digit OTP.
    Uses secrets module for production-grade randomness.
    """
    try:
        return "".join([str(secrets.SystemRandom().randint(0, 9)) for _ in range(6)])
    except Exception as e:
        logger.error(f"OTP generation failure: {str(e)}")
        # Fallback to a less secure but functional method if secrets fails
        import random
        return "".join([str(random.randint(0, 9)) for _ in range(6)])

import requests

def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Delegates email sending to the Node.js 'mailer' microservice.
    """
    try:
        # Internal debug log
        print(f"--- [SECURITY DEBUG] OTP generated for {to_email}: {otp} ---")
        
        mailer_url = "http://mailer:3000/send-otp"
        
        print(f"--- [MAILER BRIDGE] Sending request to Node.js mailer for {to_email} ---")
        response = requests.post(
            mailer_url,
            json={"email": to_email, "otp": otp},
            timeout=15
        )
        
        if response.status_code == 200:
            print(f"--- [MAILER BRIDGE SUCCESS] Node.js mailer confirmed delivery ---")
            return True
        else:
            error_msg = response.json().get('error', 'Unknown Error')
            print(f"--- [MAILER BRIDGE ERROR] Node.js mailer rejected: {error_msg} ---")
            return False
            
    except Exception as e:
        logger.error(f"Mailer service critical failure: {str(e)}")
        print(f"--- [MAILER BRIDGE CRITICAL] Connection to mailer service failed: {str(e)} ---")
        return False
