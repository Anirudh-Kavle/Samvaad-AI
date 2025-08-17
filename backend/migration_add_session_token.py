# migration_add_session_token.py
# Run this script to add the session_token column to existing debates

import os
import uuid
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def migrate_database():
    """
    Add session_token column to existing DebateSession records
    """
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found")
        return

    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # First, check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'debate_sessions' 
                AND column_name = 'session_token';
            """))
            
            if result.fetchone():
                print("✅ session_token column already exists")
                return
            
            # Add the column
            print("🔄 Adding session_token column...")
            conn.execute(text("ALTER TABLE debate_sessions ADD COLUMN session_token VARCHAR;"))
            
            # Generate tokens for existing records
            print("🔄 Generating tokens for existing debates...")
            existing_debates = conn.execute(text("SELECT id FROM debate_sessions WHERE session_token IS NULL;"))
            
            for row in existing_debates:
                token = str(uuid.uuid4())
                conn.execute(
                    text("UPDATE debate_sessions SET session_token = :token WHERE id = :id"),
                    {"token": token, "id": row.id}
                )
            
            # Make the column NOT NULL
            conn.execute(text("ALTER TABLE debate_sessions ALTER COLUMN session_token SET NOT NULL;"))
            
            # Commit the transaction
            conn.commit()
            print("✅ Migration completed successfully!")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate_database()