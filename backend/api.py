# ==== UPDATED api.py ====
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import uuid
from typing import Dict, Any
import logging
import asyncio
from models import ChatHistoryResponse, ChatMessage
from contextlib import asynccontextmanager

# Import database and service components
from database import get_db, init_db, test_connection
from sqlalchemy.orm import Session
from services import create_debate_session, get_debate_session
from models import (
    DebateSetupRequest, 
    DebateInfoResponse, 
    CouncilMemberInfo, 
    ChatHistoryResponse,
    ChatMessage,  # Add this import
    UserMessageRequest
)
from council_chamber_manager import CouncilChamberManager

# --- Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# In-memory store for active debates
active_debates: Dict[str, CouncilChamberManager] = {}

# --- Database Initialization ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🏛️ CouncilChamber API starting up...")
    
    # Test database connection
    if not test_connection():
        logger.error("❌ Database connection failed. Please check your DATABASE_URL.")
        raise RuntimeError("Database connection failed")
    
    # Initialize database tables
    try:
        init_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise RuntimeError(f"Database initialization failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("🏛️ CouncilChamber API shutting down...")
    # Clean up active debates
    active_debates.clear()

app = FastAPI(
    title="CouncilChamber API",
    description="API for the CouncilChamber - Character Debate Simulator",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001","http://127.0.0.1:3000","http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper Functions ---
def _convert_manager_to_response_with_session(manager: CouncilChamberManager, session_id: str) -> DebateInfoResponse:
    council_members_info = [
        CouncilMemberInfo(name=member.character_name, agent_name=member.agent.name)
        for member in manager.members
    ]
    return DebateInfoResponse(
        session_id=session_id,
        user_name=manager.user_name,
        topic=manager.topic,
        council_members=council_members_info,
        message=f"🏛️ Council '{manager.topic}' is ready. Debate started in background."
    )

# --- API Endpoints ---

@app.get("/")
async def root():
    return {"message": "🏛️ Welcome to the CouncilChamber API!"}

@app.post("/debates/start/", response_model=DebateInfoResponse, status_code=201)
async def start_debate(debate_request: DebateSetupRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Sets up a new CouncilChamber debate session and starts it in the background.
    """
    logger.info(f"Setting up debate for user '{debate_request.user_name}' on topic '{debate_request.topic}'")
    
    if not debate_request.character_names or len(debate_request.character_names) < 2:
        raise HTTPException(status_code=400, detail="At least 2 characters are required.")
    if not debate_request.topic.strip():
        raise HTTPException(status_code=400, detail="A topic is required.")

    try:
        # 1. Save debate info to database
        db_debate = create_debate_session(
            db=db,
            user_name=debate_request.user_name,
            topic=debate_request.topic,
            character_names=debate_request.character_names
        )
        session_id = str(db_debate.id)
        logger.info(f"Debate session created in DB with ID: {session_id}")

        # 2. Create the CouncilChamberManager instance (in-memory)
        chamber_manager = CouncilChamberManager(
            session_id=session_id,
            user_name=debate_request.user_name,
            character_names=debate_request.character_names,
            topic=debate_request.topic
        )
        
        # 3. Store the manager instance in memory
        active_debates[session_id] = chamber_manager
        
        # 4. Start debate in background
        background_tasks.add_task(chamber_manager.start_debate_background_task)
        logger.info(f"Background debate task scheduled for session {session_id}")
        
        # 5. Return the setup information
        response_data = _convert_manager_to_response_with_session(chamber_manager, session_id)
        logger.info(f"Debate API session {session_id} setup successfully.")
        return response_data

    except Exception as e:
        logger.error(f"Failed to setup debate session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error while setting up debate: {str(e)}")

@app.get("/debates/{session_id}/status/")
async def get_debate_status(session_id: str, db: Session = Depends(get_db)):
    """
    Get the current status of a debate session.
    """
    try:
        uuid_obj = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format.")
        
    db_debate = get_debate_session(db, uuid_obj)
    if not db_debate:
        raise HTTPException(status_code=404, detail="Debate session not found in database.")
    
    manager = active_debates.get(session_id)
    if not manager:
        raise HTTPException(status_code=404, detail="Debate session manager not found in memory.")
    
    return {
        "session_id": session_id,
        "is_running": manager.is_running,
        "is_waiting_for_input": manager.is_waiting_for_input,
        "message_count": len(manager.get_chat_history()),
        "current_prompt": manager.current_prompt
    }

from fastapi import HTTPException
from uuid import UUID
from models import ChatHistoryResponse, ChatMessage

@app.get("/debates/{session_id}/history/", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the current chat history for a session, always returning is_active.
    """

    # Validate session ID format
    try:
        uuid_obj = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format.")

    # Verify the debate exists in DB
    db_debate = get_debate_session(db, uuid_obj)
    if not db_debate:
        raise HTTPException(status_code=404, detail="Debate session not found in database.")

    # Check if active debate manager exists
    manager = active_debates.get(session_id)
    if not manager:
        # Session exists in DB but not in active memory
        return ChatHistoryResponse(messages=[], is_active=False)

    # Get messages from manager
    raw_messages = manager.get_chat_history() or []
    messages = []

    for msg in raw_messages:
        try:
            if isinstance(msg, dict):
                content = msg.get("content") or msg.get("text") or msg.get("message") or ""
                sender = msg.get("name") or msg.get("sender") or msg.get("role") or msg.get("author") or "Unknown"
            elif isinstance(msg, (list, tuple)) and len(msg) >= 2:
                sender, content = msg[0], msg[1]
            else:
                sender = "Unknown"
                content = str(msg)
        except Exception:
            sender = "Unknown"
            content = str(msg)

        if content:
            messages.append(ChatMessage(role=sender, content=content))

    # Return with mandatory is_active
    return ChatHistoryResponse(messages=messages, is_active=True)



@app.post("/debates/{session_id}/message/")
async def send_user_message(session_id: str, user_message: UserMessageRequest, db: Session = Depends(get_db)):
    """
    Sends a message from the user to an active debate session.
    """
    try:
        uuid_obj = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format.")
        
    db_debate = get_debate_session(db, uuid_obj)
    if not db_debate:
        raise HTTPException(status_code=404, detail="Debate session not found in database.")
    
    manager = active_debates.get(session_id)
    if not manager:
        raise HTTPException(status_code=404, detail="Active debate session not found.")
    
    if not manager.is_running:
        raise HTTPException(status_code=400, detail="Debate session is not active.")
    
    if not manager.is_waiting_for_input:
        raise HTTPException(status_code=400, detail="Debate is not waiting for user input at this time.")
    
    # Send the message
    result_message = manager.send_user_message(user_message.message)
    
    return {
        "message": "Message sent successfully",
        "session_id": session_id,
        "user_message": user_message.message
    }

@app.delete("/debates/{session_id}/")
async def stop_debate(session_id: str, db: Session = Depends(get_db)):
    """
    Stops and removes a debate session.
    """
    try:
        uuid_obj = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format.")
    
    manager = active_debates.get(session_id)
    if manager:
        manager.stop_debate()
        del active_debates[session_id]
        logger.info(f"Debate session {session_id} stopped and removed.")
    
    return {"message": f"Debate session {session_id} stopped successfully."}

# --- Run the server ---
if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)