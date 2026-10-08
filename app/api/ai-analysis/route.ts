import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { runSpoilageAnalysis, type SensorReading } from "@/lib/ai/spoilage-analysis";

export const runtime = "nodejs";

function response(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("prediction_history")
      .select("id,analysis_type,assessment_key,overall_assessment,sensor_snapshot,detected_anomalies,recommendations,analyzed_at")
      .order("analyzed_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return response({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("FoodGuard analysis history read failed:", error);
    return response({
      success: false,
      code: "ANALYSIS_HISTORY_UNAVAILABLE",
      message: "Analysis history is unavailable. Apply the AI Prediction database migration and check the Supabase connection.",
    }, 502);
  }
}

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: reading, error: readingError } = await supabase
      .from("sensor_data")
      .select("id,temperature,humidity,mq_value,moisture,created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (readingError) throw readingError;
    if (!reading) {
      return response({ success: false, code: "NO_SENSOR_DATA", message: "No sensor data available for analysis." }, 409);
    }

    const analysis = runSpoilageAnalysis(reading as SensorReading);
    const sensorSnapshot = {
      temperature: reading.temperature,
      humidity: reading.humidity,
      mq_value: reading.mq_value,
      moisture: reading.moisture,
      created_at: reading.created_at,
    };
    const { data: saved, error: saveError } = await supabase
      .from("prediction_history")
      .insert({
        analysis_type: analysis.analysis_type,
        assessment_key: analysis.assessment_key,
        overall_assessment: analysis.overall_assessment,
        sensor_snapshot: sensorSnapshot,
        detected_anomalies: analysis.detected_anomalies,
        recommendations: analysis.recommendations,
        analyzed_at: analysis.analyzed_at,
      })
      .select("id,analyzed_at")
      .single();

    if (saveError) {
      console.error("FoodGuard analysis history save failed:", saveError.message);
      return response({
        success: true,
        history_saved: false,
        history_message: "Analysis completed but not saved. Apply database.ai-prediction.sql to enable history.",
        data: { ...analysis, id: null },
      });
    }

    return response({
      success: true,
      history_saved: true,
      data: { ...analysis, id: saved.id, analyzed_at: saved.analyzed_at },
    }, 201);
  } catch (error) {
    console.error("FoodGuard rule-based analysis failed:", error);
    return response({
      success: false,
      code: "ANALYSIS_UNAVAILABLE",
      message: "Unable to run or save the analysis. Check the Supabase connection and AI Prediction migration.",
    }, 502);
  }
}