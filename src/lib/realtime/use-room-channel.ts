"use client";
import { useEffect, useState } from "react";
import {
  EVENT,
  type PlayerJoinedPayload,
  type PlayerLeftPayload,
  type PlayerSnapshot,
  type RoomUpdatedPayload,
} from "@/lib/realtime/events";
import { getPusherClient } from "@/lib/realtime/client";

type RoomState = {
  status: "lobby" | "racing" | "ended";
  players: PlayerSnapshot[];
  loading: boolean;
  error: string | null;
};

const INITIAL: RoomState = {
  status: "lobby",
  players: [],
  loading: true,
  error: null,
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
        const data = (await res.json()) as {
          status: RoomState["status"];
          players: PlayerSnapshot[];
        };
        if (cancelled) return;
        setState({ status: data.status, players: data.players, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        setState({
          status: "lobby",
          players: [],
          loading: false,
          error: err instanceof Error ? err.message : "fetch failed",
        });
      }
    };

    fetchSnapshot();

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`room-${code}`);

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

    return () => {
      cancelled = true;
      channel.unbind_all();
      pusher.unsubscribe(`room-${code}`);
    };
  }, [code]);

  return state;
}
