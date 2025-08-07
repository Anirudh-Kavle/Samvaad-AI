# council_chamber_manager.py

import autogen
import logging
import queue
import threading
import time
from typing import List, Optional, Any
from council_member import CouncilMember
from config import LLM_CONFIG

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
        """
        logger.info(f"[{self.name}] Prompting user: {prompt}")
        
        # Set the manager state to indicate we're waiting for input
        if self.manager_ref:
            self.manager_ref.is_waiting_for_input = True
            self.manager_ref.current_prompt = prompt
        
        # Block and wait for input from the API endpoint
        user_input = self.input_queue.get()
        logger.info(f"[{self.name}] Received user input: {user_input}")
        
        # Clear the waiting state
        if self.manager_ref:
            self.manager_ref.is_waiting_for_input = False
            self.manager_ref.current_prompt = None
            
        return user_input

# --- 2. Main Manager Class ---
class CouncilChamberManager:
    """Manages the philosophical debate between dynamically selected characters"""

    def __init__(self, session_id: str, user_name: str, character_names: List[str], topic: str):
        self.session_id = session_id 
        self.user_name = user_name
        self.topic = topic
        self.character_names = character_names
        self.members = [CouncilMember(name) for name in character_names]
        
        # --- Create Input Queue ---
        self.input_queue = queue.Queue()

        # --- State Management ---
        self.is_running = False
        self.is_waiting_for_input = False
        self.current_prompt = None
        self.chat_result = None
        self.background_thread = None
        self.stop_requested = False

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
            is_termination_msg=lambda x: self.stop_requested,  # Check for stop request
            default_auto_reply="[Waiting for human input...]",
        )
        
        self.agents = [member.agent for member in self.members] + [self.user_proxy]
        self.max_rounds = 20

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
            llm_config=LLM_CONFIG
        )

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
        
        # Start the debate in a separate thread to avoid blocking the FastAPI event loop
        self.background_thread = threading.Thread(
            target=self._run_debate_thread,
            name=f"Debate-{self.session_id}"
        )
        self.background_thread.daemon = True
        self.background_thread.start()

    def _run_debate_thread(self):
        """
        The actual debate execution that runs in a background thread.
        """
        logger.info(f"Debate thread started for session {self.session_id}")
        self.is_running = True
        self.display_council_info()
        
        opening_prompt = f"""
🏛️ The CouncilChamber convenes for a philosophical debate!
Topic: "{self.topic}"

Please begin by sharing your authentic perspective on this topic.
Draw from your actual beliefs and experiences.

{self.user_name}, you'll participate actively - send your thoughts via the API when prompted!
"""

        try:
            logger.info(f"Initiating chat for session {self.session_id}...")
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