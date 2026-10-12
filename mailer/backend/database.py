import logging
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Configure logging
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:password123@db:5432/castle_db")

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
except Exception as e:
    logger.error(f"Database engine initialization failed: {str(e)}")
    raise e

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        raise e
    finally:
        db.close()
