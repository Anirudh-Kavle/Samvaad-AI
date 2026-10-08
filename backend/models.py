# models.py

from pydantic import BaseModel, Field
from typing import Annotated, List, Optional
# --- Import SQLAlchemy parts ---
from sqlalchemy import Column, String, Text, UUID, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base # Import the Base from our database.py
import uuid
from datetime import datetime


class DebateSetupRequest(BaseModel):
    """
    Model for the request data to initiate a debate.
    """
    user_name: Annotated[str, Field(min_length=1, max_length=100)] = "Participant"
    groq_api_key: Annotated[str, Field(min_length=1, max_length=512)]
    character_names: Annotated[List[Annotated[str, Field(min_length=1, max_length=120)]], Field(min_length=2, max_length=6)]
    topic: Annotated[str, Field(min_length=1, max_length=4_000)]
    session_token: Optional[Annotated[str, Field(min_length=1, max_length=100)]] = None

    class Config:
        # Example for API documentation
        json_schema_extra = {
            "example": {
                "user_name": "Alex",
                "groq_api_key": "gsk_...",
                "character_names": ["Socrates", "Friedrich Nietzsche", "Maya Angelou"],
                "topic": "The meaning of suffering"
            }
        }

class CouncilMemberInfo(BaseModel):
    """
    Model for information about a council member in the response.
    """
    name: str
    agent_name: str # The internal name used by AutoGen

class DebateInfoResponse(BaseModel):
    """
    Model for the initial response after setting up a debate.
    """
    user_name: str
    topic: str
    council_members: List[CouncilMemberInfo]
    message: str # A welcome message or status
    session_id: str
    session_token: str 

class ChatMessage(BaseModel):
    """
    Model for a single message in the chat history.
    """
    sender: str # Name of the agent or user who sent the message
    message: str # The content of the message
    timestamp: Optional[datetime] = None

class ChatHistoryResponse(BaseModel):
    """
    Model for the response containing the full chat history.
    """
    messages: List[ChatMessage]
    is_active: bool # Indicates if the debate is still ongoing or has concluded

# Optional: Model for sending a user message during the debate
# (We'll see if we need this based on how we implement the chat flow)
class UserMessageRequest(BaseModel):
    """
    Model for sending a message from the user during an active debate.
    """
    message: Annotated[str, Field(min_length=1, max_length=4_000)]

    class Config:
        json_schema_extra = {
            "example": {
                "message": "That's a fascinating point, Socrates. But what about...?"
            }
        }
class CouncilMember(Base):
    """
    Represents a council member (historical figure) in a debate session.
    """
    __tablename__ = "council_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    # Name of the historical figure (e.g., "Socrates")
    name = Column(String, nullable=False)
    # Internal agent name used by AutoGen (e.g., "Socrates_123")
    agent_name = Column(String, nullable=False)
    
    # Foreign key linking to DebateSession
    debate_session_id = Column(UUID(as_uuid=True), ForeignKey('debate_sessions.id'), nullable=False)

    # Relationship back to DebateSession
    debate_session = relationship("DebateSession", back_populates="council_members")

    def __repr__(self):
        return f"<CouncilMember(id='{self.id}', name='{self.name}', agent_name='{self.agent_name}')>"

class ChatMessageDB(Base):
    """
    Persisted chat message for a debate session.
    """
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    debate_session_id = Column(UUID(as_uuid=True), ForeignKey('debate_sessions.id'), nullable=False)
    sender_name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # relationship back to DebateSession
    debate_session = relationship("DebateSession", back_populates="messages")

    def __repr__(self):
        return f"<ChatMessageDB(id='{self.id}', sender='{self.sender_name}', ts='{self.timestamp}')>"
# --- SQLAlchemy Database Models ---

class DebateSession(Base):
    """
    Represents a single debate session in the database.
    """
    __tablename__ = "debate_sessions"

    # Use UUID for primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    user_name = Column(String, nullable=False)
    topic = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    # NEW: Add session token for privacy
    session_token = Column(String, nullable=False, default=lambda: str(uuid.uuid4()))
    # Relationship to CouncilMember (one-to-many)
    council_members = relationship("CouncilMember", back_populates="debate_session", cascade="all, delete-orphan")
    # NEW: relationship to persisted chat messages
    messages = relationship("ChatMessageDB", back_populates="debate_session", cascade="all, delete-orphan", order_by="ChatMessageDB.timestamp")
    
    def __repr__(self):
        return f"<DebateSession(id='{self.id}', topic='{self.topic}', user='{self.user_name}')>"


