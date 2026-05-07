import { NextResponse } from "next/server";
import { clearHostCookie } from "@/lib/auth/host";

export const runtime = "nodejs";

export async function POST() {
  await clearHostCookie();
  return NextResponse.json({ ok: true });
}
