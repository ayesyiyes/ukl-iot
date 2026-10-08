import type { AnalysisParameter, SensorReading, SpoilageAnalysis } from "@/lib/ai/spoilage-analysis";
import { estimateTapeMaturity } from "@/lib/ai/tape-maturity";

export type PageState = "loading" | "ready" | "empty" | "error";
export type PredictionMode = "spoilage" | "tape";
export type SavedAnalysis = SpoilageAnalysis & { id: number | null };

export type HistoryEntry = {
  id: number;
  analysis_type: string;
  assessment_key: SpoilageAnalysis["assessment_key"];
  overall_assessment: string;
  sensor_snapshot: Pick<SensorReading, "temperature" | "humidity" | "mq_value" | "moisture" | "created_at">;
  detected_anomalies: string[];
  recommendations: string[];
  analyzed_at: string;
};

export function formatReading(value: number, decimals = 1) {
  return Number.isFinite(Number(value))
    ? Number(value).toLocaleString(undefined, { maximumFractionDigits: decimals })
    : "--";
}

export function formatTimestamp(value: string) {
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function AIOverview({ mode }: { mode: PredictionMode }) {
  const isTapeMode = mode === "tape";

  return (
    <section className="ai-overview" aria-labelledby="ai-overview-title">
      <div className="ai-overview-copy">
        <span className="ai-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="m16 3 2.8 9.2L28 15l-9.2 2.8L16 27l-2.8-9.2L4 15l9.2-2.8L16 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="m25 21 .9 3.1L29 25l-3.1.9L25 29l-.9-3.1L21 25l3.1-.9L25 21Z" fill="currentColor"/></svg></span>
        <div>
          <p className="eyebrow">FOODGUARD INTELLIGENCE</p>
          <h2 id="ai-overview-title">{isTapeMode ? "Tape fermentation estimate" : "Rule-based sensor analysis"}</h2>
          <p>{isTapeMode ? "A configurable time range adjusted by the latest temperature reading. This is a heuristic, not a trained AI model or a food-safety determination." : "Configured thresholds highlight readings that may need attention. This is not a machine-learning model and cannot determine food safety on its own."}</p>
        </div>
      </div>
      <div className="ai-model-status"><span className="ai-status-dot" /><span><small>Prediction method</small><strong>Rule-based</strong></span></div>
      <div className="ai-overview-foot"><span>{isTapeMode ? "Temperature adjusts the estimate; other sensor channels are shown as context until calibrated" : "Analyzes temperature, humidity, MQ value, and moisture"}</span><span className="analysis-method">RULE-BASED</span></div>
    </section>
  );
}

export function PredictionModeSelector({ mode, onChange }: { mode: PredictionMode; onChange: (mode: PredictionMode) => void }) {
  return (
    <section className="ai-section" aria-labelledby="prediction-mode-heading">
      <div className="ai-section-heading"><div><p className="eyebrow">ANALYSIS SETUP</p><h2 id="prediction-mode-heading">Prediction Mode</h2></div></div>
      <div className="prediction-modes">
        <button className={`prediction-mode ${mode === "spoilage" ? "is-active" : ""}`} type="button" onClick={() => onChange("spoilage")} aria-pressed={mode === "spoilage"}>
          <span className="mode-radio" /><span className="mode-copy"><strong>Food Spoilage Analysis</strong><small>Threshold-based review of the latest sensor data</small></span><span className="mode-available">Available</span>
        </button>
        <button className={`prediction-mode ${mode === "tape" ? "is-active" : ""}`} type="button" onClick={() => onChange("tape")} aria-pressed={mode === "tape"}>
          <span className="mode-radio" /><span className="mode-copy"><strong>Tape Fermentation Prediction</strong><small>Estimated readiness window from the recipe and live temperature</small></span><span className="mode-available">Available</span>
        </button>
      </div>
    </section>
  );
}

function formatDuration(hours: number) {
  const roundedHours = Math.max(0, Math.round(hours));
  const days = Math.floor(roundedHours / 24);
  const remainingHours = roundedHours % 24;
  if (days === 0) return `${remainingHours}h`;
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function TapeMaturityPrediction({ reading, startedAt, baselineMinHours, baselineMaxHours, onStartedAtChange, onBaselineMinChange, onBaselineMaxChange }: {
  reading: SensorReading | null;
  startedAt: string;
  baselineMinHours: number;
  baselineMaxHours: number;
  onStartedAtChange: (value: string) => void;
  onBaselineMinChange: (value: string) => void;
  onBaselineMaxChange: (value: string) => void;
}) {
  const estimate = reading && startedAt
    ? estimateTapeMaturity(reading, new Date(startedAt), baselineMinHours, baselineMaxHours)
    : null;

  return (
    <section className="ai-panel tape-prediction-panel" aria-labelledby="tape-prediction-heading">
      <div className="ai-section-heading"><div><p className="eyebrow">TAPE FERMENTATION</p><h2 id="tape-prediction-heading">Estimated maturity window</h2></div><span className="analysis-method">HEURISTIC</span></div>
      <p className="panel-description">Set the batch start and the time range from your recipe. The latest temperature adjusts that range; sensor readings cannot confirm that tape is ready or safe.</p>
      <div className="tape-settings">
        <label className="tape-setting-field"><span>Fermentation started</span><input type="datetime-local" value={startedAt} onChange={(event) => onStartedAtChange(event.target.value)} /></label>
        <label className="tape-setting-field"><span>Recipe minimum (hours)</span><input type="number" min="12" max="239" step="1" value={baselineMinHours} onChange={(event) => onBaselineMinChange(event.target.value)} /></label>
        <label className="tape-setting-field"><span>Recipe maximum (hours)</span><input type="number" min="13" max="240" step="1" value={baselineMaxHours} onChange={(event) => onBaselineMaxChange(event.target.value)} /></label>
      </div>
      {!reading && <div className="tape-estimate-message" role="status">Waiting for a sensor reading. Refresh sensor data to calculate an estimate.</div>}
      {reading && !startedAt && <div className="tape-estimate-message" role="status">Enter when this batch started to see its estimated readiness window.</div>}
      {estimate?.status === "invalid" && <div className="tape-estimate-message is-warning" role="alert">{estimate.message}</div>}
      {estimate?.status === "temperature_out_of_range" && <div className="tape-estimate-message is-warning" role="alert">{estimate.message} Current reading: {formatReading(reading!.temperature)} °C. No time estimate is shown outside this range.</div>}
      {estimate && (estimate.status === "in_progress" || estimate.status === "window_passed") && <>
        <div className={`tape-estimate-banner ${estimate.status === "window_passed" ? "is-passed" : ""}`}>
          <span className="assessment-kicker">{estimate.status === "window_passed" ? "ESTIMATED WINDOW HAS PASSED" : "ESTIMATED TIME REMAINING"}</span>
          <strong>{estimate.status === "window_passed" ? "Ready for a direct product check" : `${formatDuration(estimate.remainingMinHours)}–${formatDuration(estimate.remainingMaxHours)}`}</strong>
          <span>Estimated window: {formatDateTime(estimate.readinessFrom)} – {formatDateTime(estimate.readinessUntil)}</span>
        </div>
        <div className="tape-result-grid">
          <div><span>Elapsed</span><strong>{formatDuration(estimate.elapsedHours)}</strong></div>
          <div><span>Latest temperature used</span><strong>{formatReading(reading!.temperature)} °C</strong></div>
          <div><span>Humidity context</span><strong>{formatReading(reading!.humidity)}%</strong></div>
          <div><span>MQ / moisture context</span><strong>{formatReading(reading!.mq_value, 0)} / {formatReading(reading!.moisture, 0)}</strong></div>
        </div>
        <p className="tape-method-note">Estimate uses a Q10-style temperature adjustment around 28°C and your recipe range. Humidity, MQ, and moisture are displayed but not used in the formula because their relationship and calibration for this tape setup are unknown.</p>
      </>}
    </section>
  );
}

export function SensorDataOverview({ state, reading, error, onRefresh }: {
  state: PageState;
  reading: SensorReading | null;
  error: string;
  onRefresh: () => void;
}) {
  const sensors: { key: keyof Pick<SensorReading, "temperature" | "humidity" | "mq_value" | "moisture">; label: string; unit: string; decimals: number }[] = [
    { key: "temperature", label: "Temperature", unit: "°C", decimals: 1 },
    { key: "humidity", label: "Humidity", unit: "%", decimals: 1 },
    { key: "mq_value", label: "MQ Value", unit: "raw", decimals: 0 },
    { key: "moisture", label: "Moisture", unit: "as sent", decimals: 0 },
  ];

  return (
    <section className="ai-section" aria-labelledby="sensor-overview-heading">
      <div className="ai-section-heading"><div><p className="eyebrow">LATEST INPUT</p><h2 id="sensor-overview-heading">Sensor Data Overview</h2></div><button className="text-action" type="button" onClick={onRefresh} disabled={state === "loading"}>{state === "loading" ? "Refreshing..." : "Refresh data"}</button></div>
      {state === "loading" && <div className="ai-state-panel" role="status"><span className="ai-spinner" />Loading latest sensor data...</div>}
      {state === "error" && <div className="ai-state-panel is-error" role="alert"><strong>Sensor data unavailable</strong><span>{error}</span></div>}
      {state === "empty" && <div className="ai-state-panel is-empty">No sensor data available for analysis.</div>}
      {state === "ready" && reading && <>
        <div className="ai-sensor-grid">{sensors.map((sensor) => <article className="ai-sensor-card" key={sensor.key}><span>{sensor.label}</span><strong>{formatReading(reading[sensor.key], sensor.decimals)} <small>{sensor.unit}</small></strong><span className="sensor-input-note">Sensor input</span></article>)}</div>
        <p className="sensor-received">Reading received {formatTimestamp(reading.created_at)}</p>
      </>}
    </section>
  );
}

function parameterStatus(parameter: AnalysisParameter) {
  if (parameter.status === "potential_risk") return { label: "Potential Risk", className: "potential-risk" };
  if (parameter.status === "needs_observation") return { label: "Needs Observation", className: "needs-observation" };
  return { label: "Within Threshold", className: "within-threshold" };
}

export function AIAnalysisCard({ result, busy, error, historyMessage, onRun, canRun }: {
  result: SavedAnalysis | null;
  busy: boolean;
  error: string;
  historyMessage: string;
  onRun: () => void;
  canRun: boolean;
}) {
  return (
    <section className="ai-panel analysis-panel" aria-labelledby="analysis-heading">
      <div className="ai-section-heading"><div><p className="eyebrow">CONFIGURABLE THRESHOLDS</p><h2 id="analysis-heading">AI Analysis</h2></div><span className="analysis-method">RULE-BASED</span></div>
      <p className="panel-description">A transparent review of the latest sensor values against configured warning and danger thresholds. No machine learning is used.</p>
      {!result && <div className="analysis-prompt"><span>Run an analysis to review the latest real sensor reading.</span><button className="primary-action" type="button" onClick={onRun} disabled={!canRun || busy}>{busy ? <><span className="button-spinner" />Analyzing...</> : "Run analysis"}</button></div>}
      {busy && !result && <p className="analysis-progress" role="status">Fetching current sensor values and applying configured rules...</p>}
      {error && <div className="inline-error" role="alert">{error}</div>}
      {result && <div className="analysis-result">
        {historyMessage && <div className="history-notice" role="status">{historyMessage}</div>}
        <div className={`assessment-banner ${result.assessment_key}`}><span className="assessment-kicker">OVERALL ASSESSMENT</span><strong>{result.overall_assessment}</strong><small>Rule-based assessment only · not a food-safety determination</small></div>
        <div className="analysis-subsection"><h3>Sensor Parameters</h3><div className="parameter-list">{result.parameters.map((parameter) => { const status = parameterStatus(parameter); return <div className="parameter-row" key={parameter.key}><span className="parameter-name">{parameter.label}</span><span className="parameter-value">{formatReading(parameter.value, parameter.key === "temperature" || parameter.key === "humidity" ? 1 : 0)} {parameter.unit}</span><span className="parameter-threshold">Warn {parameter.warning_threshold} · Risk {parameter.danger_threshold}</span><span className={`parameter-status ${status.className}`}>{status.label}</span></div>; })}</div></div>
        <div className="analysis-subsection"><h3>Detected Anomalies</h3>{result.detected_anomalies.length ? <ul className="analysis-list anomaly-list">{result.detected_anomalies.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="analysis-empty-copy">No configured threshold anomalies detected. This does not establish that food is safe.</p>}</div>
        <div className="analysis-subsection"><h3>Recommendations</h3><ul className="analysis-list">{result.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="analysis-timestamp">Analysis timestamp <strong>{formatTimestamp(result.analyzed_at)}</strong></div>
        <button className="secondary-action" type="button" onClick={onRun} disabled={busy || !canRun}>{busy ? "Analyzing..." : "Analyze latest reading"}</button>
      </div>}
    </section>
  );
}

export function PredictionHistory({ state, entries, error }: { state: PageState; entries: HistoryEntry[]; error: string }) {
  return (
    <section className="ai-panel prediction-history" aria-labelledby="prediction-history-heading">
      <div className="ai-section-heading"><div><p className="eyebrow">SAVED RULE RUNS</p><h2 id="prediction-history-heading">Prediction History</h2></div><span className="history-count">{entries.length}</span></div>
      {state === "loading" && <div className="ai-state-panel compact-state" role="status"><span className="ai-spinner" />Loading analysis history...</div>}
      {state === "error" && <div className="history-unavailable" role="alert"><strong>History unavailable</strong><span>{error}</span></div>}
      {(state === "ready" || state === "empty") && entries.length === 0 && <div className="history-empty"><span className="history-empty-mark" aria-hidden="true">↗</span><strong>No analysis history yet</strong><p>Run a Food Spoilage Analysis to save the first result.</p></div>}
      {state === "ready" && entries.length > 0 && <div className="history-table-wrap"><table className="history-table"><thead><tr><th>Analyzed</th><th>Type</th><th>Assessment</th><th>Sensor summary</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td>{formatTimestamp(entry.analyzed_at)}</td><td>Food spoilage</td><td><span className={`history-assessment ${entry.assessment_key}`}>{entry.assessment_key === "potential_risk" ? "Potential Risk" : entry.assessment_key === "needs_observation" ? "Needs Observation" : "Within Threshold"}</span></td><td>{entry.sensor_snapshot.temperature}°C · {entry.sensor_snapshot.humidity}% · MQ {entry.sensor_snapshot.mq_value} · {entry.sensor_snapshot.moisture}</td></tr>)}</tbody></table></div>}
    </section>
  );
}
