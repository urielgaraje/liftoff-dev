import { and, asc, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { players, rooms, scores } from "@/lib/db/schema";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/game/code";
import { getStage } from "@/lib/game/stages";
import { broadcast } from "@/lib/realtime/server";
import { EVENT, type LeaderboardEntry } from "@/lib/realtime/events";
import type { RocketSkin } from "@/lib/game/skins";

export const runtime = "nodejs";

const Body = z.object({
  stageIndex: z.number().int().min(0),
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

  const elapsed = Date.now() - room.stageStartedAt.getTime();
  if (elapsed < stage.durationMs) {
    return NextResponse.json(
      { error: "too early", remainingMs: stage.durationMs - elapsed },
      { status: 409 },
    );
  }

  const next = getStage(room.currentStageIndex + 1);
  const advanced = await advanceRoom({
    roomId: room.id,
    fromStageIndex: room.currentStageIndex,
    next,
  });
  if (!advanced) {
    return NextResponse.json({ error: "race conflict" }, { status: 409 });
  }

  const leaderboardRows = await db
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
        eq(scores.stageIndex, room.currentStageIndex),
      ),
    )
    .orderBy(desc(scores.value), asc(scores.completedAt));

  const leaderboard: LeaderboardEntry[] = leaderboardRows.map((r) => ({
    playerId: r.playerId,
    nickname: r.nickname,
    rocketSkin: r.rocketSkin as RocketSkin,
    value: r.value,
  }));

  await broadcast(code, EVENT.StageEnded, {
    stageIndex: room.currentStageIndex,
    leaderboard,
    nextStageIndex: next ? room.currentStageIndex + 1 : null,
  });

  if (next) {
    await broadcast(code, EVENT.StageStarted, {
      stageIndex: room.currentStageIndex + 1,
      stageId: next.id,
      durationMs: next.durationMs,
      init: advanced.nextInit,
      startedAt: advanced.nextStartedAt!.toISOString(),
    });
  } else {
    await broadcast(code, EVENT.RoomUpdated, { status: "ended" });
  }

  return NextResponse.json({
    ok: true,
    nextStageIndex: next ? room.currentStageIndex + 1 : null,
  });
}

async function advanceRoom(args: {
  roomId: string;
  fromStageIndex: number;
  next: ReturnType<typeof getStage>;
}): Promise<{ nextInit: unknown; nextStartedAt: Date | null } | null> {
  const now = new Date();
  await db
    .update(scores)
    .set({ completedAt: now })
    .where(
      and(eq(scores.roomId, args.roomId), eq(scores.stageIndex, args.fromStageIndex)),
    );

  if (args.next) {
    const nextInit = args.next.buildInit();
    const result = await db
      .update(rooms)
      .set({
        currentStageIndex: args.fromStageIndex + 1,
        stageStartedAt: now,
        stageInit: nextInit as object,
      })
      .where(
        and(eq(rooms.id, args.roomId), eq(rooms.currentStageIndex, args.fromStageIndex)),
      )
      .returning({ id: rooms.id });
    if (result.length === 0) return null;
    return { nextInit, nextStartedAt: now };
  } else {
    const result = await db
      .update(rooms)
      .set({ status: "ended", stageStartedAt: null, stageInit: null })
      .where(
        and(eq(rooms.id, args.roomId), eq(rooms.currentStageIndex, args.fromStageIndex)),
      )
      .returning({ id: rooms.id });
    if (result.length === 0) return null;
    return { nextInit: null, nextStartedAt: null };
  }
}
