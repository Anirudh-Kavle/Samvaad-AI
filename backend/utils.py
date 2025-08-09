# utils.py

from typing import Tuple, List
import uuid

def get_user_input() -> Tuple[str, int, List[str], str]:
    """Collect user inputs for the debate setup"""
    print("\n🏛️ COUNCILCHAMBER SETUP")
    print("="*40)
    user_name = input("👋 What's your name? (You'll be participating in the debate): ").strip()
    if not user_name:
        user_name = "Moderator"
    
    # Get number of characters
    while True:
        try:
            num_characters = int(input("👥 How many historical figures for the council? (2-6 recommended): "))
            if num_characters < 2:
                print("   ⚠️  Need at least 2 participants for a meaningful debate!")
                continue
            elif num_characters > 6:
                print("   ⚠️  More than 6 might make the debate too chaotic. Consider fewer participants.")
                continue
            break
        except ValueError:
            print("   ❌ Please enter a valid number!")

    # Get character names
    characters = []
    print(f"\n📝 Enter {num_characters} figures:")
    print("   Examples: Napoleon Bonaparte, Deadpool, Socrates, Peter Griffin, etc.")
    for i in range(num_characters):
        while True:
            character = input(f"   {i+1}. Character name: ").strip()
            if character:
                characters.append(character)
                break
            else:
                print("      ❌ Please enter a valid name!")

    # Get topic
    while True:
        topic = input(f"\n📜 What topic should they debate?: ").strip()
        if topic:
            break
        else:
            print("   ❌ Please enter a valid topic!")

    return user_name, num_characters, characters, topic
    pass


def quick_start_sample():
    """Quick start with interesting sample debates"""
    sample_debates = [
        {
            "characters": ["Socrates", "Friedrich Nietzsche", "The Joker"],
            "topic": "Is Free Will an Illusion?"
        },
        {
            "characters": ["Carl Sagan", "Elon Musk", "Genghis Khan", "Princess Leia"],
            "topic": "Should We Colonize Other Planets?"
        },
        {
            "characters": ["Frida Kahlo", "Ernest Hemingway", "Vincent van Gogh"],
            "topic": "The purpose of art and literature"
        },
        {
            "characters": ["The Flash", "Deadpool", "Batman", "Peter Griffin"],
            "topic": "What’s the Best Superpower?"
        }
    ]
    print("\n🚀 QUICK START - Sample Debates:")
    for i, debate in enumerate(sample_debates, 1):
        chars = ", ".join(debate["characters"])
        print(f"   {i}. {chars}")
        print(f"      Topic: '{debate['topic']}'")
        print()
    
    while True:
        try:
            choice = input("Choose a sample (1-4) or press Enter for custom setup: ").strip()
            if not choice:
                return None  # Custom setup
            choice = int(choice)
            if 1 <= choice <= len(sample_debates):
                selected = sample_debates[choice - 1]
                # Return the structure expected by the main function
                # (num_chars is len(characters))
                return len(selected["characters"]), selected["characters"], selected["topic"] 
            else:
                print("   ❌ Please choose 1-4 or press Enter!")
        except ValueError:
            print("   ❌ Please enter a valid number or press Enter!")
    pass

def create_councilchamber_debate(user_name: str, characters: list, topic: str):
    """Main function to set up and start a debate"""
    print("🏛️ Welcome to CouncilChamber - Where History Debates!")
    session_id = str(uuid.uuid4())

    quick_result = quick_start_sample()
    if quick_result:
        user_name = input("👋 What's your name? (You'll be participating): ").strip() or "Moderator"
        num_chars, characters, topic = quick_result
    else:
        user_name, num_chars, characters, topic = get_user_input()

    print(f"\n✅ DEBATE SETUP CONFIRMED")
    print(f"   👥 Participants: {', '.join(characters)}")
    print(f"   📜 Topic: '{topic}'")
    confirm = input("\n🎯 Start the debate? (y/n): ").strip().lower()
    if confirm != 'y':
        print("   Debate cancelled.")
        return None

    from council_chamber_manager import CouncilChamberManager
    chamber = CouncilChamberManager(
        session_id=session_id,
        user_name=user_name,
        character_names=characters,
        topic=topic
    )
    return chamber.start_debate()



# Example usage (if run directly - for testing purposes)
if __name__ == "__main__":
    print("Testing utility functions...")
    # You can add simple tests here if needed, but these functions rely heavily on user input.
    print("Run the main.py file to use these utilities in the full flow.")
