import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import ValidationError

from interviewer import generate_report, get_next_interviewer_message
from models import (
    AnswerRequest,
    AnswerResponse,
    Message,
    ReportRequest,
    ReportResponse,
    StartInterviewRequest,
    StartInterviewResponse,
)

load_dotenv()


def _get_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key.strip() in ("", "your_groq_api_key_here"):
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is missing. Add it to backend/.env and restart the server.",
        )
    return Groq(api_key=api_key.strip())


def _cors_origins() -> list[str]:
    defaults = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    extra = os.getenv("CORS_ORIGINS", "").strip()
    if extra:
        defaults.extend(o.strip() for o in extra.split(",") if o.strip())
    return defaults


@asynccontextmanager
async def lifespan(_app: FastAPI):
    print("=" * 56)
    print("  AI Interview Coach — backend is ready")
    print("  Health:  GET  /health")
    print("  Start:   POST /interview/start")
    print("  Answer:  POST /interview/answer")
    print("  Report:  POST /interview/report")
    print("=" * 56)
    yield


app = FastAPI(
    title="AI Interview Coach",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
@app.get("/health")
def health():
    return {"status": "ok", "service": "AI Interview Coach"}


@app.post("/interview/start", response_model=StartInterviewResponse)
def start_interview(body: StartInterviewRequest):
    topic = body.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Please enter a topic.")

    try:
        client = _get_client()
        message, _ = get_next_interviewer_message(
            client, topic, body.difficulty, []
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not start the interview: {exc}",
        ) from exc

    conversation = [Message(role="interviewer", content=message)]
    return StartInterviewResponse(message=message, conversation=conversation)


@app.post("/interview/answer", response_model=AnswerResponse)
def submit_answer(body: AnswerRequest):
    topic = body.topic.strip()
    answer = body.answer.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required.")
    if not answer:
        raise HTTPException(status_code=400, detail="Please type an answer before sending.")
    if not body.conversation:
        raise HTTPException(status_code=400, detail="Conversation is empty.")

    conversation = list(body.conversation)
    conversation.append(Message(role="candidate", content=answer))

    try:
        client = _get_client()
        message, interview_over = get_next_interviewer_message(
            client, topic, body.difficulty, conversation
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not get the next question: {exc}",
        ) from exc

    conversation.append(Message(role="interviewer", content=message))
    return AnswerResponse(
        message=message,
        conversation=conversation,
        interview_over=interview_over,
    )


@app.post("/interview/report", response_model=ReportResponse)
def create_report(body: ReportRequest):
    topic = body.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required.")
    if len(body.conversation) < 2:
        raise HTTPException(
            status_code=400,
            detail="Need a fuller conversation before generating a report.",
        )

    try:
        client = _get_client()
        data = generate_report(client, topic, body.difficulty, body.conversation)
        return ReportResponse(**data)
    except HTTPException:
        raise
    except ValidationError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Report data was invalid: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not generate the report: {exc}",
        ) from exc


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
