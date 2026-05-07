"use client";

import { HostPreGame } from "./host-pregame";
import { HostBroadcast } from "./host-broadcast";
import { BackgroundMusic } from "@/components/shared/background-music";
import { useRoomChannel } from "@/lib/realtime/use-room-channel";

type Props = { code: string; playUrl: string };

export function HostRouter({ code, playUrl }: Props) {
  const room = useRoomChannel(code, { withProgress: true });

  const phase =
    room.status === "racing"
      ? "stage"
      : room.status === "ended"
        ? "ended"
        : "lobby";

  return (
    <>
      <BackgroundMusic
        phase={phase}
        stageIndex={room.stage?.stageIndex ?? null}
      />
      {room.status === "lobby" ? (
        <HostPreGame code={code} playUrl={playUrl} room={room} />
      ) : (
        <HostBroadcast code={code} room={room} />
      )}
    </>
  );
}
