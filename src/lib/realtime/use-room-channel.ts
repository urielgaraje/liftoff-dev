"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  maxPlayers: number;
  players: PlayerSnapshot[];
  stage: StageInfo | null;
  progress: Record<string, number>;
  lastEnded: StageEndedInfo | null;
  loading: boolean;
  error: string | null;
};

const INITIAL: RoomState = {
  status: "lobby",
  maxPlayers: 50,
  players: [],
  stage: null,
  progress: {},
  lastEnded: null,
  loading: true,
  error: null,
};

type Snapshot = {
  status: RoomState["status"];
  maxPlayers?: number;
  players: PlayerSnapshot[];
  stage: StageInfo | null;
  progress: Record<string, number>;
};

const POLL_MS = 5000;

const STATUS_ORDER: Record<RoomState["status"], number> = {
  lobby: 0,
  racing: 1,
  ended: 2,
};

function maxStatus(
  a: RoomState["status"],
  b: RoomState["status"],
): RoomState["status"] {
  return STATUS_ORDER[a] >= STATUS_ORDER[b] ? a : b;
}

export type RoomChannel = RoomState & { refresh: () => void };

export type UseRoomChannelOptions = {
  withProgress?: boolean;
};

export function useRoomChannel(
  code: string | null,
  opts: UseRoomChannelOptions = {},
): RoomChannel {
  const { withProgress = false } = opts;
  const [state, setState] = useState<RoomState>(INITIAL);
  const refreshRef = useRef<() => void>(() => {});

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
          const status = maxStatus(prev.status, data.status);
          const stage =
            status === "ended" ? null : prev.stage ?? data.stage;
          return {
            ...prev,
            status,
            maxPlayers: data.maxPlayers ?? prev.maxPlayers,
            players: Array.from(byId.values()),
            stage,
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

    refreshRef.current = fetchSnapshot;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`room-${code}`);

    channel.bind("pusher:subscription_succeeded", () => {
      if (cancelled) return;
      fetchSnapshot();
    });

    channel.bind(EVENT.PlayerJoined, (payload: PlayerJoinedPayload) => {
      setState((prev) => {
        if (prev.players.some((p) => p.id === payload.id)) return prev;
        return { ...prev, players: [...prev.players, payload] };
      });
    });

    channel.bind(EVENT.PlayerLeft, (payload: PlayerLeftPayload) => {
      setState((prev) => {
        if (!prev.players.some((p) => p.id === payload.id)) return prev;
        return {
          ...prev,
          players: prev.players.filter((p) => p.id !== payload.id),
        };
      });
    });

    channel.bind(EVENT.RoomUpdated, (payload: RoomUpdatedPayload) => {
      setState((prev) => {
        if (prev.status === payload.status) return prev;
        return { ...prev, status: payload.status };
      });
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

    const progressChannel = withProgress
      ? pusher.subscribe(`room-${code}-progress`)
      : null;
    progressChannel?.bind(
      EVENT.ProgressUpdated,
      (payload: ProgressUpdatedPayload) => {
        setState((prev) => {
          if (!prev.stage || prev.stage.stageIndex !== payload.stageIndex) return prev;
          if ((prev.progress[payload.playerId] ?? 0) >= payload.value) return prev;
          return {
            ...prev,
            progress: { ...prev.progress, [payload.playerId]: payload.value },
          };
        });
      },
    );

    channel.bind(EVENT.StageEnded, (payload: StageEndedPayload) => {
      setState((prev) => {
        if (prev.lastEnded?.stageIndex === payload.stageIndex) return prev;
        return {
          ...prev,
          lastEnded: {
            stageIndex: payload.stageIndex,
            leaderboard: payload.leaderboard,
            endedAt: Date.now(),
          },
          status: payload.nextStageIndex === null ? "ended" : prev.status,
          stage: payload.nextStageIndex === null ? null : prev.stage,
        };
      });
    });

    const pollId = window.setInterval(() => {
      if (cancelled) return;
      fetchSnapshot();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      channel.unbind_all();
      pusher.unsubscribe(`room-${code}`);
      if (progressChannel) {
        progressChannel.unbind_all();
        pusher.unsubscribe(`room-${code}-progress`);
      }
      refreshRef.current = () => {};
    };
  }, [code, withProgress]);

  const refresh = useCallback(() => refreshRef.current(), []);

  return useMemo(() => ({ ...state, refresh }), [state, refresh]);
}
