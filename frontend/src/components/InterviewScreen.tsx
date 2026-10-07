"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Difficulty, Message } from "@/lib/types";

type Props = {
  topic: string;
  difficulty: Difficulty;
  conversation: Message[];
  thinking: boolean;
  error: string | null;
  onSend: (answer: string) => Promise<void>;
};

export default function InterviewScreen({
  topic,
  difficulty,
  conversation,
  thinking,
  error,
  onSend,
}: Props) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, thinking]);

  useEffect(() => {
    if (!thinking) textareaRef.current?.focus();
  }, [thinking]);

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || thinking) return;
    setDraft("");
    await onSend(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-3xl flex-col px-4 sm:px-6">
      <header className="animate-fade-in shrink-0 border-b border-white/10 py-4 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.24em] text-signal">
              Live interview
            </p>
            <h2 className="mt-1 truncate font-display text-xl font-bold text-mist-50 sm:text-2xl">
              {topic}
            </h2>
          </div>
          <span className="shrink-0 rounded-lg border border-white/10 bg-ink-800/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-mist-200">
            {difficulty}
          </span>
        </div>
      </header>

      <div className="chat-scroll flex-1 space-y-4 overflow-y-auto py-5 sm:py-6">
        {conversation.map((msg, i) => {
          const isInterviewer = msg.role === "interviewer";
          return (
            <div
              key={`${msg.role}-${i}`}
              className={`animate-fade-up flex ${
                isInterviewer ? "justify-start" : "justify-end"
              }`}
              style={{ animationDelay: `${Math.min(i * 40, 200)}ms` }}
            >
              <div
                className={`max-w-[88%] sm:max-w-[78%] ${
                  isInterviewer ? "items-start" : "items-end"
                } flex flex-col gap-1.5`}
              >
                <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-300">
                  {isInterviewer ? "Interviewer" : "You"}
                </span>
                <div
                  className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed sm:text-base ${
                    isInterviewer
                      ? "rounded-tl-md border border-white/10 bg-ink-800/80 text-mist-100 shadow-panel"
                      : "rounded-tr-md bg-signal text-ink-950"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {thinking && (
          <div className="animate-fade-in flex justify-start">
            <div className="flex flex-col gap-1.5">
              <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-300">
                Interviewer
              </span>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-white/10 bg-ink-800/80 px-4 py-3.5 text-sm text-mist-200">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-signal" />
                  <span
                    className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-signal"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-signal"
                    style={{ animationDelay: "0.4s" }}
                  />
                </span>
                Thinking…
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-white/10 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {error && (
          <div
            role="alert"
            className="mb-3 animate-fade-in rounded-xl border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm text-danger"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={thinking}
            rows={3}
            placeholder={
              thinking
                ? "Waiting for the interviewer…"
                : "Type your answer… (Enter to send, Shift+Enter for new line)"
            }
            className="w-full resize-none rounded-2xl border border-white/10 bg-ink-800/80 py-3.5 pl-4 pr-24 text-[15px] text-mist-50 shadow-panel backdrop-blur-sm placeholder:text-mist-300/45 focus:border-signal/40 disabled:opacity-55"
          />
          <button
            type="submit"
            disabled={thinking || !draft.trim()}
            className="absolute bottom-3 right-3 rounded-xl bg-signal px-4 py-2 font-display text-sm font-bold text-ink-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
