export type SensorReading = {
  id: number;
  temperature: number;
  humidity: number;
  mq_value: number;
  moisture: number;
  created_at: string;
};

export const SENSOR_THRESHOLDS = {
  temperature: { warning: 30, danger: 35, unit: "°C", label: "Temperature" },
  humidity: { warning: 75, danger: 85, unit: "%", label: "Humidity" },
  mq_value: { warning: 400, danger: 700, unit: "raw", label: "MQ sensor" },
  moisture: { warning: 80, danger: 90, unit: "as sent", label: "Moisture" },
} as const;

export type SensorKey = keyof typeof SENSOR_THRESHOLDS;
export type ParameterStatus = "within_baseline" | "potential_risk" | "needs_observation";

export type AnalysisParameter = {
  key: SensorKey;
  label: string;
  value: number;
  unit: string;
  warning_threshold: number;
  danger_threshold: number;
  status: ParameterStatus;
};

export type SpoilageAnalysis = {
  analysis_type: "food_spoilage";
  assessment_key: ParameterStatus;
  overall_assessment: string;
  parameters: AnalysisParameter[];
  detected_anomalies: string[];
  recommendations: string[];
  analyzed_at: string;
  sensor_created_at: string;
};

export function runSpoilageAnalysis(reading: SensorReading, analyzedAt = new Date().toISOString()): SpoilageAnalysis {
  const parameters = (Object.keys(SENSOR_THRESHOLDS) as SensorKey[]).map((key) => {
    const threshold = SENSOR_THRESHOLDS[key];
    const value = Number(reading[key]);
    const status: ParameterStatus = value >= threshold.danger
      ? "potential_risk"
      : value >= threshold.warning ? "needs_observation" : "within_baseline";

    return {
      key,
      label: threshold.label,
      value,
      unit: threshold.unit,
      warning_threshold: threshold.warning,
      danger_threshold: threshold.danger,
      status,
    };
  });

  const concerning = parameters.filter((parameter) => parameter.status !== "within_baseline");
  const hasPotentialRisk = parameters.some((parameter) => parameter.status === "potential_risk");
  const assessmentKey: ParameterStatus = hasPotentialRisk
    ? "potential_risk"
    : concerning.length ? "needs_observation" : "within_baseline";
  const overallAssessment = assessmentKey === "potential_risk"
    ? "Potential Risk — sensor values crossed a configured threshold."
    : assessmentKey === "needs_observation"
      ? "Sensor readings require further observation."
      : "No configured threshold anomalies detected; continue monitoring.";

  const detectedAnomalies = concerning.map((parameter) => {
    const detail = `${parameter.label} is at or above its ${parameter.status === "potential_risk" ? "danger" : "warning"} threshold (${parameter.value} ${parameter.unit}).`;
    return detail;
  });

  const recommendations = ["Continue monitoring sensor readings."];
  if (concerning.length) {
    recommendations.push("Verify unusual readings and the sensor setup before drawing conclusions.");
    recommendations.push("Assess the food directly; environmental sensor values alone cannot confirm food safety or spoilage.");
  } else {
    recommendations.push("Use product-specific checks alongside these environmental readings.");
  }

  return {
    analysis_type: "food_spoilage",
    assessment_key: assessmentKey,
    overall_assessment: overallAssessment,
    parameters,
    detected_anomalies: detectedAnomalies,
    recommendations,
    analyzed_at: analyzedAt,
    sensor_created_at: reading.created_at,
  };
}