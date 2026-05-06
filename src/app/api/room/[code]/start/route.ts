import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getHostRoomId } from "@/lib/auth/host";
import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/game/code";
import { getStage } from "@/lib/game/stages";
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

  const hostRoomId = await getHostRoomId();
  if (!hostRoomId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
  if (!room) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (room.id !== hostRoomId) {
    return NextResponse.json({ error: "wrong host" }, { status: 403 });
  }
  if (room.status !== "lobby") {
    return NextResponse.json({ error: "already started" }, { status: 409 });
  }

  const stage = getStage(0);
  if (!stage) {
    return NextResponse.json({ error: "no stages defined" }, { status: 500 });
  }

  const init = stage.buildInit();
  const startedAt = new Date();

  await db
    .update(rooms)
    .set({
      status: "racing",
      currentStageIndex: 0,
      stageStartedAt: startedAt,
      stageInit: init as object,
    })
    .where(eq(rooms.id, room.id));

  await broadcast(code, EVENT.StageStarted, {
    stageIndex: 0,
    stageId: stage.id,
    durationMs: stage.durationMs,
    init,
    startedAt: startedAt.toISOString(),
  });

  return NextResponse.json({
    stageIndex: 0,
    stageId: stage.id,
    durationMs: stage.durationMs,
  });
}
