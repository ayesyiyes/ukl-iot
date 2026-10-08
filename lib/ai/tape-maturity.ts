import type { SensorReading } from "@/lib/ai/spoilage-analysis";

const REFERENCE_TEMPERATURE_C = 28;

export type TapeMaturityEstimate = {
  status: "in_progress" | "window_passed";
  elapsedHours: number;
  readinessFrom: string;
  readinessUntil: string;
  remainingMinHours: number;
  remainingMaxHours: number;
  estimatedMinHours: number;
  estimatedMaxHours: number;
};

export type TapeMaturityResult =
  | TapeMaturityEstimate
  | { status: "invalid"; message: string }
  | { status: "temperature_out_of_range"; message: string };

export function estimateTapeMaturity(
  reading: SensorReading,
  startedAt: Date,
  baselineMinHours: number,
  baselineMaxHours: number,
  now = new Date(),
): TapeMaturityResult {
  const temperature = Number(reading.temperature);
  if (!Number.isFinite(temperature)) {
    return { status: "invalid", message: "A valid temperature reading is required." };
  }
  if (temperature < 18 || temperature > 35) {
    return { status: "temperature_out_of_range", message: "Temperature is outside the estimate range of 18–35°C." };
  }
  if (!Number.isFinite(startedAt.getTime()) || !Number.isFinite(now.getTime())) {
    return { status: "invalid", message: "Enter a valid fermentation start time." };
  }
  if (startedAt.getTime() > now.getTime()) {
    return { status: "invalid", message: "Start time cannot be in the future." };
  }
  if (
    !Number.isFinite(baselineMinHours) ||
    !Number.isFinite(baselineMaxHours) ||
    baselineMinHours < 12 ||
    baselineMaxHours > 240 ||
    baselineMinHours >= baselineMaxHours
  ) {
    return { status: "invalid", message: "Set a valid recipe range between 12 and 240 hours." };
  }

  const temperatureRate = 2 ** ((temperature - REFERENCE_TEMPERATURE_C) / 10);
  const estimatedMinHours = baselineMinHours / temperatureRate;
  const estimatedMaxHours = baselineMaxHours / temperatureRate;
  const elapsedHours = (now.getTime() - startedAt.getTime()) / 3_600_000;
  const readinessFrom = new Date(startedAt.getTime() + estimatedMinHours * 3_600_000);
  const readinessUntil = new Date(startedAt.getTime() + estimatedMaxHours * 3_600_000);

  return {
    status: elapsedHours >= estimatedMaxHours ? "window_passed" : "in_progress",
    elapsedHours,
    readinessFrom: readinessFrom.toISOString(),
    readinessUntil: readinessUntil.toISOString(),
    remainingMinHours: Math.max(0, estimatedMinHours - elapsedHours),
    remainingMaxHours: Math.max(0, estimatedMaxHours - elapsedHours),
    estimatedMinHours,
    estimatedMaxHours,
  };
}