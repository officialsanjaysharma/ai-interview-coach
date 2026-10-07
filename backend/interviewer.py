import json
import re
from typing import Any

from groq import Groq

from models import Difficulty, Message

MODEL = "openai/gpt-oss-120b"
END_MARKER = "[[INTERVIEW_END]]"

DIFFICULTY_GUIDANCE = {
    "Easy": "Focus on basic definitions, core concepts, and simple recall. Keep questions approachable.",
    "Medium": "Ask applied problems and practical scenarios. Probe how they would use the concept.",
    "Hard": "Explore trade-offs, edge cases, and system-level thinking. Expect depth and nuance.",
}


def _build_system_prompt(topic: str, difficulty: Difficulty) -> str:
    return f"""You are a professional technical interviewer conducting a live interview.

Topic: {topic}
Difficulty: {difficulty}
{DIFFICULTY_GUIDANCE[difficulty]}

Rules:
- Ask ONE question at a time. Never stack multiple questions.
- Never teach, never hint, never reveal the correct answer.
- Stay professional, calm, and encouraging.
- If the candidate's answer is strong: briefly acknowledge (one short line) and move to a different aspect of the topic.
- If the answer is partly right: ask one probing follow-up without revealing what is missing.
- If the answer is wrong: note the gap in one short line and move on to a different question.
- Do not lecture. Do not summarize the whole topic mid-interview.
- End the interview yourself when you have enough signal:
  - End early (kindly) if they are clearly struggling across several questions.
  - Wrap up once key areas are covered if they are doing well.
  - Typical length: about 4–7 interviewer questions before ending.
- When ending, give a brief professional closing (thank them, say the interview is complete).
  On that SAME final message, append the exact token {END_MARKER} at the very end.
- Never include {END_MARKER} unless you are ending the interview.
- Speak only as the interviewer. Do not role-play the candidate. Do not use markdown headings."""


def _format_conversation(conversation: list[Message]) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []
    for msg in conversation:
        role = "assistant" if msg.role == "interviewer" else "user"
        messages.append({"role": role, "content": msg.content})
    return messages


def _strip_end_marker(text: str) -> tuple[str, bool]:
    ended = END_MARKER in text
    cleaned = text.replace(END_MARKER, "").strip()
    # Also catch natural endings if the model forgot the marker but clearly closed
    if not ended:
        lower = cleaned.lower()
        natural_end = any(
            phrase in lower
            for phrase in (
                "that concludes our interview",
                "this concludes the interview",
                "interview is complete",
                "interview is over",
                "we'll wrap up here",
                "we will wrap up here",
                "thank you for your time today",
            )
        )
        # Only treat as end if there have been enough exchanges — handled by caller via marker preference
        if natural_end and len(cleaned) < 500:
            ended = True
    return cleaned, ended


def get_next_interviewer_message(
    client: Groq,
    topic: str,
    difficulty: Difficulty,
    conversation: list[Message],
) -> tuple[str, bool]:
    """Return (message_text, interview_over)."""
    system = _build_system_prompt(topic, difficulty)

    if not conversation:
        user_kickoff = (
            f"Begin the interview on '{topic}' at {difficulty} difficulty. "
            "Greet briefly and ask your first question."
        )
        messages: list[dict[str, str]] = [
            {"role": "system", "content": system},
            {"role": "user", "content": user_kickoff},
        ]
    else:
        messages = [
            {"role": "system", "content": system},
            *_format_conversation(conversation),
        ]

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=1,
        max_completion_tokens=2048,
        top_p=1,
        reasoning_effort="medium",
        stream=False,
        stop=None,
    )
    raw = (response.choices[0].message.content or "").strip()
    if not raw:
        raise RuntimeError("The interviewer returned an empty response. Please try again.")

    text, ended = _strip_end_marker(raw)
    if not text:
        text = "Thank you for your time. That concludes our interview."
        ended = True
    return text, ended


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise ValueError("Could not parse report JSON from the model response.")
        return json.loads(match.group(0))


def generate_report(
    client: Groq,
    topic: str,
    difficulty: Difficulty,
    conversation: list[Message],
) -> dict[str, Any]:
    transcript = "\n".join(
        f"{'Interviewer' if m.role == 'interviewer' else 'Candidate'}: {m.content}"
        for m in conversation
    )

    system = """You are an expert technical interview evaluator.
Return ONLY valid JSON with this exact shape:
{
  "score": <integer 0-100>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "topics_to_revise": [<string>, ...],
  "verdict": <string>,
  "result": "Pass" or "Fail"
}

Scoring guide:
- 85–100: excellent
- 70–84: good
- 55–69: adequate
- below 55: weak

Pass if score >= 55, otherwise Fail.
Strengths and weaknesses MUST refer to things the candidate actually said.
topics_to_revise should be concrete subtopics.
verdict should be 2–4 sentences, professional and specific.
No markdown, no commentary outside JSON."""

    user = f"""Topic: {topic}
Difficulty: {difficulty}

Full interview transcript:
{transcript}

Evaluate the candidate now."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=1,
        max_completion_tokens=2048,
        top_p=1,
        reasoning_effort="medium",
        stream=False,
        stop=None,
        response_format={"type": "json_object"},
    )
    raw = (response.choices[0].message.content or "").strip()
    data = _extract_json(raw)

    score = int(data.get("score", 0))
    score = max(0, min(100, score))

    if score >= 85:
        level = "excellent"
    elif score >= 70:
        level = "good"
    elif score >= 55:
        level = "adequate"
    else:
        level = "weak"

    result = data.get("result")
    if result not in ("Pass", "Fail"):
        result = "Pass" if score >= 55 else "Fail"
    # Enforce consistency with score threshold
    result = "Pass" if score >= 55 else "Fail"

    strengths = data.get("strengths") or []
    weaknesses = data.get("weaknesses") or []
    topics = data.get("topics_to_revise") or []
    verdict = data.get("verdict") or "No verdict available."

    if not isinstance(strengths, list):
        strengths = [str(strengths)]
    if not isinstance(weaknesses, list):
        weaknesses = [str(weaknesses)]
    if not isinstance(topics, list):
        topics = [str(topics)]

    return {
        "score": score,
        "strengths": [str(s) for s in strengths][:8],
        "weaknesses": [str(w) for w in weaknesses][:8],
        "topics_to_revise": [str(t) for t in topics][:8],
        "verdict": str(verdict),
        "result": result,
        "level": level,
    }
