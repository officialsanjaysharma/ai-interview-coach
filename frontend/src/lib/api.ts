import type {
  AnswerResponse,
  Difficulty,
  Message,
  Report,
  StartResponse,
} from "./types";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

async function request<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Cannot reach the interview server. Is the backend running?"
    );
  }

  let data: { detail?: string | { msg?: string }[] } | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const detail = data?.detail;
    if (typeof detail === "string") throw new Error(detail);
    if (Array.isArray(detail) && detail[0]?.msg) throw new Error(detail[0].msg);
    throw new Error(`Request failed (${res.status}). Please try again.`);
  }

  return data as T;
}

export function startInterview(topic: string, difficulty: Difficulty) {
  return request<StartResponse>("/interview/start", { topic, difficulty });
}

export function submitAnswer(
  topic: string,
  difficulty: Difficulty,
  conversation: Message[],
  answer: string
) {
  return request<AnswerResponse>("/interview/answer", {
    topic,
    difficulty,
    conversation,
    answer,
  });
}

export function generateReport(
  topic: string,
  difficulty: Difficulty,
  conversation: Message[]
) {
  return request<Report>("/interview/report", {
    topic,
    difficulty,
    conversation,
  });
}
