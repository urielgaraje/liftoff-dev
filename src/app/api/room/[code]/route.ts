import { and, asc, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { players, rooms, scores } from "@/lib/db/schema";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/game/code";
import { getStage } from "@/lib/game/stages";
import { getAllForStage } from "@/lib/game/progress-store";
import type { LeaderboardEntry } from "@/lib/realtime/events";
import type { RocketSkin } from "@/lib/game/skins";

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

  let lastEnded: { stageIndex: number; leaderboard: LeaderboardEntry[] } | null =
    null;
  if (room.status === "ended") {
    const [maxRow] = await db
      .select({ stageIndex: sql<number>`MAX(${scores.stageIndex})` })
      .from(scores)
      .where(eq(scores.roomId, room.id));
    const lastStageIndex = maxRow?.stageIndex ?? null;
    if (lastStageIndex !== null) {
      const rows = await db
        .select({
          playerId: scores.playerId,
          value: scores.value,
          nickname: players.nickname,
          rocketSkin: players.rocketSkin,
        })
        .from(scores)
        .innerJoin(players, eq(players.id, scores.playerId))
        .where(
          and(
            eq(scores.roomId, room.id),
            eq(scores.stageIndex, lastStageIndex),
          ),
        )
        .orderBy(desc(scores.value), asc(scores.completedAt));
      lastEnded = {
        stageIndex: lastStageIndex,
        leaderboard: rows.map((r) => ({
          playerId: r.playerId,
          nickname: r.nickname,
          rocketSkin: r.rocketSkin as RocketSkin,
          value: r.value,
        })),
      };
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
    lastEnded,
  });
}
