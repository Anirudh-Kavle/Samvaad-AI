# Samvaad.AI - Character Debate Simulator 
Samvaad.AI is a web application that allows users to create dynamic, AI-powered debates between any 2-6 historical figures, fictional characters, or pop culture icons. You don't just watch these debates, you actively participate as a council member, engaging in real-time conversation with personalities from across time and space.

## Key Features 

#### Live, Multi-Agent Debates 
- **Authentic Voices**: Each character is meticulously profiled to embody their true personality, beliefs, and communication style.
- **User Participation**: You are not a spectator; you are an active participant in the debate, able to ask questions, challenge ideas, and steer the conversation.
- **Dynamic Interaction**: Characters respond to each other _and_ to you, creating a rich, multi-threaded dialogue.
     
#### Historical & Fictional Councils 
- **Unlimited Combinations**: Choose from thousands of characters spanning history, literature, film, TV, comics, and more.
- **Any Topic**: Debate anything—from "The meaning of suffering" to "Pineapple on pizza is blasphemy"—with the perfect panel of experts(or amateurs, your call really).
     
#### User-Friendly Interface 
- **Three-Step Setup**: Select your characters, set the topic, and join the debate.
- **Persistent History**: All your past debates are saved and easily accessible for review.
- **Intuitive Chat Room**: A clean, modern interface designed for seamless interaction.

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS, ShadCN UI components, GSAP & OGL.
- **Backend**: FastAPI (Python), AutoGen for multi-agent conversations, SQLAlchemy for database management.
- **Database**: PostgreSQL (local via Postgres, production via Neon.tech).
- **AI Provider**: Groq API for fast, powerful LLM inference.
- **Deployment**: Vercel (frontend) and Google Cloud Run (backend).

## Getting Started
1. Clone the Repo:
```
https://github.com/Anirudh-Kavle/Samvaad-AI.git
cd samvaad-ai
```
2. Create a virtual environment
3. Set Up the Backend
```
cd backend
pip install -r requirements.txt
```
- Create a .env file in the backend directory and add your database URL and Groq API key:
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```
- Initialize the database: 
```
python database.py
```
- Run the backend server: 
```
uvicorn api:app --reload
```
4. Set Up the Frontend
```
cd ../frontend
npm install
```
- Create a .env.local file in the frontend directory:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
- Run the development server:
```
npm run dev
```






