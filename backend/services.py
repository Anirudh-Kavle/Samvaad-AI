# services.py

from sqlalchemy.orm import Session
from models import DebateSession, CouncilMember
import uuid
from typing import List

def create_debate_session(
    db: Session, 
    user_name: str, 
    topic: str, 
    character_names: List[str]
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
    # Create the DebateSession instance
    db_debate = DebateSession(
        user_name=user_name,
        topic=topic
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

# We can add more service functions here as needed, for example:
# def get_all_debate_sessions(db: Session, skip: int = 0, limit: int = 100):
#     return db.query(DebateSession).offset(skip).limit(limit).all()

# def delete_debate_session(db: Session, session_id: uuid.UUID):
#     db_debate = db.query(DebateSession).filter(DebateSession.id == session_id).first()
#     if db_debate:
#         db.delete(db_debate)
#         db.commit()
#     return db_debate
