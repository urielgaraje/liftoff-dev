import type { RocketSkin } from "@/lib/game/skins";

export const EVENT = {
  PlayerJoined: "player-joined",
  PlayerLeft: "player-left",
  RoomUpdated: "room-updated",
} as const;

export type PlayerSnapshot = {
  id: string;
  nickname: string;
  rocketSkin: RocketSkin;
  joinedAt: string;
};

export type PlayerJoinedPayload = PlayerSnapshot;
export type PlayerLeftPayload = { id: string };
export type RoomUpdatedPayload = { status: "lobby" | "racing" | "ended" };
