# services.py

from sqlalchemy.orm import Session, joinedload
from models import DebateSession, CouncilMember,  ChatMessageDB
import uuid
from typing import List, Optional
from datetime import datetime

def create_debate_session(
    db: Session, 
    user_name: str, 
    topic: str, 
    character_names: List[str],
    session_token: Optional[str] = None
) -> DebateSession:
    """
    Creates a new debate session and associated council members in the database.
    
    Args:
        db (Session): The database session.
        user_name (str): The name of the user participating in the debate.
        topic (str): The topic of the debate.
        character_names (List[str]): A list of character names participating in the debate.
        
    Returns:
        DebateSession: The newly created DebateSession object.
    """
    if session_token is None:
        session_token = str(uuid.uuid4())
    # Create the DebateSession instance
    db_debate = DebateSession(
        user_name=user_name,
        topic=topic,
        session_token=session_token
    )
    db.add(db_debate)
    db.flush()  # Flush to get the generated ID without committing

    # Create CouncilMember instances and link them to the debate session
    db_council_members = []
    for name in character_names:
        # Simple agent name generation (you might want to refine this)
        agent_name = name.replace(" ", "_")
        council_member = CouncilMember(
            name=name,
            agent_name=agent_name,
            debate_session_id=db_debate.id
        )
        db_council_members.append(council_member)
        db.add(council_member)

    # Commit the transaction
    db.commit()
    # Refresh to get the updated object with relationships
    db.refresh(db_debate)
    
    return db_debate

def get_debate_session(db: Session, session_id: uuid.UUID) -> DebateSession:
    """
    Retrieves a debate session by its ID.
    
    Args:
        db (Session): The database session.
        session_id (uuid.UUID): The ID of the debate session.
        
    Returns:
        DebateSession: The DebateSession object if found, otherwise None.
    """
    return db.query(DebateSession).filter(DebateSession.id == session_id).first()

def save_chat_message(db: Session, session_id: uuid.UUID, sender: str, content: str, timestamp: datetime | None = None) -> ChatMessageDB:
    """
    Persist a chat message for the given debate session.
    """
    if timestamp is None:
        timestamp = datetime.utcnow()

    msg = ChatMessageDB(
        debate_session_id=session_id,
        sender_name=sender,
        content=content,
        timestamp=timestamp
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_messages_for_session(db: Session, session_id: uuid.UUID, skip: int = 0, limit: int = 1000) -> List[ChatMessageDB]:
    """
    Fetch persisted messages for a session ordered by timestamp.
    """
    return (
        db.query(ChatMessageDB)
          .filter(ChatMessageDB.debate_session_id == session_id)
          .order_by(ChatMessageDB.timestamp)
          .offset(skip)
          .limit(limit)
          .all()
    )


def list_debate_sessions_by_token(db: Session, session_token: str, skip: int = 0, limit: int = 100) -> List[DebateSession]:
    """
    Return a list of debate sessions (lightweight) for the sidebar.
    """
    return db.query(DebateSession).options(joinedload(DebateSession.council_members)).filter(DebateSession.session_token == session_token).order_by(DebateSession.created_at.desc()).offset(skip).limit(limit).all()

def verify_session_access(db: Session, debate_session_id: uuid.UUID, session_token: str) -> bool:
    """
    Verify that the session token has access to the debate session.
    """
    debate = db.query(DebateSession).filter(
        DebateSession.id == debate_session_id,
        DebateSession.session_token == session_token
    ).first()
    return debate is not None