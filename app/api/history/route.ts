import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") ?? "6h";
  const hours = { "1h": 1, "6h": 6, "24h": 24 }[range as "1h" | "6h" | "24h"];
  if (!hours) {
    return NextResponse.json({ success: false, message: "Range must be 1h, 6h, or 24h." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    const { data, error } = await getSupabaseAdmin()
      .from("sensor_data")
      .select("id,temperature,humidity,mq_value,moisture,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(1000);

    if (error) throw error;
    return NextResponse.json({
      success: true,
      api_status: "connected",
      database_status: "connected",
      data: data ?? [],
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("FoodGuard history read failed:", error);
    return NextResponse.json({
      success: false,
      api_status: "connected",
      database_status: "error",
      message: "Unable to read sensor history.",
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export function POST() {
  return NextResponse.json({ success: false, message: "Method not allowed." }, { status: 405, headers: { Allow: "GET", "Cache-Control": "no-store" } });
}