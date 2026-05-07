"use client";

import { HostPreGame } from "./host-pregame";
import { HostBroadcast } from "./host-broadcast";
import { useRoomChannel } from "@/lib/realtime/use-room-channel";

type Props = { code: string; playUrl: string };

export function HostRouter({ code, playUrl }: Props) {
  const room = useRoomChannel(code, { withProgress: true });

  if (room.status === "lobby") {
    return <HostPreGame code={code} playUrl={playUrl} room={room} />;
  }

  return <HostBroadcast code={code} room={room} />;
}
