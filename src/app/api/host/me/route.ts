import { NextResponse } from "next/server";
import { getHostRoomId } from "@/lib/auth/host";

export const runtime = "nodejs";

export async function GET() {
  const hostRoomId = await getHostRoomId();
  return NextResponse.json({ authenticated: hostRoomId !== null });
}
