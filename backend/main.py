# main.py

"""
Main entry point for the CouncilChamber application.
This script initializes the configuration and starts the debate setup process.
"""

# Import the main function from utils
from utils import create_councilchamber_debate

def main():
    """
    Main function to run the CouncilChamber application.
    """
    print("="*60)
    print("🏛️ LAUNCHING COUNCILCHAMBER")
    print("="*60)
    
    # Start the main debate creation and execution process
    chat_result = create_councilchamber_debate()
    
    # Optionally, you could process the chat_result here
    # For example, saving the conversation log
    if chat_result:
        print("\n🏛️ CouncilChamber session concluded.")
        # print(f"\nChat Result Object: {type(chat_result)}") # For debugging
        # You can access chat_result.chat_history if needed
    else:
        print("\n🏛️ CouncilChamber session ended or was cancelled.")

if __name__ == "__main__":
    main()
