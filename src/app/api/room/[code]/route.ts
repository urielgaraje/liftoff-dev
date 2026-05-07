import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { players, rooms } from "@/lib/db/schema";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/game/code";
import { getStage } from "@/lib/game/stages";
import { getAllForStage } from "@/lib/game/progress-store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code: raw } = await ctx.params;
  const code = normalizeRoomCode(raw);
  if (!isValidRoomCode(code)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }

  const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
  if (!room) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const list = await db
    .select({
      id: players.id,
      nickname: players.nickname,
      rocketSkin: players.rocketSkin,
      joinedAt: players.joinedAt,
    })
    .from(players)
    .where(eq(players.roomId, room.id))
    .orderBy(asc(players.joinedAt));

  let stage = null;
  let progress: Record<string, number> = {};
  if (
    room.status === "racing" &&
    room.currentStageIndex >= 0 &&
    room.stageStartedAt
  ) {
    const def = getStage(room.currentStageIndex);
    if (def) {
      stage = {
        stageIndex: room.currentStageIndex,
        stageId: def.id,
        durationMs: room.stageDurationMs,
        init: room.stageInit,
        startedAt: room.stageStartedAt.toISOString(),
      };
      progress = Object.fromEntries(
        getAllForStage(code, room.currentStageIndex).entries(),
      );
    }
  }

  return NextResponse.json({
    code: room.code,
    status: room.status,
    maxPlayers: room.maxPlayers,
    stageDurationMs: room.stageDurationMs,
    players: list.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      rocketSkin: p.rocketSkin,
      joinedAt: p.joinedAt.toISOString(),
    })),
    stage,
    progress,
  });
}
