from typing import Literal

from pydantic import BaseModel, Field


Difficulty = Literal["Easy", "Medium", "Hard"]
VerdictLevel = Literal["excellent", "good", "adequate", "weak"]
PassFail = Literal["Pass", "Fail"]


class Message(BaseModel):
    role: Literal["interviewer", "candidate"]
    content: str = Field(..., min_length=1)


class StartInterviewRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    difficulty: Difficulty


class StartInterviewResponse(BaseModel):
    message: str
    conversation: list[Message]


class AnswerRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    difficulty: Difficulty
    conversation: list[Message] = Field(..., min_length=1)
    answer: str = Field(..., min_length=1, max_length=8000)


class AnswerResponse(BaseModel):
    message: str
    conversation: list[Message]
    interview_over: bool


class ReportRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    difficulty: Difficulty
    conversation: list[Message] = Field(..., min_length=2)


class ReportResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    strengths: list[str]
    weaknesses: list[str]
    topics_to_revise: list[str]
    verdict: str
    result: PassFail
    level: VerdictLevel
