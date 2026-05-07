import { createRequire } from "node:module";
import type PusherClient from "pusher-js";
import {
  EVENT,
  type StageEndedPayload,
  type StageStartedPayload,
} from "@/lib/realtime/events";
import type { RocketSkin } from "@/lib/game/skins";
import { recordProgress, type Metrics } from "./metrics";

const requireCjs = createRequire(import.meta.url);
const PusherCtor = requireCjs("pusher-js").Pusher as typeof PusherClient;

const PROGRESS_INTERVAL_MS = 1000;
const CHARS_PER_SECOND = 15;

export type SentRegistry = Map<string, number>;

export function sentKey(playerId: string, value: number): string {
  return `${playerId}:${value}`;
}

export type SimulatedClientConfig = {
  baseUrl: string;
  code: string;
  nickname: string;
  rocketSkin: RocketSkin;
  pusherKey: string;
  pusherCluster: string;
  metrics: Metrics;
  sentRegistry: SentRegistry;
};

export type SimulatedClient = {
  playerId: string;
  stop: () => Promise<void>;
};

export async function spawnSimulatedClient(
  cfg: SimulatedClientConfig,
): Promise<SimulatedClient> {
  const joinRes = await fetch(`${cfg.baseUrl}/api/room/${cfg.code}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: cfg.nickname, rocketSkin: cfg.rocketSkin }),
  });
  if (!joinRes.ok) {
    cfg.metrics.joinFailures += 1;
    throw new Error(`join failed for ${cfg.nickname}: ${joinRes.status}`);
  }
  const joinBody = (await joinRes.json()) as { playerId: string };
  const setCookie = joinRes.headers.get("set-cookie") ?? "";
  const extracted = extractPlayerCookie(setCookie, cfg.code);
  if (!extracted) {
    cfg.metrics.joinFailures += 1;
    throw new Error(`no player cookie for ${cfg.nickname}`);
  }
  const cookieHeader: string = extracted;

  const pusher = new PusherCtor(cfg.pusherKey, {
    cluster: cfg.pusherCluster,
    forceTLS: true,
  });
  const channel = pusher.subscribe(`room-${cfg.code}`);

  const subscribed = new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("pusher subscribe timeout")), 10_000);
    channel.bind("pusher:subscription_succeeded", () => {
      clearTimeout(t);
      resolve();
    });
    channel.bind("pusher:subscription_error", (err: unknown) => {
      clearTimeout(t);
      reject(new Error(`pusher subscribe error: ${JSON.stringify(err)}`));
    });
  });

  try {
    await subscribed;
  } catch (err) {
    cfg.metrics.pusherSubscribeFailures += 1;
    pusher.disconnect();
    throw err;
  }

  let stageStart: { startedAt: number; durationMs: number; paragraphLen: number } | null = null;
  let progressTimer: NodeJS.Timeout | null = null;
  let stopped = false;

  channel.bind(EVENT.StageStarted, (payload: StageStartedPayload) => {
    const init = payload.init as { paragraph?: string } | null;
    const paragraphLen = init?.paragraph?.length ?? 0;
    stageStart = {
      startedAt: new Date(payload.startedAt).getTime(),
      durationMs: payload.durationMs,
      paragraphLen,
    };
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = setInterval(() => {
      if (stopped || !stageStart) return;
      void sendProgress(payload.stageIndex);
    }, PROGRESS_INTERVAL_MS);
  });

  channel.bind(EVENT.StageEnded, (_payload: StageEndedPayload) => {
    stageStart = null;
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  });

  async function sendProgress(stageIndex: number): Promise<void> {
    if (!stageStart) return;
    const elapsedMs = Date.now() - stageStart.startedAt;
    if (elapsedMs <= 0) return;
    const target = Math.min(
      stageStart.paragraphLen,
      Math.floor((elapsedMs / 1000) * CHARS_PER_SECOND),
    );
    if (target <= 0) return;
    const sentAt = Date.now();
    cfg.sentRegistry.set(sentKey(joinBody.playerId, target), sentAt);
    let status: number | null = null;
    try {
      const res = await fetch(`${cfg.baseUrl}/api/room/${cfg.code}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ stageIndex, value: target }),
      });
      status = res.status;
    } catch {
      status = null;
    }
    recordProgress(cfg.metrics, Date.now() - sentAt, status);
  }

  return {
    playerId: joinBody.playerId,
    stop: async () => {
      stopped = true;
      if (progressTimer) clearInterval(progressTimer);
      channel.unbind_all();
      pusher.unsubscribe(`room-${cfg.code}`);
      pusher.disconnect();
    },
  };
}

function extractPlayerCookie(setCookie: string, code: string): string | null {
  const wanted = `liftoff_player_${code}`;
  const parts = setCookie.split(/,(?=[^ ])/);
  for (const part of parts) {
    const trimmed = part.trim();
    const semi = trimmed.indexOf(";");
    const kv = semi === -1 ? trimmed : trimmed.slice(0, semi);
    const eq = kv.indexOf("=");
    if (eq === -1) continue;
    const name = kv.slice(0, eq).trim();
    if (name === wanted) return kv;
  }
  return null;
}
