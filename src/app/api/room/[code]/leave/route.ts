import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { clearPlayerCookie, getPlayerId } from "@/lib/auth/player";
import { db } from "@/lib/db";
import { players, rooms } from "@/lib/db/schema";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/game/code";
import { broadcast } from "@/lib/realtime/server";
import { EVENT } from "@/lib/realtime/events";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code: raw } = await ctx.params;
  const code = normalizeRoomCode(raw);
  if (!isValidRoomCode(code)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }
  const playerId = await getPlayerId(code);
  if (!playerId) {
    return NextResponse.json({ ok: true });
  }

  const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
  if (!room) {
    await clearPlayerCookie(code);
    return NextResponse.json({ ok: true });
  }

  await db
    .delete(players)
    .where(and(eq(players.id, playerId), eq(players.roomId, room.id)));

  await clearPlayerCookie(code);
  await broadcast(code, EVENT.PlayerLeft, { id: playerId });

  return NextResponse.json({ ok: true });
}
