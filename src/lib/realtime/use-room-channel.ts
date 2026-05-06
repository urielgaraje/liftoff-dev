"use client";
import { useEffect, useState } from "react";
import {
  EVENT,
  type LeaderboardEntry,
  type PlayerJoinedPayload,
  type PlayerLeftPayload,
  type PlayerSnapshot,
  type ProgressUpdatedPayload,
  type RoomUpdatedPayload,
  type StageEndedPayload,
  type StageStartedPayload,
} from "@/lib/realtime/events";
import { getPusherClient } from "@/lib/realtime/client";

export type StageInfo = {
  stageIndex: number;
  stageId: string;
  durationMs: number;
  init: unknown;
  startedAt: string;
};

export type StageEndedInfo = {
  stageIndex: number;
  leaderboard: LeaderboardEntry[];
  endedAt: number;
};

type RoomState = {
  status: "lobby" | "racing" | "ended";
  players: PlayerSnapshot[];
  stage: StageInfo | null;
  progress: Record<string, number>;
  lastEnded: StageEndedInfo | null;
  loading: boolean;
  error: string | null;
};

const INITIAL: RoomState = {
  status: "lobby",
  players: [],
  stage: null,
  progress: {},
  lastEnded: null,
  loading: true,
  error: null,
};

type Snapshot = {
  status: RoomState["status"];
  players: PlayerSnapshot[];
  stage: StageInfo | null;
  progress: Record<string, number>;
};

export function useRoomChannel(code: string | null): RoomState {
  const [state, setState] = useState<RoomState>(INITIAL);

  useEffect(() => {
    if (!code) {
      setState({ ...INITIAL, loading: false });
      return;
    }
    let cancelled = false;

    const fetchSnapshot = async () => {
      try {
        const res = await fetch(`/api/room/${code}`, { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as Snapshot;
        if (cancelled) return;
        setState((prev) => {
          const byId = new Map(data.players.map((p) => [p.id, p] as const));
          for (const p of prev.players) byId.set(p.id, p);
          const mergedProgress: Record<string, number> = { ...(data.progress ?? {}) };
          for (const [k, v] of Object.entries(prev.progress)) {
            if ((mergedProgress[k] ?? 0) < v) mergedProgress[k] = v;
          }
          return {
            ...prev,
            status: data.status,
            players: Array.from(byId.values()),
            stage: prev.stage ?? data.stage,
            progress: mergedProgress,
            loading: false,
            error: null,
          };
        });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "fetch failed",
        }));
      }
    };

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`room-${code}`);

    fetchSnapshot();

    channel.bind(EVENT.PlayerJoined, (payload: PlayerJoinedPayload) => {
      setState((prev) => {
        if (prev.players.some((p) => p.id === payload.id)) return prev;
        return { ...prev, players: [...prev.players, payload] };
      });
    });

    channel.bind(EVENT.PlayerLeft, (payload: PlayerLeftPayload) => {
      setState((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== payload.id),
      }));
    });

    channel.bind(EVENT.RoomUpdated, (payload: RoomUpdatedPayload) => {
      setState((prev) => ({ ...prev, status: payload.status }));
    });

    channel.bind(EVENT.StageStarted, (payload: StageStartedPayload) => {
      setState((prev) => ({
        ...prev,
        status: "racing",
        stage: {
          stageIndex: payload.stageIndex,
          stageId: payload.stageId,
          durationMs: payload.durationMs,
          init: payload.init,
          startedAt: payload.startedAt,
        },
        progress: {},
        lastEnded: null,
      }));
    });

    channel.bind(EVENT.ProgressUpdated, (payload: ProgressUpdatedPayload) => {
      setState((prev) => {
        if (!prev.stage || prev.stage.stageIndex !== payload.stageIndex) return prev;
        if ((prev.progress[payload.playerId] ?? 0) >= payload.value) return prev;
        return {
          ...prev,
          progress: { ...prev.progress, [payload.playerId]: payload.value },
        };
      });
    });

    channel.bind(EVENT.StageEnded, (payload: StageEndedPayload) => {
      setState((prev) => ({
        ...prev,
        lastEnded: {
          stageIndex: payload.stageIndex,
          leaderboard: payload.leaderboard,
          endedAt: Date.now(),
        },
        status: payload.nextStageIndex === null ? "ended" : prev.status,
        stage: payload.nextStageIndex === null ? null : prev.stage,
      }));
    });

    return () => {
      cancelled = true;
      channel.unbind_all();
      pusher.unsubscribe(`room-${code}`);
    };
  }, [code]);

  return state;
}
