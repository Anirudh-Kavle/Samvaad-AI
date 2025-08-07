# council_chamber_manager.py

import autogen
import logging
import queue
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
    def __init__(self, name: str, input_queue: queue.Queue, **kwargs):
        super().__init__(name, **kwargs)
        self.input_queue = input_queue

    def get_human_input(self, prompt: str) -> str:
        """
        Overrides the default input method to get input from a queue.
        This method will block until an item is available in the queue.
        """
        logger.info(f"[{self.name}] Prompting user: {prompt}")
        # In a real scenario, you might want to send the prompt to the client
        # via a WebSocket or store it to be fetched by polling.
        # For now, we just log it.
        
        # Block and wait for input from the API endpoint
        user_input = self.input_queue.get() # This is where it waits for the API call
        logger.info(f"[{self.name}] Received user input: {user_input}")
        return user_input

# --- 2. Main Manager Class ---
class CouncilChamberManager:
    """Manages the philosophical debate between dynamically selected characters"""

    def __init__(self, user_name: str, character_names: List[str], topic: str):
        self.user_name = user_name
        self.topic = topic
        self.character_names = character_names
        self.members = [CouncilMember(name) for name in character_names]
        
        # --- Create Input Queue ---
        self.input_queue = queue.Queue()

        # --- Create Custom User Proxy ---
        self.user_proxy = QueuedUserProxyAgent(
            name=self.user_name,
            input_queue=self.input_queue, # Pass the queue
            system_message=f"""You are {self.user_name}, a human participant in this philosophical debate.
            You can:
            - Ask questions to challenge the historical figures
            - Share your own perspective on the topic
            - Redirect the conversation
            - Engage directly with any participant
            Your responses should be conversational and engaging.""",
            human_input_mode="ALWAYS", # Keep this, our custom agent handles the 'how'
            code_execution_config=False,
            max_consecutive_auto_reply=1, # Keep original logic
            is_termination_msg=lambda x: False, # Keep original logic
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
        
        # State
        self.is_running = False
        self.chat_result = None

    def display_council_info(self):
        """Display the debate setup information (optional for API)"""
        pass # Simplified for API

    def start_debate(self):
        """
        Starts the debate. This call IS BLOCKING.
        It should be called from an API endpoint designed to handle long-running requests.
        """
        if self.is_running:
             logger.warning("Debate is already running.")
             return None # Or raise an exception

        logger.info(f"Starting debate for user '{self.user_name}' on topic '{self.topic}'")
        self.display_council_info()
        
        opening_prompt = f"""
🏛️ The CouncilChamber convenes for a philosophical debate!
Topic: "{self.topic}"
Please begin by sharing your authentic perspective on this topic.
Draw from your actual beliefs and experiences.
{self.user_name}, you'll participate actively - type your thoughts when prompted!
[When it's your turn, simply type your response and press Enter]
"""
        self.is_running = True
        try:
            # This call will block, potentially multiple times for user input
            # Our QueuedUserProxyAgent will handle getting input from the queue
            self.chat_result = self.user_proxy.initiate_chat(
                self.manager,
                message=opening_prompt,
                clear_history=False
            )
            logger.info("Debate concluded or reached max rounds.")
            return self.chat_result
        except Exception as e:
            logger.error(f"Error during debate: {e}", exc_info=True)
            return None # Or re-raise
        finally:
            self.is_running = False

    def send_user_message(self, user_message: str) -> str:
        """
        Sends a user message to the debate.
        This puts the message into the queue, unblocking the waiting initiate_chat.
        """
        if not self.is_running:
            logger.warning("Attempted to send message to inactive or finished debate.")
            return "Debate session is not active or has finished."
            
        logger.info(f"Queuing user message for session: {user_message}")
        try:
            # Put the message into the queue
            # The `get_human_input` method in QueuedUserProxyAgent is waiting for this.
            self.input_queue.put(user_message)
            return f"Message queued: '{user_message}'"
        except Exception as e:
            logger.error(f"Error queuing user message: {e}", exc_info=True)
            return f"Error queuing message: {str(e)}"

    def get_chat_history(self) -> List[dict[str, Any]]:
        """Returns the current chat history."""
        messages = self.group_chat.messages if self.group_chat else []
        return messages
