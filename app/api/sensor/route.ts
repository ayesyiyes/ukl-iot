import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  let input: Record<string, unknown>;
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      const body: unknown = await request.json();
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ success: false, message: "Request body must contain valid sensor data." }, 400);
      }
      input = body as Record<string, unknown>;
    } else {
      const form = await request.formData();
      input = Object.fromEntries(form.entries());
    }
  } catch {
    return json({ success: false, message: "Request body must contain valid sensor data." }, 400);
  }

  const fields = ["temperature", "humidity", "mq_value", "moisture"] as const;
  const values: Record<(typeof fields)[number], number> = {} as Record<(typeof fields)[number], number>;
  for (const field of fields) {
    const value = input[field];
    if ((typeof value !== "number" && typeof value !== "string") || value === "" || !Number.isFinite(Number(value))) {
      return json({ success: false, message: `Missing or invalid sensor field: ${field}` }, 400);
    }
    values[field] = Number(value);
  }

  if (values.temperature < -50 || values.temperature > 100) {
    return json({ success: false, message: "Temperature is outside the accepted range." }, 400);
  }
  if (values.humidity < 0 || values.humidity > 100) {
    return json({ success: false, message: "Humidity must be between 0 and 100." }, 400);
  }
  if (values.mq_value < 0 || values.moisture < 0) {
    return json({ success: false, message: "MQ value and moisture must not be negative." }, 400);
  }

  try {
    const { error } = await getSupabaseAdmin().from("sensor_data").insert(values).select("id,created_at");
    if (error) {
      console.error("FoodGuard sensor insert failed:", error.message);
      return json({ success: false, message: "Failed to save sensor data." }, 502);
    }
    return json({ success: true, message: "Sensor data saved successfully." });
  } catch (error) {
    console.error("FoodGuard sensor insert failed:", error);
    return json({ success: false, message: "Failed to save sensor data." }, 502);
  }
}

export function GET() {
  return json({ success: false, message: "Method not allowed." }, 405);
}