"use client";

import { FormEvent, useState } from "react";
import type { Difficulty } from "@/lib/types";

const DIFFICULTIES: {
  value: Difficulty;
  label: string;
  hint: string;
}[] = [
  { value: "Easy", label: "Easy", hint: "Definitions & recall" },
  { value: "Medium", label: "Medium", hint: "Applied problems" },
  { value: "Hard", label: "Hard", hint: "Trade-offs & systems" },
];

type Props = {
  onStart: (topic: string, difficulty: Difficulty) => Promise<void>;
  loading: boolean;
  error: string | null;
};

export default function StartScreen({ onStart, loading, error }: Props) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) {
      setLocalError("Enter a technical topic to begin.");
      return;
    }
    setLocalError(null);
    await onStart(trimmed, difficulty);
  }

  const displayError = localError || error;

  return (
    <section className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col justify-center px-5 py-16 sm:px-8">
      <div className="animate-fade-up">
        <p className="mb-5 font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-signal">
          Practice · Pressure · Progress
        </p>
        <h1 className="font-display text-[clamp(2.75rem,9vw,4.5rem)] font-bold leading-[0.95] tracking-tight text-mist-50">
          AI Interview
          <br />
          <span className="bg-gradient-to-r from-signal to-[#7EE8FF] bg-clip-text text-transparent">
            Coach
          </span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-mist-200 sm:text-lg">
          Pick a topic. Face a real interviewer. Get a scored report — no
          spoilers, no shortcuts.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-12 animate-fade-up space-y-7"
        style={{ animationDelay: "120ms" }}
      >
        <div>
          <label
            htmlFor="topic"
            className="mb-2.5 block text-xs font-semibold uppercase tracking-[0.18em] text-mist-300"
          >
            Technical topic
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              if (localError) setLocalError(null);
            }}
            placeholder="e.g. Binary Trees, REST APIs, System Design…"
            disabled={loading}
            autoFocus
            autoComplete="off"
            className="w-full rounded-xl border border-white/10 bg-ink-800/70 px-4 py-3.5 text-base text-mist-50 shadow-panel backdrop-blur-sm transition placeholder:text-mist-300/50 focus:border-signal/50 focus:shadow-glow disabled:opacity-60"
          />
        </div>

        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-mist-300">
            Difficulty
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {DIFFICULTIES.map((d) => {
              const active = difficulty === d.value;
              return (
                <button
                  key={d.value}
                  type="button"
                  disabled={loading}
                  onClick={() => setDifficulty(d.value)}
                  className={`rounded-xl border px-2 py-3.5 text-center transition sm:px-3 ${
                    active
                      ? "border-signal/40 bg-signal/10 shadow-glow"
                      : "border-white/10 bg-ink-800/40 hover:border-white/20 hover:bg-ink-700/50"
                  } disabled:opacity-60`}
                >
                  <span
                    className={`block font-display text-sm font-semibold sm:text-base ${
                      active ? "text-signal" : "text-mist-100"
                    }`}
                  >
                    {d.label}
                  </span>
                  <span className="mt-1 block text-[10px] leading-tight text-mist-300 sm:text-[11px]">
                    {d.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {displayError && (
          <div
            role="alert"
            className="animate-fade-in rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            {displayError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl bg-signal px-6 py-4 font-display text-base font-bold tracking-wide text-ink-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
        >
          <span className="relative z-10 flex items-center justify-center gap-2.5">
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                Starting interview…
              </>
            ) : (
              <>
                Start Interview
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </>
            )}
          </span>
        </button>
      </form>

      <p
        className="mt-10 animate-fade-up text-center text-xs text-mist-300/70"
        style={{ animationDelay: "240ms" }}
      >
        The interviewer never gives away the answer — only you do.
      </p>
    </section>
  );
}
