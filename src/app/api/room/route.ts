import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { setHostCookie, checkHostPassphrase } from "@/lib/auth/host";
import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { generateRoomCode } from "@/lib/game/code";

export const runtime = "nodejs";

const Body = z.object({
  passphrase: z.string().min(1),
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
  if (!checkHostPassphrase(parsed.data.passphrase)) {
    return NextResponse.json({ error: "wrong passphrase" }, { status: 401 });
  }

  await db
    .update(rooms)
    .set({ status: "ended" })
    .where(inArray(rooms.status, ["lobby", "racing"]));

  let code = "";
  let inserted = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateRoomCode();
    try {
      const rows = await db
        .insert(rooms)
        .values({ code, status: "lobby" })
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
