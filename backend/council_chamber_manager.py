# council_chamber_manager.py

import autogen
from typing import List
from council_member import CouncilMember
from config import LLM_CONFIG

class CouncilChamberManager:
    """Manages the philosophical debate between dynamically selected characters"""

    def __init__(self, user_name: str, character_names: List[str], topic: str):
        self.user_name = user_name
        self.topic = topic
        self.character_names = character_names
        # Create CouncilMember instances
        self.members = [CouncilMember(name) for name in character_names]
        
        # Create user proxy agent
        self.user_proxy = autogen.UserProxyAgent(
            name=self.user_name,
            system_message=f"""You are {self.user_name}, a human participant in this philosophical debate.
            You can:
            - Ask questions to challenge the historical figures
            - Share your own perspective on the topic
            - Redirect the conversation
            - Engage directly with any participant
            Your responses should be conversational and engaging.""",
            human_input_mode="ALWAYS", # Always ask for human input
            code_execution_config=False,
            max_consecutive_auto_reply=1, # Allow one auto-reply before asking user again
            is_termination_msg=lambda x: False, # Never auto-terminate based on message content
            default_auto_reply="[Waiting for human input...]",
        )
        
        # Prepare list of all agents for the group chat
        self.agents = [member.agent for member in self.members] + [self.user_proxy]
        self.max_rounds = 20 # Set a maximum number of rounds

        # Set up the group chat
        self.group_chat = autogen.GroupChat(
            agents=self.agents,
            messages=[],
            max_round=self.max_rounds,
            speaker_selection_method="round_robin", # Characters speak in turn
            allow_repeat_speaker=True,
            enable_clear_history=False
        )
        
        # Create the manager for the group chat
        self.manager = autogen.GroupChatManager(
            groupchat=self.group_chat,
            llm_config=LLM_CONFIG # Use the config from config.py
        )

    def display_council_info(self):
        """Display the debate setup information"""
        print("\n" + "="*70)
        print("🏛️  WELCOME TO THE COUNCILCHAMBER  🏛️")
        print("="*70)
        print(f"📜 Today's Topic: '{self.topic}'")
        print(f"\n👥 Council Members ({len(self.character_names)}):")
        for i, name in enumerate(self.character_names, 1):
            print(f"   {i}. {name}")
        print(f"\n💡 Welcome {self.user_name}! You're a full participant in this debate!")
        print("   • Ask questions to challenge their thinking")
        print("   • Share your own perspective")
        print("   • Redirect the conversation")
        print("   • Type your input when prompted, or press Enter to let them continue")
        print("-"*70)

    def start_debate(self):
        """Initialize and start the philosophical debate"""
        self.display_council_info()
        
        # Create an engaging opening prompt
        opening_prompt = f"""
🏛️ The CouncilChamber convenes for a philosophical debate!
Topic: "{self.topic}"
Please begin by sharing your authentic perspective on this topic.
Draw from your actual beliefs and experiences.
{self.user_name}, you'll participate actively - type your thoughts when prompted!
[When it's your turn, simply type your response and press Enter]
"""
        try:
            # Initiate the chat
            chat_result = self.user_proxy.initiate_chat(
                self.manager,
                message=opening_prompt,
                clear_history=False # Use the history from the group chat
            )
            return chat_result
        except KeyboardInterrupt:
            print("\n🏛️ CouncilChamber session ended by user.")
            return None
        except Exception as e:
            print(f"\n❌ An error occurred: {e}")
            return None

# Example usage (if run directly - for testing purposes)
if __name__ == "__main__":
    # This part is just for testing the class creation
    # A real run would be initiated from main.py
    print("Testing CouncilChamberManager...")
    try:
        # Using simple inputs for testing
        manager = CouncilChamberManager("TestUser", ["Socrates", "Plato"], "The nature of justice")
        print("CouncilChamberManager instance created successfully.")
        # Note: We won't call start_debate() here as it requires user interaction
    except Exception as e:
        print(f"Error during test: {e}")
