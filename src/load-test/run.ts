import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();
import { launchHost, launchBrowserPlayer, type BrowserPlayer } from "./browser-clients";
import {
  spawnSimulatedClient,
  type SentRegistry,
  type SimulatedClient,
} from "./simulated-client";
import { spawnProgressMonitor, type ProgressMonitor } from "./progress-monitor";
import { createMetrics, summarize } from "./metrics";
import { judge, printReport, DEFAULT_THRESHOLDS } from "./report";
import type { RocketSkin } from "@/lib/game/skins";

type Config = {
  baseUrl: string;
  passphrase: string;
  pusherKey: string;
  pusherCluster: string;
  playerCount: number;
  browserCount: number;
  stageDurationMs: number;
  headless: boolean;
  joinStaggerMs: number;
};

const SKINS: readonly RocketSkin[] = [
  "cyan",
  "magenta",
  "yellow",
  "orange",
  "green",
  "purple",
  "red",
  "blue",
];

function readConfig(): Config {
  const baseUrl = process.env.LOAD_BASE_URL ?? "http://localhost:3000";
  const passphrase = process.env.HOST_PASSPHRASE;
  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!passphrase) throw new Error("HOST_PASSPHRASE missing");
  if (!pusherKey) throw new Error("NEXT_PUBLIC_PUSHER_KEY missing");
  if (!pusherCluster) throw new Error("NEXT_PUBLIC_PUSHER_CLUSTER missing");
  return {
    baseUrl,
    passphrase,
    pusherKey,
    pusherCluster,
    playerCount: Number(process.env.PLAYER_COUNT ?? "50"),
    browserCount: Number(process.env.BROWSER_COUNT ?? "5"),
    stageDurationMs: Number(process.env.STAGE_DURATION_MS ?? "30000"),
    headless: process.env.HEADLESS !== "false",
    joinStaggerMs: Number(process.env.JOIN_STAGGER_MS ?? "50"),
  };
}

async function pollUntilLobbyHas(
  baseUrl: string,
  code: string,
  expected: number,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${baseUrl}/api/room/${code}`, { cache: "no-store" });
    if (res.ok) {
      const body = (await res.json()) as { players: unknown[] };
      if (body.players.length >= expected) return;
    }
    await sleep(500);
  }
  throw new Error(`lobby never reached ${expected} players`);
}

async function pollUntilEnded(
  baseUrl: string,
  code: string,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/api/room/${code}`, { cache: "no-store" });
      if (res.ok) {
        const body = (await res.json()) as { status: string };
        if (body.status === "ended") return true;
      }
    } catch {
      // transient fetch error under load — keep polling
    }
    await sleep(1000);
  }
  return false;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const cfg = readConfig();
  const browserPlayerCount = Math.max(0, cfg.browserCount - 1);
  const simulatedCount = Math.max(0, cfg.playerCount - browserPlayerCount);

  console.log(`[load-test] config:`, {
    baseUrl: cfg.baseUrl,
    playerCount: cfg.playerCount,
    browserPlayers: browserPlayerCount,
    simulatedPlayers: simulatedCount,
    headless: cfg.headless,
  });

  const metrics = createMetrics();
  const sentRegistry: SentRegistry = new Map();
  const browserPlayers: BrowserPlayer[] = [];
  const simulated: SimulatedClient[] = [];
  let monitor: ProgressMonitor | null = null;

  const host = await launchHost({
    baseUrl: cfg.baseUrl,
    passphrase: cfg.passphrase,
    headless: cfg.headless,
  });
  console.log(`[load-test] room created: ${host.code}`);

  let runError: unknown = null;
  try {
    for (let i = 0; i < browserPlayerCount; i++) {
      const player = await launchBrowserPlayer({
        hostBrowser: host.browser,
        baseUrl: cfg.baseUrl,
        code: host.code,
        nickname: `bp${i}`,
        skinIndex: i + 1,
      });
      browserPlayers.push(player);
    }
    console.log(`[load-test] ${browserPlayers.length} browser players joined`);

    for (let i = 0; i < simulatedCount; i++) {
      const skin = SKINS[(i + browserPlayerCount + 1) % SKINS.length];
      try {
        const client = await spawnSimulatedClient({
          baseUrl: cfg.baseUrl,
          code: host.code,
          nickname: `sim${i}`,
          rocketSkin: skin,
          pusherKey: cfg.pusherKey,
          pusherCluster: cfg.pusherCluster,
          metrics,
          sentRegistry,
        });
        simulated.push(client);
      } catch (err) {
        console.warn(`[load-test] sim${i} spawn failed:`, err);
      }
      if (cfg.joinStaggerMs > 0) await sleep(cfg.joinStaggerMs);
    }
    console.log(`[load-test] ${simulated.length} simulated clients connected`);

    monitor = await spawnProgressMonitor({
      code: host.code,
      pusherKey: cfg.pusherKey,
      pusherCluster: cfg.pusherCluster,
      metrics,
      sentRegistry,
    });
    console.log(`[load-test] progress monitor subscribed`);

    await pollUntilLobbyHas(
      cfg.baseUrl,
      host.code,
      browserPlayerCount + simulated.length,
      30_000,
    );
    console.log(`[load-test] lobby ready, starting stage`);

    await host.startStage();
    const startedAt = Date.now();

    const forceEndAt = startedAt + cfg.stageDurationMs + 2_000;
    const forceEnd = (async () => {
      const wait = Math.max(0, forceEndAt - Date.now());
      await sleep(wait);
      await fetch(`${cfg.baseUrl}/api/room/${host.code}/end-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageIndex: 0 }),
      }).catch(() => {});
    })();

    let ended = false;
    try {
      ended = await pollUntilEnded(
        cfg.baseUrl,
        host.code,
        cfg.stageDurationMs + 30_000,
      );
    } catch (err) {
      console.warn(`[load-test] poll failed:`, err);
    }
    await forceEnd;
    if (!ended) console.warn(`[load-test] stage end forced by orchestrator`);

    await sleep(1000);
  } catch (err) {
    runError = err;
    console.warn(`[load-test] race phase error (continuing to report):`, err);
  } finally {
    metrics.endedAt = Date.now();
    if (monitor) await monitor.stop().catch(() => {});
    await Promise.allSettled(simulated.map((s) => s.stop()));
    await Promise.allSettled(browserPlayers.map((p) => p.close()));
    await host.close().catch(() => {});
  }

  const summary = summarize(metrics);
  const verdict = judge(summary, DEFAULT_THRESHOLDS);
  printReport(
    summary,
    {
      playerCount: cfg.playerCount,
      browserCount: cfg.browserCount,
      stageDurationMs: cfg.stageDurationMs,
      baseUrl: cfg.baseUrl,
    },
    verdict,
  );
  if (runError) console.warn(`[load-test] run error during race:`, runError);
  process.exit(verdict.pass && !runError ? 0 : 1);
}

main().catch((err) => {
  console.error("[load-test] fatal:", err);
  process.exit(2);
});
