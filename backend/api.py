# api.py

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import uuid
from typing import Dict
import logging

# Import database and service components
from database import get_db
from sqlalchemy.orm import Session
from services import create_debate_session, get_debate_session
from models import (
    DebateSetupRequest, 
    DebateInfoResponse, 
    CouncilMemberInfo, 
    ChatHistoryResponse,
    UserMessageRequest # Make sure this is imported
)
# Import CouncilChamberManager
from council_chamber_manager import CouncilChamberManager

# --- Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CouncilChamber API",
    description="API for the CouncilChamber - Character Debate Simulator",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for active debates
active_debates: Dict[str, CouncilChamberManager] = {}

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
        message=f"🏛️ Council '{manager.topic}' is ready. Call /run to start the conversation."
    )

# --- API Endpoints ---

@app.get("/")
async def root():
    return {"message": "🏛️ Welcome to the CouncilChamber API!"}

@app.post("/debates/start/", response_model=DebateInfoResponse, status_code=201)
async def start_debate(debate_request: DebateSetupRequest, db: Session = Depends(get_db)):
    """
    1. Sets up a new CouncilChamber debate session.
    2. Saves the session to the database.
    3. Initializes the CouncilChamberManager (in memory).
    4. Returns session info. Client must call /run to start the actual chat.
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
            user_name=debate_request.user_name,
            character_names=debate_request.character_names,
            topic=debate_request.topic
        )
        
        # 3. Store the manager instance in memory
        active_debates[session_id] = chamber_manager
        
        # 4. Return the setup information
        response_data = _convert_manager_to_response_with_session(chamber_manager, session_id)
        logger.info(f"Debate API session {session_id} setup successfully.")
        return response_data

    except Exception as e:
        logger.error(f"Failed to setup debate session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error while setting up debate: {str(e)}")


@app.post("/debates/{session_id}/run/")
async def run_debate(session_id: str, db: Session = Depends(get_db)):
    """
    2. Starts the actual debate conversation.
    This endpoint IS BLOCKING and will run the autogen chat loop.
    It waits for user input via the /message endpoint.
    """
    # 1. Verify session exists in DB
    try:
        uuid_obj = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format.")
        
    db_debate = get_debate_session(db, uuid_obj)
    if not db_debate:
        raise HTTPException(status_code=404, detail="Debate session not found in database.")
    
    # 2. Get manager from in-memory store
    manager = active_debates.get(session_id)
    if not manager:
        raise HTTPException(status_code=404, detail="Debate session manager not found in memory. It may have expired.")
    
    if manager.is_running:
         raise HTTPException(status_code=409, detail="Debate is already running.")

    # 3. --- Run the blocking start_debate method ---
    # This call will block this specific request until it needs user input
    # or finishes. The client calling this endpoint must handle this.
    logger.info(f"Starting debate execution for session {session_id}...")
    chat_result = manager.start_debate() # This is the BLOCKING call
    
    # 4. When start_debate returns (finished or errored), respond
    if chat_result:
        logger.info(f"Debate run for session {session_id} completed or paused.")
        # Optionally return final history or status
        # For now, just acknowledge
        return {
            "message": "Debate run completed or requires further input.",
            "session_id": session_id,
            # "final_history": manager.get_chat_history() # Optional
        }
    else:
        logger.error(f"Debate run for session {session_id} failed.")
        raise HTTPException(status_code=500, detail="Debate execution failed.")


@app.get("/debates/{session_id}/history/", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    """
    3/ongoing. Retrieves the current chat history for a session.
    """
    # 1. Verify session exists in DB
    try:
        uuid_obj = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format.")
        
    db_debate = get_debate_session(db, uuid_obj)
    if not db_debate:
        raise HTTPException(status_code=404, detail="Debate session not found in database.")
    
    # 2. Get manager from in-memory store
    manager = active_debates.get(session_id)
    if not manager:
        raise HTTPException(status_code=404, detail="Active debate session not found.")
    
    # 3. Get history
    messages = manager.get_chat_history()
    
    # 4. Determine if active
    is_active = manager.is_running
    
    return ChatHistoryResponse(messages=messages, is_active=is_active)


@app.post("/debates/{session_id}/message/")
async def send_user_message(session_id: str, user_message: UserMessageRequest, db: Session = Depends(get_db)):
    """
    4. Sends a message from the user to an active debate session.
    This puts the message into the queue for the running debate.
    """
    # 1. Verify session exists in DB
    try:
        uuid_obj = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format.")
        
    db_debate = get_debate_session(db, uuid_obj)
    if not db_debate:
        raise HTTPException(status_code=404, detail="Debate session not found in database.")
    
    # 2. Get manager from in-memory store
    manager = active_debates.get(session_id)
    if not manager:
        raise HTTPException(status_code=404, detail="Active debate session not found.")
    
    # 3. Send the message using the manager's method
    result_message = manager.send_user_message(user_message.message)
    
    # 4. Return status
    # If the message was queued successfully, the /run endpoint should continue
    return {"message": result_message, "session_id": session_id}


# --- Run the server ---
if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
