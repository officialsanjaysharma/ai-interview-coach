export type Difficulty = "Easy" | "Medium" | "Hard";

export type Message = {
  role: "interviewer" | "candidate";
  content: string;
};

export type Report = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  topics_to_revise: string[];
  verdict: string;
  result: "Pass" | "Fail";
  level: "excellent" | "good" | "adequate" | "weak";
};

export type StartResponse = {
  message: string;
  conversation: Message[];
};

export type AnswerResponse = {
  message: string;
  conversation: Message[];
  interview_over: boolean;
};
