import { redirect } from "next/navigation";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/game/code";
import { getPlayerId } from "@/lib/auth/player";
import { PlayClient } from "./play-client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ code?: string }>;

export default async function PlayPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = params.code;
  if (!raw) redirect("/");
  const code = normalizeRoomCode(raw);
  if (!isValidRoomCode(code)) redirect("/");

  const playerId = await getPlayerId(code);

  return (
    <PlayClient
      code={code}
      alreadyJoined={Boolean(playerId)}
      playerId={playerId}
    />
  );
}
