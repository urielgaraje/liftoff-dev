import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { setPlayerCookie } from "@/lib/auth/player";
import { db } from "@/lib/db";
import { players, rooms } from "@/lib/db/schema";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/game/code";
import { ROCKET_SKINS } from "@/lib/game/skins";
import { broadcast } from "@/lib/realtime/server";
import { EVENT } from "@/lib/realtime/events";

export const runtime = "nodejs";

const Body = z.object({
  nickname: z.string().trim().min(1).max(24),
  rocketSkin: z.enum(ROCKET_SKINS),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code: raw } = await ctx.params;
  const code = normalizeRoomCode(raw);
  if (!isValidRoomCode(code)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }

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

  const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
  if (!room) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (room.status !== "lobby") {
    return NextResponse.json({ error: "room closed" }, { status: 409 });
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(players)
    .where(eq(players.roomId, room.id));
  if (count >= room.maxPlayers) {
    return NextResponse.json({ error: "room full" }, { status: 409 });
  }

  const [player] = await db
    .insert(players)
    .values({
      roomId: room.id,
      nickname: parsed.data.nickname,
      rocketSkin: parsed.data.rocketSkin,
    })
    .returning();

  await setPlayerCookie(code, player.id);

  await broadcast(code, EVENT.PlayerJoined, {
    id: player.id,
    nickname: player.nickname,
    rocketSkin: player.rocketSkin,
    joinedAt: player.joinedAt.toISOString(),
  });

  return NextResponse.json({ playerId: player.id });
}
