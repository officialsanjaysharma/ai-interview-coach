"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Difficulty, Report } from "@/lib/types";

type Props = {
  topic: string;
  difficulty: Difficulty;
  report: Report | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onRestart: () => void;
};

function scoreColor(level: Report["level"]) {
  switch (level) {
    case "excellent":
    case "good":
      return { ring: "#3EE0C2", text: "text-signal", label: "text-signal" };
    case "adequate":
      return { ring: "#F0B429", text: "text-warn", label: "text-warn" };
    default:
      return { ring: "#F07178", text: "text-danger", label: "text-danger" };
  }
}

function AnimatedScore({ score, level }: { score: number; level: Report["level"] }) {
  const [display, setDisplay] = useState(0);
  const colors = scoreColor(level);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * score));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative mx-auto h-40 w-40">
      <svg viewBox="0 0 100 100" className="-rotate-90 h-full w-full">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={colors.ring}
          strokeWidth="6"
          strokeLinecap="round"
          className="score-arc"
          style={
            {
              "--score-offset": offset,
            } as CSSProperties
          }
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-4xl font-bold ${colors.text}`}>
          {display}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mist-300">
          / 100
        </span>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  delay,
}: {
  title: string;
  children: ReactNode;
  delay: number;
}) {
  return (
    <section
      className="animate-fade-up rounded-2xl border border-white/10 bg-ink-800/50 p-5 backdrop-blur-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.2em] text-mist-300">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function ReportScreen({
  topic,
  difficulty,
  report,
  loading,
  error,
  onRetry,
  onRestart,
}: Props) {
  if (loading) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 h-12 w-12 animate-spin rounded-full border-2 border-signal/20 border-t-signal" />
        <h2 className="animate-fade-up font-display text-2xl font-bold text-mist-50">
          Generating your report…
        </h2>
        <p className="mt-3 animate-fade-up text-sm text-mist-200" style={{ animationDelay: "100ms" }}>
          Scoring your answers and preparing feedback.
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h2 className="font-display text-2xl font-bold text-mist-50">
          Couldn&apos;t generate the report
        </h2>
        <p className="mt-3 text-sm text-danger">{error || "Something went wrong."}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-signal px-5 py-3 font-display text-sm font-bold text-ink-950"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-xl border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist-100"
          >
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  const colors = scoreColor(report.level);
  const passed = report.result === "Pass";

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="animate-fade-up text-center">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-signal">
          Interview Complete
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold text-mist-50 sm:text-4xl">
          {topic}
        </h2>
        <p className="mt-2 text-sm text-mist-300">{difficulty} difficulty</p>
      </header>

      <div className="mt-10 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <AnimatedScore score={report.score} level={report.level} />
        <div className="mt-6 flex justify-center">
          <span
            className={`rounded-xl border px-5 py-2 font-display text-lg font-bold tracking-widest ${
              passed
                ? "border-signal/40 bg-signal/10 text-signal"
                : "border-danger/40 bg-danger-soft text-danger"
            }`}
          >
            {report.result.toUpperCase()}
          </span>
        </div>
        <p className={`mt-3 text-center text-sm capitalize ${colors.label}`}>
          {report.level} performance
        </p>
      </div>

      <div className="mt-10 space-y-4">
        <Section title="Strengths" delay={160}>
          <ul className="space-y-2">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-mist-100">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                {s}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Areas for improvement" delay={220}>
          <ul className="space-y-2">
            {report.weaknesses.map((w, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-mist-100">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                {w}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Topics to revise" delay={280}>
          <div className="flex flex-wrap gap-2">
            {report.topics_to_revise.map((t, i) => (
              <span
                key={i}
                className="rounded-lg border border-white/10 bg-ink-900/80 px-3 py-1.5 text-sm text-mist-100"
              >
                {t}
              </span>
            ))}
          </div>
        </Section>

        <Section title="Interviewer's verdict" delay={340}>
          <p className="text-sm leading-relaxed text-mist-100 sm:text-[15px]">
            {report.verdict}
          </p>
        </Section>
      </div>

      <div className="mt-10 animate-fade-up pb-8" style={{ animationDelay: "400ms" }}>
        <button
          type="button"
          onClick={onRestart}
          className="w-full rounded-xl bg-signal px-6 py-4 font-display text-base font-bold text-ink-950 transition hover:brightness-110"
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
}
