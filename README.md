# AI Interview Coach

Practice technical interviews with an AI interviewer. Pick a topic and difficulty, answer one question at a time, and get a scored Pass/Fail report — without the interviewer ever giving away the answer.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Python FastAPI + Groq (`openai/gpt-oss-120b`)

## Setup

### 1. Groq API key

1. Create a key at [console.groq.com](https://console.groq.com)
2. Put it in `backend/.env`:

```bash
cp backend/.env.example backend/.env
# edit backend/.env and set GROQ_API_KEY=...
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

You should see: `AI Interview Coach — backend is ready`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| POST | `/interview/start` | Start interview (`topic`, `difficulty`) |
| POST | `/interview/answer` | Submit answer, get next message |
| POST | `/interview/report` | Generate scored report |

No database — the frontend sends the conversation on each request.

## Deploy (optional)

- **Backend → Render:** root `backend`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`, env `GROQ_API_KEY`
- **Frontend → Vercel:** root `frontend`, env `NEXT_PUBLIC_API_URL` = your Render URL (no trailing slash)
- Set `CORS_ORIGINS` on the backend to your Vercel domain when you have it
