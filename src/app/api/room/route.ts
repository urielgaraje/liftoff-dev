import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkHostPassphrase,
  getHostRoomId,
  setHostCookie,
} from "@/lib/auth/host";
import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { generateRoomCode } from "@/lib/game/code";

export const runtime = "nodejs";

const Body = z.object({
  passphrase: z.string().min(1).optional(),
  stageDurationMs: z.number().int().min(5000).max(600000).optional(),
  maxPlayers: z.number().int().min(1).max(100).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const hostRoomId = await getHostRoomId();
  if (!hostRoomId) {
    if (
      !parsed.data.passphrase ||
      !checkHostPassphrase(parsed.data.passphrase)
    ) {
      return NextResponse.json({ error: "wrong passphrase" }, { status: 401 });
    }
  }

  await db
    .update(rooms)
    .set({ status: "ended" })
    .where(inArray(rooms.status, ["lobby", "racing"]));

  const stageDurationMs = parsed.data.stageDurationMs ?? 30000;
  const maxPlayers = parsed.data.maxPlayers ?? 50;

  let inserted = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    try {
      const rows = await db
        .insert(rooms)
        .values({ code, status: "lobby", stageDurationMs, maxPlayers })
        .returning();
      inserted = rows[0];
      break;
    } catch {
      // unique violation on code -> retry
    }
  }
  if (!inserted) {
    return NextResponse.json({ error: "could not generate code" }, { status: 500 });
  }

  await setHostCookie(inserted.id);
  return NextResponse.json({ code: inserted.code });
}
