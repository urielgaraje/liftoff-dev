import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlayerId } from "@/lib/auth/player";
import { db } from "@/lib/db";
import { players, rooms } from "@/lib/db/schema";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/game/code";
import { getStage } from "@/lib/game/stages";
import { getValue, setValue } from "@/lib/game/progress-store";
import { broadcastProgress } from "@/lib/realtime/server";
import { EVENT } from "@/lib/realtime/events";

export const runtime = "nodejs";

const Body = z.object({
  stageIndex: z.number().int().min(0),
  value: z.number().int().min(0),
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

  const playerId = await getPlayerId(code);
  if (!playerId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
  if (room.status !== "racing") {
    return NextResponse.json({ error: "not racing" }, { status: 409 });
  }
  if (parsed.data.stageIndex !== room.currentStageIndex) {
    return NextResponse.json({ error: "wrong stage" }, { status: 409 });
  }
  if (!room.stageStartedAt) {
    return NextResponse.json({ error: "stage not started" }, { status: 409 });
  }

  const stage = getStage(room.currentStageIndex);
  if (!stage) {
    return NextResponse.json({ error: "no stage" }, { status: 500 });
  }

  const elapsedMs = Date.now() - room.stageStartedAt.getTime();
  if (elapsedMs > stage.durationMs + 1000) {
    return NextResponse.json({ error: "stage expired" }, { status: 409 });
  }

  const [player] = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.id, playerId), eq(players.roomId, room.id)))
    .limit(1);
  if (!player) {
    return NextResponse.json({ error: "player not in room" }, { status: 403 });
  }

  const prev = getValue(code, room.currentStageIndex, playerId);
  const next = parsed.data.value;

  if (
    !stage.validateProgress({
      prev,
      next,
      elapsedMs: Math.max(elapsedMs, 1),
    })
  ) {
    return NextResponse.json({ error: "invalid progress" }, { status: 422 });
  }

  setValue(code, room.currentStageIndex, playerId, next);

  try {
    await broadcastProgress(code, EVENT.ProgressUpdated, {
      playerId,
      stageIndex: room.currentStageIndex,
      value: next,
    });
  } catch (err) {
    console.error("[progress] broadcast failed (state still saved):", err);
  }

  return NextResponse.json({ ok: true, value: next });
}
