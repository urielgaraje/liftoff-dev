import type { RocketSkin } from "@/lib/game/skins";

export const EVENT = {
  PlayerJoined: "player-joined",
  PlayerLeft: "player-left",
  RoomUpdated: "room-updated",
  StageStarted: "stage-started",
  ProgressUpdated: "progress-updated",
  StageEnded: "stage-ended",
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

export type StageStartedPayload = {
  stageIndex: number;
  stageId: string;
  durationMs: number;
  init: unknown;
  startedAt: string;
};

export type ProgressUpdatedPayload = {
  playerId: string;
  stageIndex: number;
  value: number;
};

export type LeaderboardEntry = {
  playerId: string;
  nickname: string;
  rocketSkin: RocketSkin;
  value: number;
};

export type StageEndedPayload = {
  stageIndex: number;
  leaderboard: LeaderboardEntry[];
  nextStageIndex: number | null;
};
