# council_member.py

# Import the profiler from the same directory
from character_profiler import CharacterProfiler
# Import autogen (ensure it's installed in your environment)
try:
    import autogen
    AUTOGEN_AVAILABLE = True
except ImportError:
    print("❌ AutoGen not found. Please install it: pip install ag2[openai]")
    AUTOGEN_AVAILABLE = False
    # You might want to handle this more gracefully later

# Import config (ensure config.py is in the same directory or adjust path)
from config import LLM_CONFIG

class CouncilMember:
    """Enhanced agent wrapper for dynamic character creation"""
    def __init__(self, character_name: str, llm_config_override=None):
        if not AUTOGEN_AVAILABLE:
             raise RuntimeError("AutoGen library is required but not available.")
        self.character_name = character_name
        self.speaking_count = 0
        # Generate character profile
        self.profile = CharacterProfiler.create_character_profile(character_name)
        config_to_use = llm_config_override if llm_config_override is not None else LLM_CONFIG # <--- Use override if provided
        # Create the agent
        self.agent = autogen.AssistantAgent(
            name=self.profile["agent_name"],
            system_message=self.profile["system_message"],
            llm_config=config_to_use,# Use the config imported from config.py
        )

    def __str__(self):
        return self.character_name

# Example usage (if run directly)
if __name__ == "__main__":
    try:
        member = CouncilMember("Socrates")
        print(f"Created agent: {member.agent.name}")
    except Exception as e:
         print(f"Error creating CouncilMember: {e}")
