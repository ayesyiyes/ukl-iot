"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  Filler,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

type Reading = {
  id?: number;
  temperature: number;
  humidity: number;
  mq_value: number;
  moisture: number;
  created_at: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  api_status?: string;
  database_status?: string;
};

type Sensor = {
  key: keyof Pick<Reading, "temperature" | "humidity" | "mq_value" | "moisture">;
  label: string;
  unit: string;
  decimals: number;
  color: string;
};

const sensors: Sensor[] = [
  { key: "temperature", label: "Temperature", unit: "°C", decimals: 1, color: "#ee8c49" },
  { key: "humidity", label: "Humidity", unit: "%", decimals: 1, color: "#338ec2" },
  { key: "mq_value", label: "MQ sensor", unit: "raw", decimals: 0, color: "#8c78c4" },
  { key: "moisture", label: "Moisture", unit: "as sent", decimals: 0, color: "#299b81" },
];

const thresholds = {
  temperature: { warning: 30, danger: 35 },
  humidity: { warning: 75, danger: 85 },
  mq_value: { warning: 400, danger: 700 },
  moisture: { warning: 80, danger: 90 },
};

const ranges = ["1h", "6h", "24h"] as const;
type Range = (typeof ranges)[number];

function formatValue(value: number, decimals = 1) {
  return Number.isFinite(Number(value))
    ? Number(value).toLocaleString(undefined, { maximumFractionDigits: decimals })
    : "--";
}

function severity(key: Sensor["key"], value: number) {
  if (value >= thresholds[key].danger) return "danger";
  if (value >= thresholds[key].warning) return "warning";
  return "normal";
}

function time(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

async function fetchJson<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url, { cache: "no-store" });
  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !body.success) throw Object.assign(new Error(body.message || "Request failed"), { body });
  return body;
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M16 27c-6.1 0-10.5-4.1-10.5-10.2C5.5 10.5 10 5.4 18.8 5c.5 8.2-1.6 12-6.5 12.9 2.3.2 4.5-.5 6.5-2.4 1.1-1 2-2.3 2.8-3.9C24.5 22 21.4 27 16 27Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M10 24c1.1-3.1 3.4-5.7 6.8-7.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>;
}

function SensorIcon({ type }: { type: Sensor["key"] }) {
  const paths: Record<Sensor["key"], React.ReactNode> = {
    temperature: <><path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z"/><path d="M11 12V6m0 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" strokeLinecap="round"/></>,
    humidity: <><path d="M12 3.5S5.5 11 5.5 15.2a6.5 6.5 0 1 0 13 0C18.5 11 12 3.5 12 3.5Z"/><path d="M9 16.5c.3 1.2 1.2 1.9 2.5 2" strokeLinecap="round"/></>,
    mq_value: <path d="M12 3.5c1.2 3.6-2.5 4.1-1.6 7.1.5 1.5 1.9 1.7 2.6.5.5-.8.5-1.7.2-2.6 2.7 2 4.3 4.1 4.3 6.6a5.5 5.5 0 0 1-11 0c0-2.5 1.4-4.4 3.5-6.8-.3 2.2.1 3 1.1 3.3C9.2 8.8 14 7.7 12 3.5Z" strokeLinejoin="round"/>,
    moisture: <><path d="M4 18.5h16M6 18.5V9.8l6-4.3 6 4.3v8.7M9 18.5v-5h6v5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 8.8v2.4" strokeLinecap="round"/></>,
  };
  const iconClass = { temperature: "temperature-icon", humidity: "humidity-icon", mq_value: "gas-icon", moisture: "moisture-icon" }[type];
  return <span className={`sensor-icon ${iconClass}`} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">{paths[type]}</svg></span>;
}

function SystemIcon() {
  return <span className="system-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M8 9h8m-8 4h5m-5 3h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span>;
}

export default function Dashboard() {
  const [reading, setReading] = useState<Reading | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [selectedRange, setSelectedRange] = useState<Range>("6h");
  const [apiState, setApiState] = useState<"checking" | "connected" | "unavailable">("checking");
  const [databaseState, setDatabaseState] = useState<"checking" | "connected" | "unavailable">("checking");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let mounted = true;
    const refreshLatest = async () => {
      try {
        const result = await fetchJson<Reading | null>("/api/latest");
        if (!mounted) return;
        setApiState("connected");
        setDatabaseState("connected");
        setReading(result.data);
      } catch (error) {
        if (!mounted) return;
        const body = (error as Error & { body?: ApiResponse<unknown> }).body;
        setApiState(body?.api_status === "connected" ? "connected" : "unavailable");
        setDatabaseState(body?.database_status === "error" ? "unavailable" : "checking");
      }
    };
    const refreshHistory = async () => {
      try {
        const result = await fetchJson<Reading[]>(`/api/history?range=${selectedRange}`);
        if (mounted) setHistory(result.data);
      } catch {
        if (mounted) setHistory([]);
      }
    };
    const refresh = () => { void refreshLatest(); void refreshHistory(); };
    refresh();
    const poll = window.setInterval(refresh, 10000);
    const clock = window.setInterval(() => setNow(Date.now()), 5000);
    return () => { mounted = false; window.clearInterval(poll); window.clearInterval(clock); };
  }, [selectedRange]);

  const overall = reading
    ? sensors.some((sensor) => severity(sensor.key, Number(reading[sensor.key])) === "danger")
      ? "danger"
      : sensors.some((sensor) => severity(sensor.key, Number(reading[sensor.key])) === "warning") ? "warning" : "safe"
    : "empty";
  const online = reading !== null && now - new Date(reading.created_at).getTime() <= 30000;
  const alerts = reading ? sensors.filter((sensor) => severity(sensor.key, Number(reading[sensor.key])) !== "normal") : [];
  const chartOptions = (sensor: Sensor) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" as const },
    plugins: {
      legend: { display: false },
      tooltip: { displayColors: false, padding: 10, callbacks: { label: (context: { raw: unknown }) => `${formatValue(Number(context.raw), sensor.decimals)} ${sensor.unit}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 5, color: "#8c9992", font: { family: "DM Sans", size: 10 } }, border: { display: false } },
      y: { grid: { color: "#edf1ee" }, ticks: { maxTicksLimit: 4, color: "#8c9992", font: { family: "DM Sans", size: 10 } }, border: { display: false } },
    },
  });

  return (
    <div className="page-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="FoodGuard dashboard"><BrandMark /><span className="brand-copy"><strong>FoodGuard</strong><small>Food Spoilage Detection System</small></span></Link>
        <div className="topbar-meta"><span className={`connection-badge is-${online ? "online" : "offline"}`}><span className="status-dot" />{online ? "Device Online" : "Device Offline"}</span><span className="topbar-divider" aria-hidden="true" /><div className="last-update"><span>Last update</span><strong>{reading ? time(reading.created_at) : "Waiting for data"}</strong></div></div>
      </header>
      <main>
        <section className="overview-heading"><div><p className="eyebrow">LIVE MONITORING</p><h1>Food condition</h1></div><span className="refresh-note"><span className="pulse-dot" />Auto refresh · 10 sec</span></section>
        <section className={`condition-panel status-${overall}`} aria-live="polite">
          <div className="condition-main"><div className="condition-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M16 4.5 27 10v7.2c0 6.4-4.7 9.6-11 11.3C9.7 26.8 5 23.6 5 17.2V10l11-5.5Z" stroke="currentColor" strokeWidth="1.8"/><path d="m11.5 16.2 3 3 6-6.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div><p className="eyebrow">OVERALL CONDITION</p><h2>{overall === "empty" ? "NO DATA" : overall.toUpperCase()}</h2><p>{overall === "empty" ? "Waiting for the first sensor reading." : overall === "safe" ? "Food condition is currently within the safe range." : overall === "warning" ? "One or more sensor readings need attention." : "Critical sensor values detected. Check the food condition."}</p></div></div>
          <div className="condition-side"><span className="condition-side-label">Monitoring</span><strong>Food spoilage</strong><span>{reading ? "4 sensors reporting" : "No readings received"}</span></div>
        </section>
        <section className="sensor-section" aria-labelledby="sensorHeading"><div className="section-heading"><div><p className="eyebrow">SENSOR SNAPSHOT</p><h2 id="sensorHeading">Latest readings</h2></div><span className="muted-label">{reading ? `Received ${new Date(reading.created_at).toLocaleDateString([], { day: "numeric", month: "short" })}` : "No data yet"}</span></div>
          <div className="sensor-grid">{sensors.map((sensor) => {
            const value = reading ? Number(reading[sensor.key]) : null;
            const status = value === null ? "neutral" : severity(sensor.key, value);
            return <article className="sensor-card" data-sensor={sensor.key} key={sensor.key}><div className="sensor-card-top"><SensorIcon type={sensor.key} /><span className={`sensor-status status-${status}`}>{value === null ? "Waiting" : status === "normal" ? "Normal" : status[0].toUpperCase() + status.slice(1)}</span></div><p className="sensor-name">{sensor.key === "mq_value" ? "MQ Sensor" : sensor.label}</p><div className="sensor-reading"><strong>{value === null ? "--" : formatValue(value, sensor.decimals)}</strong><span>{sensor.unit}</span></div><p className="sensor-foot">{{ temperature: "DHT11 · Air temperature", humidity: "DHT11 · Air humidity", mq_value: "MQ sensor · Raw value", moisture: "Soil moisture · ESP unit" }[sensor.key]}</p></article>;
          })}</div>
        </section>
        <section className="history-section" aria-labelledby="historyHeading"><div className="section-heading history-heading"><div><p className="eyebrow">SENSOR HISTORY</p><h2 id="historyHeading">Reading trends</h2></div><div className="range-filter" role="group" aria-label="History time range">{ranges.map((range) => <button type="button" data-range={range} className={selectedRange === range ? "is-selected" : ""} aria-pressed={selectedRange === range} onClick={() => setSelectedRange(range)} key={range}>{range === "1h" ? "1 hour" : range === "6h" ? "6 hours" : "24 hours"}</button>)}</div></div>
          <div className="chart-grid">{sensors.map((sensor) => <article className="chart-panel" key={sensor.key}><div className="chart-title"><span className={`${sensor.key === "mq_value" ? "mq" : sensor.key === "moisture" ? "moisture" : sensor.key}-key chart-key`} /><h3>{sensor.key === "mq_value" ? "MQ Value" : sensor.label}</h3><span>{sensor.unit}</span></div><div className={`chart-wrap ${history.length ? "has-data" : ""}`}>{history.length > 0 && <Line data={{ labels: history.map((row) => new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), datasets: [{ data: history.map((row) => Number(row[sensor.key])), borderColor: sensor.color, backgroundColor: `${sensor.color}18`, fill: true, tension: 0.34, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 }] }} options={chartOptions(sensor)} aria-label={`${sensor.label} history chart`} />}<p className="chart-empty">No readings in this period</p></div></article>)}</div>
        </section>
        <section className="bottom-grid">
          <article className="info-panel alerts-panel"><div className="section-heading compact-heading"><div><p className="eyebrow">RECENT ALERTS</p><h2>Condition events</h2></div><span className="count-badge">{alerts.length}</span></div><div className="alerts-list">{alerts.length === 0 ? <p className="empty-message">No active alerts.</p> : alerts.map((sensor) => { const level = severity(sensor.key, Number(reading?.[sensor.key])); return <div className="alert-row" key={sensor.key}><span className={`alert-level alert-${level}`}>{level.toUpperCase()}</span><div><strong>{sensor.label} above normal range</strong><p>Current value: {formatValue(Number(reading?.[sensor.key]), sensor.decimals)} {sensor.unit}</p></div></div>; })}</div></article>
          <article className="info-panel system-panel"><div className="section-heading compact-heading"><div><p className="eyebrow">SYSTEM INFORMATION</p><h2>Connection status</h2></div><SystemIcon /></div><dl className="system-list"><div><dt>Device</dt><dd><span className={`mini-dot ${online ? "is-good" : "is-bad"}`} />{online ? "Online" : "Offline"}</dd></div><div><dt>Last data received</dt><dd>{reading ? time(reading.created_at) : "Waiting"}</dd></div><div><dt>Next.js API</dt><dd><span className={`mini-dot ${apiState === "connected" ? "is-good" : apiState === "unavailable" ? "is-bad" : ""}`} />{apiState === "connected" ? "Connected" : apiState === "unavailable" ? "Unavailable" : "Checking"}</dd></div><div><dt>Supabase database</dt><dd><span className={`mini-dot ${databaseState === "connected" ? "is-good" : databaseState === "unavailable" ? "is-bad" : ""}`} />{databaseState === "connected" ? "Connected" : databaseState === "unavailable" ? "Unavailable" : "Checking"}</dd></div></dl></article>
        </section>
      </main>
      <footer className="page-footer"><span>FoodGuard <span aria-hidden="true">·</span> Food Spoilage Detection System</span><span>Sensor readings are displayed as received from the device.</span></footer>
    </div>
  );
}