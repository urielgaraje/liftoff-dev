import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getHostRoomId } from "@/lib/auth/host";
import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { HostRouter } from "./host-router";

export const dynamic = "force-dynamic";

export default async function HostPage() {
  const roomId = await getHostRoomId();
  if (!roomId) redirect("/");

  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room || room.status === "ended") redirect("/");

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const playUrl = `${proto}://${host}/play?code=${room.code}`;

  return <HostRouter code={room.code} playUrl={playUrl} />;
}
