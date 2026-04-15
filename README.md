# 🤖 AI Chat — Production ChatGPT Clone

A production-grade ChatGPT-like app built with **FastAPI**, **React**, **MongoDB**, and **OpenAI**.

## Features

-  **Auth** — JWT login/signup with access + refresh tokens
-  **Multi-conversation** — Sidebar like ChatGPT, create/rename/delete
-  **Streaming** — Real-time token streaming via SSE
-  **Context-aware** — Full conversation history sent to OpenAI
-  **Persistent** — All conversations + messages saved to MongoDB
-  **Premium UI** — Dark glassmorphism design

##  Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running locally (or Atlas URL)
- OpenAI API Key

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Edit .env and add your OpenAI API key
nano .env  # Set OPENAI_API_KEY=sk-...

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: http://localhost:8000
API docs: http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

### 3. Open the app

Go to http://localhost:5173 and sign up!

## 🔧 Configuration

Edit `backend/.env`:

```env
MONGODB_URL=mongodb://localhost:27017    # Or your Atlas URL
DB_NAME=chatapp
SECRET_KEY=your-super-secret-key        # Change in production!
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini               # or gpt-4o, gpt-3.5-turbo
```

##  Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + CORS + lifespan
│   │   ├── config.py        # Pydantic settings
│   │   ├── database.py      # MongoDB Motor connection
│   │   ├── models/          # Pydantic models
│   │   ├── routes/          # auth, conversations, chat
│   │   ├── services/        # auth_service, openai_service
│   │   └── middleware/      # JWT dependency
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── api/             # Axios + interceptors
        ├── context/         # Auth context
        ├── hooks/           # useStreamChat
        ├── components/      # Sidebar, ChatWindow, etc.
        └── pages/           # Login, Signup, Chat
```

##  API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/signup | No | Register |
| POST | /auth/login | No | Login |
| POST | /auth/refresh | No | Refresh token |
| GET | /auth/me | Yes | Current user |
| GET | /conversations | Yes | List conversations |
| POST | /conversations | Yes | Create conversation |
| GET | /conversations/{id} | Yes | Get with messages |
| PATCH | /conversations/{id} | Yes | Rename |
| DELETE | /conversations/{id} | Yes | Delete |
| POST | /chat/stream/{id} | Yes | Stream AI response |
