import { NextResponse } from "next/server";

export const runtime = "edge";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "liftoff",
    time: new Date().toISOString(),
  });
}
