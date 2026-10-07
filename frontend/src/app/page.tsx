"use client";

import { useCallback, useState } from "react";
import InterviewScreen from "@/components/InterviewScreen";
import ReportScreen from "@/components/ReportScreen";
import StartScreen from "@/components/StartScreen";
import { generateReport, startInterview, submitAnswer } from "@/lib/api";
import type { Difficulty, Message, Report } from "@/lib/types";

type Screen = "start" | "interview" | "report";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("start");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [report, setReport] = useState<Report | null>(null);

  const [starting, setStarting] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [reporting, setReporting] = useState(false);

  const [startError, setStartError] = useState<string | null>(null);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const fetchReport = useCallback(
    async (
      t: string,
      d: Difficulty,
      conv: Message[]
    ) => {
      setScreen("report");
      setReporting(true);
      setReportError(null);
      setReport(null);
      try {
        const result = await generateReport(t, d, conv);
        setReport(result);
      } catch (err) {
        setReportError(
          err instanceof Error ? err.message : "Failed to generate report."
        );
      } finally {
        setReporting(false);
      }
    },
    []
  );

  async function handleStart(t: string, d: Difficulty) {
    setStarting(true);
    setStartError(null);
    try {
      const res = await startInterview(t, d);
      setTopic(t);
      setDifficulty(d);
      setConversation(res.conversation);
      setReport(null);
      setInterviewError(null);
      setScreen("interview");
    } catch (err) {
      setStartError(
        err instanceof Error ? err.message : "Failed to start interview."
      );
    } finally {
      setStarting(false);
    }
  }

  async function handleSend(answer: string) {
    setThinking(true);
    setInterviewError(null);
    try {
      const res = await submitAnswer(topic, difficulty, conversation, answer);
      setConversation(res.conversation);
      if (res.interview_over) {
        await fetchReport(topic, difficulty, res.conversation);
      }
    } catch (err) {
      setInterviewError(
        err instanceof Error ? err.message : "Failed to send answer."
      );
    } finally {
      setThinking(false);
    }
  }

  function handleRestart() {
    setScreen("start");
    setTopic("");
    setDifficulty("Medium");
    setConversation([]);
    setReport(null);
    setStartError(null);
    setInterviewError(null);
    setReportError(null);
  }

  return (
    <main className="app-shell">
      <div className="app-content">
        {screen === "start" && (
          <StartScreen
            onStart={handleStart}
            loading={starting}
            error={startError}
          />
        )}
        {screen === "interview" && (
          <InterviewScreen
            topic={topic}
            difficulty={difficulty}
            conversation={conversation}
            thinking={thinking}
            error={interviewError}
            onSend={handleSend}
          />
        )}
        {screen === "report" && (
          <ReportScreen
            topic={topic}
            difficulty={difficulty}
            report={report}
            loading={reporting}
            error={reportError}
            onRetry={() => void fetchReport(topic, difficulty, conversation)}
            onRestart={handleRestart}
          />
        )}
      </div>
    </main>
  );
}
