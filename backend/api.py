# api.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import uuid
from typing import Dict
import logging

from models import DebateSetupRequest, DebateInfoResponse, CouncilMemberInfo, ChatHistoryResponse
from council_chamber_manager import CouncilChamberManager

# --- Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CouncilChamber API",
    description="API for the CouncilChamber - Character Debate Simulator",
    version="0.1.0"
)

# Configure CORS for frontend interaction
# Adjust origins as needed for development/production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for active debates (use DB in production)
active_debates: Dict[str, CouncilChamberManager] = {}

# --- Helper Functions ---
def _convert_manager_to_response_with_session(manager: CouncilChamberManager, session_id: str) -> DebateInfoResponse:
    council_members_info = [
        CouncilMemberInfo(name=member.character_name, agent_name=member.agent.name)
        for member in manager.members
    ]
    return DebateInfoResponse(
        user_name=manager.user_name,
        topic=manager.topic,
        council_members=council_members_info,
        message=f"🏛️ Council '{manager.topic}' is ready. {manager.user_name} is participating.",
        session_id=session_id
    )

# --- API Endpoints ---
@app.get("/")
async def root():
    return {"message": "🏛️ Welcome to the CouncilChamber API!"}

@app.post("/debates/start/", response_model=DebateInfoResponse, status_code=201)
async def start_debate(debate_request: DebateSetupRequest):
    logger.info(f"Starting debate for user '{debate_request.user_name}' on topic '{debate_request.topic}'")
    
    if not debate_request.character_names or len(debate_request.character_names) < 2:
        raise HTTPException(status_code=400, detail="At least 2 characters are required.")
    if not debate_request.topic.strip():
        raise HTTPException(status_code=400, detail="A topic is required.")
    
    session_id = str(uuid.uuid4())
    logger.info(f"Generated session ID: {session_id}")

    try:
        chamber_manager = CouncilChamberManager(
            user_name=debate_request.user_name,
            character_names=debate_request.character_names,
            topic=debate_request.topic
        )
        
        active_debates[session_id] = chamber_manager
        response_data = _convert_manager_to_response_with_session(chamber_manager, session_id)
        
        logger.info(f"Debate session {session_id} initialized successfully.")
        return response_data

    except Exception as e:
        logger.error(f"Failed to start debate session: {e}", exc_info=True)
        active_debates.pop(session_id, None)
        raise HTTPException(status_code=500, detail=f"Internal server error while starting debate: {str(e)}")

@app.get("/debates/{session_id}/history/", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str):
    manager = active_debates.get(session_id)
    if not manager:
        raise HTTPException(status_code=404, detail="Debate session not found.")
    
    messages = manager.group_chat.messages if manager.group_chat else []
    chat_messages = [
        {"sender": msg.get("name", "Unknown"), "message": msg.get("content", "")}
        for msg in messages if msg.get("content")
    ]
    
    is_active = session_id in active_debates
    
    return ChatHistoryResponse(messages=chat_messages, is_active=is_active)

# --- Run the server ---
if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
