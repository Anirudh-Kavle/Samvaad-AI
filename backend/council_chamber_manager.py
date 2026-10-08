# council_chamber_manager.py
import autogen
import logging
import queue
import threading
import time
from typing import List, Any
from council_member import CouncilMember
import json
from config import LLM_CONFIG
from database import SessionLocal  # session factory
from services import save_chat_message
from datetime import datetime, timezone
from sqlalchemy.orm import Session as SASession
import uuid
# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 1. Custom UserProxyAgent with Queue Input ---
class QueuedUserProxyAgent(autogen.UserProxyAgent):
    """
    A UserProxyAgent that gets human input from a queue instead of stdin.
    """
    def __init__(self, name: str, input_queue: queue.Queue, manager_ref=None, **kwargs):
        super().__init__(name, **kwargs)
        self.input_queue = input_queue
        self.manager_ref = manager_ref

    def get_human_input(self, prompt: str) -> str:
        """
        Overrides the default input method to get input from a queue.
        This method will block until an item is available in the queue.
        Always returns a plain string, as required by AutoGen.
        """
        logger.info(f"[{self.name}] Prompting user: {prompt}")

        # Set the manager state to indicate we're waiting for input
        if self.manager_ref:
            try:
                self.manager_ref.is_waiting_for_input = True
                self.manager_ref.current_prompt = prompt
            except Exception:
                # Defensive: manager_ref might not have these attributes yet
                pass

        # Block and wait for input from the API endpoint
        try:
            user_input = self.input_queue.get()  # blocking
        except Exception as e:
            logger.error(f"[{self.name}] Error getting from input_queue: {e}", exc_info=True)
            user_input = None

        logger.info(f"[{self.name}] Received user input: {user_input}")

        # Clear the waiting state
        if self.manager_ref:
            try:
                self.manager_ref.is_waiting_for_input = False
                self.manager_ref.current_prompt = None
            except Exception:
                pass

        # Ensure we return only the text, not a dict
        if isinstance(user_input, dict):
            text_value = (
                user_input.get("message")
                or user_input.get("content")
                or user_input.get("text")
                or str(user_input)
            )
            return text_value
        elif user_input is None:
            # Defensive fallback — return empty string so AutoGen doesn't error
            return ""
        else:
            return str(user_input)


# --- 2. Main Manager Class ---
class CouncilChamberManager:
    """Manages the philosophical debate between dynamically selected characters"""

    def __init__(self, session_id: str, user_name: str, character_names: List[str], topic: str, groq_api_key: str, on_finish=None):
        # Normalize session_id so it's always a UUID object
        if isinstance(session_id, str):
            session_id = uuid.UUID(session_id)
        self.session_id = session_id
        self.user_name = user_name
        self.topic = topic
        self.character_names = character_names
        self.groq_api_key = groq_api_key 
        
        # --- Create Input Queue ---
        self.input_queue = queue.Queue()

        # --- State Management ---
        self.is_running = False
        self.is_waiting_for_input = False
        self.current_prompt = None
        self.chat_result = None
        self.background_thread = None
        self.stop_requested = False
        self.on_finish = on_finish

 # --- Create LLM Config with User's API Key ---
        self.llm_config_with_key = LLM_CONFIG.copy()
        if self.llm_config_with_key.get("config_list"):
             # Iterate through the config list and update api_key
             updated_config_list = []
             for config_item in self.llm_config_with_key["config_list"]:
                 new_config_item = config_item.copy() # Shallow copy the item
                 new_config_item["api_key"] = self.groq_api_key # Override api_key
                 # Fix potential trailing space in base_url if present in original
                 if "base_url" in new_config_item and new_config_item["base_url"]:
                     new_config_item["base_url"] = new_config_item["base_url"].strip()
                 updated_config_list.append(new_config_item)
             self.llm_config_with_key["config_list"] = updated_config_list
        else:
             # If config_list is missing, create it with the user's key
             self.llm_config_with_key["config_list"] = [
                 {
                     "model": "moonshotai/kimi-k2-instruct", # Default model, adjust if needed
                     "api_key": self.groq_api_key,
                     # Removed trailing spaces from base_url
                     "base_url": "https://api.groq.com/openai/v1", # <-- Changed here
                     "price": [0.0, 0.0]
                 }
             ]
         
        # Create members AFTER setting up llm_config_with_key
        # Removed the first initialization of self.members
        self.members = [CouncilMember(name, llm_config_override=self.llm_config_with_key) for name in self.character_names] # Pass config

        # --- Create Custom User Proxy ---
        self.user_proxy = QueuedUserProxyAgent(
            name=self.user_name,
            input_queue=self.input_queue,
            manager_ref=self,  # Pass reference to self
            system_message=f"""You are {self.user_name}, a human participant in this philosophical debate.
            You can:
            - Ask questions to challenge the historical figures
            - Share your own perspective on the topic
            - Redirect the conversation
            - Engage directly with any participant
            Your responses should be conversational and engaging.""",
            human_input_mode="ALWAYS",
            code_execution_config=False,
            max_consecutive_auto_reply=1,
            is_termination_msg=lambda _: self.stop_requested,  # Check for stop request
            default_auto_reply="[Waiting for human input...]",
        )
        
        self.agents = [member.agent for member in self.members] + [self.user_proxy]
        self.max_rounds = 50

        self.group_chat = autogen.GroupChat(
            agents=self.agents,
            messages=[],
            max_round=self.max_rounds,
            speaker_selection_method="round_robin",
            allow_repeat_speaker=True,
            enable_clear_history=False
        )
        
        self.manager = autogen.GroupChatManager(
            groupchat=self.group_chat,
            llm_config=self.llm_config_with_key
        )
        # Persistence tracking
        self.last_persisted_index = 0
        self.persistence_thread = None

    def display_council_info(self):
        """Display the debate setup information (optional for API)"""
        logger.info(f"Council Chamber initialized for session {self.session_id}")
        logger.info(f"Topic: {self.topic}")
        logger.info(f"Participants: {', '.join(self.character_names)}")

    def start_debate_background_task(self):
        """
        Starts the debate in a background thread.
        This is the method called by FastAPI's background_tasks.
        """
        if self.is_running:
            logger.warning(f"Debate {self.session_id} is already running.")
            return

        logger.info(f"Starting background debate task for session {self.session_id}")
        self.is_running = True
        
        # Start the debate in a separate thread to avoid blocking the FastAPI event loop
        self.background_thread = threading.Thread(
            target=self._run_debate_thread,
            name=f"Debate-{self.session_id}"
        )
        self.background_thread.daemon = True
        self.background_thread.start()
        self.persistence_thread = threading.Thread(
            target=self._persistence_loop,
            name=f"Persist-{self.session_id}",
            daemon=True
        )
        self.persistence_thread.start()

    def _run_debate_thread(self):
        """
        The actual debate execution that runs in a background thread.
        """
        logger.info(f"Debate thread started for session {self.session_id}")
        self.is_running = True
        self.display_council_info()
        
        opening_prompt = f"""
🏛️ The Council convenes for a debate!
Topic: "{self.topic}"

Please begin by sharing your authentic perspective on this topic.
Draw from your actual beliefs and experiences.

{self.user_name}, you'll participate actively - send your thoughts when prompted!
"""

        try:
            logger.info(f"Initiating chat for session {self.session_id}...")
            # Initiate the chat - user_proxy will block on get_human_input when necessary
            self.chat_result = self.user_proxy.initiate_chat(
                self.manager,
                message=opening_prompt,
                clear_history=False
            )
            logger.info(f"Debate for session {self.session_id} concluded normally.")
        except Exception as e:
            logger.error(f"Error during debate for session {self.session_id}: {e}", exc_info=True)
            self.chat_result = None
        finally:
            self.is_running = False
            self.is_waiting_for_input = False
            self.current_prompt = None
            logger.info(f"Debate thread finished for session {self.session_id}")
            if self.on_finish:
                self.on_finish(str(self.session_id))

    def start_debate(self):
        """
        Legacy method for backward compatibility.
        For the API, use start_debate_background_task instead.
        """
        logger.warning("start_debate() called - this is a blocking method. Use start_debate_background_task() for API.")
        return self._run_debate_thread()

    def send_user_message(self, user_message: str) -> str:
        """
        Sends a user message to the debate.
        This puts the message into the queue, unblocking the waiting initiate_chat.
        """
        if not self.is_running:
            logger.warning(f"Attempted to send message to inactive debate {self.session_id}")
            return "Debate session is not active or has finished."
        
        if not self.is_waiting_for_input:
            logger.warning(f"Attempted to send message when not waiting for input in session {self.session_id}")
            return "Debate is not currently waiting for user input."
            
        logger.info(f"Queuing user message for session {self.session_id}: {user_message}")
        try:
            self.input_queue.put(user_message)
            return f"Message queued successfully"
        except Exception as e:
            logger.error(f"Error queuing user message for session {self.session_id}: {e}", exc_info=True)
            return f"Error queuing message: {str(e)}"

    def stop_debate(self):
        """
        Stops the debate gracefully.
        """
        logger.info(f"Stopping debate session {self.session_id}")
        self.stop_requested = True
        
        # If waiting for input, send a stop message to unblock
        if self.is_waiting_for_input:
            try:
                self.input_queue.put("STOP")
            except:
                pass
        
        # Wait for thread to finish (with timeout)
        if self.background_thread and self.background_thread.is_alive():
            self.background_thread.join(timeout=5.0)
        
        self.is_running = False
        self.is_waiting_for_input = False
        if self.persistence_thread and self.persistence_thread.is_alive():
            self.persistence_thread.join(timeout=3.0)


    def get_chat_history(self) -> List[dict[str, Any]]:
        """Returns the current chat history."""
        if not self.group_chat:
            return []
        return self.group_chat.messages

    def get_status(self) -> dict:
        """Returns the current status of the debate."""
        return {
            "session_id": self.session_id,
            "is_running": self.is_running,
            "is_waiting_for_input": self.is_waiting_for_input,
            "current_prompt": self.current_prompt,
            "message_count": len(self.get_chat_history()),
            "thread_alive": self.background_thread.is_alive() if self.background_thread else False
        }
    def _persistence_loop(self, poll_interval: float = 1.0):
        """
        Background loop that periodically persists any new messages to the DB.
        Runs while debate is active.
        """
        logger.info(f"Persistence loop started for session {self.session_id}")
        try:
            while self.is_running and not self.stop_requested:
                try:
                    self.persist_new_messages()
                except Exception as e:
                    logger.error(f"Error persisting messages for session {self.session_id}: {e}", exc_info=True)
                time.sleep(poll_interval)
            # One final flush after run ends
            try:
                self.persist_new_messages()
            except Exception:
                pass
        finally:
            logger.info(f"Persistence loop finished for session {self.session_id}")
   

    def persist_new_messages(self):
        """
        Persist any messages from group_chat.messages that haven't been saved yet.
        """
        msgs = self.get_chat_history() or []
        new_msgs = msgs[self.last_persisted_index:]

        if not new_msgs:
            return

        db: SASession = SessionLocal()
        try:
            saved = 0
            for i, m in enumerate(new_msgs):
                try:
                    sender = self._extract_sender(m)
                    content = self._extract_content(m)
                    
                    logger.info(f"[{self.session_id}] Saving message from {sender}: {content[:100]}...")

                    save_chat_message(
                        db=db,
                        session_id=self.session_id if isinstance(self.session_id, uuid.UUID) else uuid.UUID(str(self.session_id)),
                        sender=str(sender),
                        content=str(content),
                        timestamp=datetime.now(timezone.utc)
                    )
                    saved += 1
                    self.last_persisted_index += 1

                except Exception as e:
                    logger.error(f"[{self.session_id}] Failed saving message {i}: {e}", exc_info=True)
                    db.rollback()
                    break

            if saved:
                logger.info(f"[{self.session_id}] Successfully persisted {saved} messages.")
        except Exception as e:
            logger.error(f"[{self.session_id}] Error in persist_new_messages: {e}", exc_info=True)
        finally:
            db.close()

    def _extract_sender(self, m) -> str:
        """
        Extract sender name from AutoGen message.
        """
        # Handle dict messages (most common in AutoGen)
        if isinstance(m, dict):
            # Primary field for AutoGen messages
            if 'name' in m and m['name']:
                return str(m['name'])
            
            # Fallback fields
            for field in ['from', 'sender', 'author', 'speaker', 'role']:
                if field in m and m[field]:
                    return str(m[field])
                    
            # Check if there's a nested structure
            if 'message' in m and isinstance(m['message'], dict):
                nested_sender = self._extract_sender(m['message'])
                if nested_sender != "unknown":
                    return nested_sender
        
        # Handle object messages
        if hasattr(m, 'name') and m.name:
            return str(m.name)
        
        # Additional fallbacks for objects
        for attr in ['from_', 'sender', 'author', 'speaker']:
            if hasattr(m, attr):
                value = getattr(m, attr)
                if value:
                    return str(value)
        
        # Last resort
        logger.warning(f"[{self.session_id}] Could not extract sender from message")
        return "unknown"
    def _extract_content(self, m) -> str:
        """
        Extract message content from AutoGen message.
        """
        # Handle dict messages (most common in AutoGen)
        if isinstance(m, dict):
            # Primary field for AutoGen messages
            if 'content' in m and m['content'] is not None:
                return str(m['content'])
            
            # Fallback fields
            for field in ['message', 'text', 'body']:
                if field in m and m[field] is not None:
                    return str(m[field])
        
        # Handle object messages
        if hasattr(m, 'content') and m.content is not None:
            return str(m.content)
        
        # Additional fallbacks for objects
        for attr in ['message', 'text', 'body']:
            if hasattr(m, attr):
                value = getattr(m, attr)
                if value is not None:
                    return str(value)
        
        # If it's a string, return it directly
        if isinstance(m, str):
            return m
        
        # Last resort
        return ""


def debug_message_structure(self):
    """
    Debug method to see the actual structure of AutoGen messages.
    """
    msgs = self.get_chat_history() or []
    logger.info(f"[{self.session_id}] === MESSAGE STRUCTURE DEBUG ===")
    logger.info(f"[{self.session_id}] Total messages in chat history: {len(msgs)}")
    
    for i, msg in enumerate(msgs[-5:]):  # Look at last 5 messages
        logger.info(f"[{self.session_id}] Message {i}:")
        logger.info(f"  Type: {type(msg)}")
        logger.info(f"  Raw repr: {repr(msg)}")
        
        if isinstance(msg, dict):
            logger.info(f"  Keys: {list(msg.keys())}")
            for key, value in msg.items():
                if key in ['name', 'content', 'from', 'sender', 'role', 'speaker']:
                    logger.info(f"    {key}: {repr(value)}")
                else:
                    logger.info(f"    {key}: {str(type(value))} (length: {len(str(value)) if value else 0})")
        else:
            # If it's an object, show its attributes
            attrs = [attr for attr in dir(msg) if not attr.startswith('_')]
            logger.info(f"  Attributes: {attrs[:10]}...")  # Show first 10 attrs
            for attr in ['name', 'content', 'from', 'sender', 'role']:
                if hasattr(msg, attr):
                    value = getattr(msg, attr, None)
                    logger.info(f"    {attr}: {repr(value)}")
        
        logger.info(f"  {'='*50}")
