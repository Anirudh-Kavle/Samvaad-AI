# config.py

import os
# Import load_dotenv from the dotenv package
from dotenv import load_dotenv

# --- Load environment variables from .env file ---
# This should be called before accessing os.getenv
load_dotenv()

# --- Configuration ---
# Load the API key from the environment variable
# os.getenv will return None if the key is not found, so we provide a fallback (though it should be set)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Check if the key was loaded successfully
if not OPENROUTER_API_KEY:
    raise ValueError("❌ OPENROUTER_API_KEY not found. Please check your .env file.")

# --- Important: Fix the trailing space in base_url (already fixed in your original) ---
CONFIG_LIST = [
    {
        "model": "deepseek/deepseek-chat-v3-0324:free",
        "api_key": OPENROUTER_API_KEY,
        "base_url": "https://openrouter.ai/api/v1", # Ensure no trailing space
        "price": [0.0, 0.0]
    }
]

LLM_CONFIG = {
    "config_list": CONFIG_LIST,
    "temperature": 0.8,
    "max_tokens": 800,
}

print("🏛️ CouncilChamber Configuration Loaded (config.py)")
