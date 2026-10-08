import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("sensor_data")
      .select("id,temperature,humidity,mq_value,moisture,created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return NextResponse.json({
      success: true,
      api_status: "connected",
      database_status: "connected",
      data: data?.[0] ?? null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("FoodGuard latest read failed:", error);
    return NextResponse.json({
      success: false,
      api_status: "connected",
      database_status: "error",
      message: "Unable to read sensor data.",
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export function POST() {
  return NextResponse.json({ success: false, message: "Method not allowed." }, { status: 405, headers: { Allow: "GET", "Cache-Control": "no-store" } });
}