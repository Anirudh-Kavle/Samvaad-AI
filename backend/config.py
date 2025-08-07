# config.py

import os

# --- Configuration ---
# Note: In a real application, never hardcode API keys. Use environment variables.
# For now, we keep it simple as per your notebook.
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or "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" # Replace with your actual key

# --- Important: Fix the trailing space in base_url ---
CONFIG_LIST = [
    {
        "model": "deepseek/deepseek-chat-v3-0324:free",
        "api_key": OPENROUTER_API_KEY,
        "base_url": "https://openrouter.ai/api/v1", # Removed trailing space
        "price": [0.0, 0.0]
    }
]

LLM_CONFIG = {
    "config_list": CONFIG_LIST,
    "temperature": 0.8,
    "max_tokens": 400,
}

print("🏛️ CouncilChamber Configuration Loaded (config.py)")
