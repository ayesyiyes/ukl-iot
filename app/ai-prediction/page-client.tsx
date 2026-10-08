"use client";

import { useCallback, useEffect, useState } from "react";
import { FoodGuardHeader } from "@/app/ui/foodguard-header";
import type { SensorReading } from "@/lib/ai/spoilage-analysis";
import {
  AIAnalysisCard,
  AIOverview,
  PredictionHistory,
  PredictionModeSelector,
  SensorDataOverview,
  TapeAIComingSoon,
  type HistoryEntry,
  type PageState,
  type SavedAnalysis,
} from "./sections";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  history_saved?: boolean;
  history_message?: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const body = await response.json() as ApiEnvelope<T>;
  if (!response.ok || !body.success) throw new Error(body.message || "The request could not be completed.");
  return body;
}

export default function AIPredictionPage() {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [sensorState, setSensorState] = useState<PageState>("loading");
  const [sensorError, setSensorError] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyState, setHistoryState] = useState<PageState>("loading");
  const [historyError, setHistoryError] = useState("");
  const [result, setResult] = useState<SavedAnalysis | null>(null);
  const [historyMessage, setHistoryMessage] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [tapeMessage, setTapeMessage] = useState(false);

  const loadLatest = useCallback(async () => {
    setSensorState("loading");
    setSensorError("");
    try {
      const response = await requestJson<SensorReading | null>("/api/latest");
      setReading(response.data ?? null);
      setSensorState(response.data ? "ready" : "empty");
    } catch (error) {
      setSensorState("error");
      setSensorError(error instanceof Error ? error.message : "Unable to load sensor data.");
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryState("loading");
    setHistoryError("");
    try {
      const response = await requestJson<HistoryEntry[]>("/api/ai-analysis");
      const entries = response.data ?? [];
      setHistory(entries);
      setHistoryState(entries.length ? "ready" : "empty");
    } catch (error) {
      setHistoryState("error");
      setHistoryError(error instanceof Error ? error.message : "Unable to load analysis history.");
    }
  }, []);

  useEffect(() => {
    void loadLatest();
    void loadHistory();
  }, [loadLatest, loadHistory]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisError("");
    setHistoryMessage("");
    try {
      const response = await requestJson<SavedAnalysis>("/api/ai-analysis", { method: "POST" });
      if (!response.data) throw new Error("The analysis did not return a result.");
      setResult(response.data);
      setHistoryMessage(response.history_saved === false
        ? response.history_message ?? "Analysis completed but could not be saved to history."
        : "");
      void loadLatest();
      void loadHistory();
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Unable to run analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const canRun = sensorState === "ready" && Boolean(reading);

  return (
    <div className="page-shell ai-page">
      <FoodGuardHeader meta={<div className="topbar-meta"><span className="connection-badge ai-header-badge"><span className="ai-status-dot" />Rule-based analysis</span></div>} />
      <main className="ai-main">
        <section className="ai-page-heading"><div><p className="eyebrow">FOODGUARD INTELLIGENCE</p><h1>AI Prediction</h1><p>Intelligent insights for food monitoring and fermentation.</p></div><span className="method-label"><span className="method-label-dot" />Rules active · AI model not configured</span></section>
        <AIOverview />
        <PredictionModeSelector onTapeSelected={() => setTapeMessage(true)} />
        {tapeMessage && <p className="tape-selection-note" role="status">Tape Fermentation Prediction is coming soon and is not available yet.</p>}
        <SensorDataOverview state={sensorState} reading={reading} error={sensorError} onRefresh={() => void loadLatest()} />
        <div className="ai-content-grid">
          <AIAnalysisCard result={result} busy={analyzing} error={analysisError} historyMessage={historyMessage} onRun={() => void runAnalysis()} canRun={canRun} />
          <PredictionHistory state={historyState} entries={history} error={historyError} />
        </div>
        <TapeAIComingSoon />
      </main>
      <footer className="page-footer"><span>FoodGuard <span aria-hidden="true">·</span> AI Prediction</span><span>Rule-based analysis is informational and is not a food-safety determination.</span></footer>
    </div>
  );
}