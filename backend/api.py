from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import uuid
from typing import Dict, Any
import logging
import threading
from sqlalchemy.orm import Session
from queue import Queue
from models import ChatHistoryResponse, ChatMessage
from contextlib import asynccontextmanager
from database import get_db

# --- thread-safe active_debates ---
active_debates: dict = {}
_active_debates_lock = threading.Lock()

def _set_active_debate(session_id: str, manager):
    with _active_debates_lock:
        active_debates[session_id] = manager

def _get_active_debate(session_id: str):
    with _active_debates_lock:
        return active_debates.get(session_id)

def _pop_active_debate(session_id: str):
    with _active_debates_lock:
        return active_debates.pop(session_id, None)

# --- message serializer ---
# Update your serialize_message function in backend/api.py

def serialize_message(msg: Any) -> dict:
    """
    Improved message serialization that properly extracts sender names from AutoGen messages.
    """
    print(f"DEBUG: Serializing message - Type: {type(msg)}, Content: {repr(msg)}")
    
    if isinstance(msg, dict):
        # AutoGen messages typically have 'name' for sender and 'content' for message
        sender = None
        message = None
        
        # Try AutoGen standard fields first
        if 'name' in msg and msg['name']:
            sender = msg['name']
        elif 'role' in msg and msg['role']:
            sender = msg['role']
        
        # Try other common sender fields
        if not sender:
            for field in ["sender", "author", "from", "speaker"]:
                if field in msg and msg[field]:
                    sender = msg[field]
                    break
        
        # Extract message content
        if 'content' in msg and msg['content']:
            message = msg['content']
        elif 'message' in msg and msg['message']:
            message = msg['message']
        elif 'text' in msg and msg['text']:
            message = msg['text']
        
        print(f"DEBUG: Extracted - Sender: '{sender}', Message preview: '{str(message)[:100]}...'")
        
        return {
            "sender": sender if sender else "Unknown",
            "message": message if message else str(msg)
        }
    
    # Handle tuple/list format
    if isinstance(msg, (list, tuple)) and len(msg) >= 2:
        sender, message = msg[0], msg[1]
        return {"sender": str(sender), "message": str(message)}
    
    # Handle object attributes
    sender = None
    message = None
    
    # Try to extract sender from object attributes
    for attr in ("name", "role", "sender", "author", "from", "speaker"):
        if hasattr(msg, attr):
            value = getattr(msg, attr)
            if value:
                sender = str(value)
                break
    
    # Try to extract message from object attributes
    for attr in ("content", "message", "text", "body"):
        if hasattr(msg, attr):
            value = getattr(msg, attr)
            if value:
                message = str(value)
                break
    
    # If we still don't have a message, try to_dict method
    if message is None:
        try:
            if hasattr(msg, "to_dict"):
                return serialize_message(msg.to_dict())
        except Exception:
            pass
        message = str(msg)
    
    print(f"DEBUG: Final result - Sender: '{sender}', Message preview: '{str(message)[:100]}...'")
    
    return {
        "sender": sender if sender else "Unknown",
        "message": message if message else "Empty message"
    }
# --- imports ---
from database import get_db, init_db, test_connection
from sqlalchemy.orm import Session
from services import create_debate_session, get_debate_session, list_debate_sessions, get_messages_for_session
from models import (
    DebateSetupRequest, 
    DebateInfoResponse, 
    CouncilMemberInfo, 
    ChatHistoryResponse,
    ChatMessage,
    UserMessageRequest
)
from council_chamber_manager import CouncilChamberManager

# --- Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Database Initialization ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🏛️ CouncilChamber API starting up...")
    if not test_connection():
        logger.error("❌ Database connection failed. Please check your DATABASE_URL.")
        raise RuntimeError("Database connection failed")
    try:
        init_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise RuntimeError(f"Database initialization failed: {e}")
    yield
    logger.info("🏛️ CouncilChamber API shutting down...")
    with _active_debates_lock:
        active_debates.clear()

app = FastAPI(
    title="CouncilChamber API",
    description="API for the CouncilChamber - Character Debate Simulator",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://localhost:3001",
        "http://127.0.0.1:3000", "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper ---
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

# --- Routes ---
@app.get("/")
async def root():
    return {"message": "🏛️ Welcome to the CouncilChamber API!"}

@app.post("/debates/start/", response_model=DebateInfoResponse, status_code=201)
async def start_debate(debate_request: DebateSetupRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not debate_request.character_names or len(debate_request.character_names) < 2:
        raise HTTPException(status_code=400, detail="At least 2 characters are required.")
    if not debate_request.topic.strip():
        raise HTTPException(status_code=400, detail="A topic is required.")
    if not debate_request.groq_api_key.strip(): # <--- Validate key presence
         raise HTTPException(status_code=400, detail="GROQ API Key is required.")
    db_debate = create_debate_session(
        db=db,
        user_name=debate_request.user_name,
        topic=debate_request.topic,
        character_names=debate_request.character_names
    )
    session_id = str(db_debate.id)
    chamber_manager = CouncilChamberManager(
        session_id=session_id,
        user_name=debate_request.user_name,
        character_names=debate_request.character_names,
        topic=debate_request.topic,
        groq_api_key=debate_request.groq_api_key,
    )
    _set_active_debate(session_id, chamber_manager)
    logger.info(f"📌 Scheduling background task for session {session_id}")
    background_tasks.add_task(chamber_manager.start_debate_background_task)
    return _convert_manager_to_response_with_session(chamber_manager, session_id)

@app.get("/debates/{session_id}/status/")
async def get_debate_status(session_id: str, db: Session = Depends(get_db)):
    try:
        uuid_obj = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format.")
    db_debate = get_debate_session(db, uuid_obj)
    if not db_debate:
        raise HTTPException(status_code=404, detail="Debate session not found in database.")
    manager = _get_active_debate(session_id)
    if not manager:
        raise HTTPException(status_code=404, detail="Debate session manager not found in memory.")
    return {
        "session_id": session_id,
        "is_running": manager.is_running,
        "is_waiting_for_input": manager.is_waiting_for_input,
        "message_count": len(manager.get_chat_history()),
        "current_prompt": manager.current_prompt
    }

@app.get("/debates/{session_id}/history/", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    try:
        uuid_obj = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format.")
    db_debate = get_debate_session(db, uuid_obj)
    if not db_debate:
        raise HTTPException(status_code=404, detail="Debate session not found in database.")
    manager = _get_active_debate(session_id)
    if not manager:
        return ChatHistoryResponse(messages=[], is_active=False)
    raw_messages = manager.get_chat_history() or []
    messages = [ChatMessage(**serialize_message(m)) for m in raw_messages if serialize_message(m)["message"]]
    return ChatHistoryResponse(messages=messages, is_active=True)

@app.post("/debates/{session_id}/message/")
async def send_user_message(session_id: str, user_message: UserMessageRequest, db: Session = Depends(get_db)):
    try:
        uuid_obj = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format.")
    db_debate = get_debate_session(db, uuid_obj)
    if not db_debate:
        raise HTTPException(status_code=404, detail="Debate session not found in database.")
    manager = _get_active_debate(session_id)
    if not manager:
        raise HTTPException(status_code=404, detail="Active debate session not found.")
    if not manager.is_running:
        raise HTTPException(status_code=400, detail="Debate session is not active.")
    # always enqueue, don't block on is_waiting_for_input
    if not hasattr(manager, "input_queue") or manager.input_queue is None:
        manager.input_queue = Queue()
    manager.input_queue.put(user_message.message)
    return {
        "message": "Message enqueued successfully",
        "session_id": session_id,
        "user_message": user_message.message
    }

@app.delete("/debates/{session_id}/")
async def stop_debate(session_id: str, db: Session = Depends(get_db)):
    try:
        uuid_obj = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format.")
    manager = _pop_active_debate(session_id)
    if manager:
        manager.stop_debate()
        logger.info(f"Debate session {session_id} stopped and removed.")
    return {"message": f"Debate session {session_id} stopped successfully."}

if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)


@app.get("/debates/")
def list_all_debates(db: Session = Depends(get_db)):
    """
    Return a lightweight list of all debate sessions for the sidebar.
    """
    sessions = list_debate_sessions(db)
    return [
        {
            "session_id": str(s.id),
            "user_name": s.user_name,
            "topic": s.topic,
            "created_at": s.created_at.isoformat(),
            "participants": [cm.name for cm in s.council_members],
        }
        for s in sessions
    ]

@app.get("/debates/{session_id}/full_history/", response_model=ChatHistoryResponse)
def get_full_history(session_id: str, db: Session = Depends(get_db)):
    """
    Retrieve the full persisted chat history for a debate session.
    This works even if the debate is no longer active.
    """
    try:
        uid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session id")

    msgs = get_messages_for_session(db, uid)
    items = [ChatMessage(sender=m.sender_name, message=m.content) for m in msgs]

    # Determine if debate is still active in memory
    is_active = session_id in active_debates  # active_debates is your in-memory dict

    return ChatHistoryResponse(messages=items, is_active=is_active)


@app.get("/debates/{session_id}/info/")
async def get_debate_info(session_id: str, db: Session = Depends(get_db)):
    """
    Get basic debate session information for the frontend.
    """
    try:
        uuid_obj = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format.")
    
    db_debate = get_debate_session(db, uuid_obj)
    if not db_debate:
        raise HTTPException(status_code=404, detail="Debate session not found in database.")
    
    # Get the active manager if available
    manager = _get_active_debate(session_id)
    
    # Build council members info
    council_members = [
        {
            "name": cm.name,
            "agent_name": cm.agent_name
        }
        for cm in db_debate.council_members
    ]
    
    return {
        "session_id": session_id,
        "user_name": db_debate.user_name,
        "topic": db_debate.topic,
        "council_members": council_members,
        "message": "Debate session information",
        "is_active": manager is not None and manager.is_running if manager else False
    }