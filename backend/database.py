# database.py

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Configuration ---
# Get database URL from environment variable
# Example format: "postgresql://user:password@localhost:5432/dbname"
# Make sure to set this in your .env file
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL not found in environment variables. Please check your .env file.")

# --- SQLAlchemy Setup ---
# Create the SQLAlchemy engine
# `echo=True` is useful for debugging, remove or set to False in production
engine = create_engine(DATABASE_URL, echo=True)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for declarative models
Base = declarative_base()

# --- Dependency for FastAPI ---
def get_db():
    """
    Dependency to get a database session.
    This will be used by FastAPI's dependency injection system.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Utility to initialize the database ---
def init_db():
    """
    Creates all tables defined in models.
    """
    from models import DebateSession, CouncilMember # Import your models here
    # It's important to import the models *before* calling create_all
    # This ensures SQLAlchemy knows about them.
    
    # Create all tables in the database
    # This is equivalent to "Create Table" statements
    Base.metadata.create_all(bind=engine, checkfirst=True)
    print("✅ Database tables created/verified.")

# --- Optional: Test database connection ---
def test_connection():
    """
    Tests the database connection.
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful.")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    # This block runs if you execute this file directly (e.g., `python database.py`)
    # Useful for testing the connection and initializing the DB
    test_connection()
    init_db()
