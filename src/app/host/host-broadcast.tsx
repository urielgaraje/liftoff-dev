"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HostPodium } from "@/components/game/host-podium";
import { Rocket } from "@/components/game/rocket";
import { type RocketSkin } from "@/lib/game/skins";
import { type useRoomChannel } from "@/lib/realtime/use-room-channel";
import { cn } from "@/lib/utils";

const TOP_VISIBLE = 8;
const STAGE_ENDED_BANNER_DURATION_MS = 3500;

type Props = {
  code: string;
  room: ReturnType<typeof useRoomChannel>;
};

export function HostBroadcast({ room }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  const stage = room.stage;
  const remainingMs = stage
    ? Math.max(0, stage.durationMs - (now - new Date(stage.startedAt).getTime()))
    : 0;
  const remainingS = Math.ceil(remainingMs / 1000);

  const ranked = useMemo(() => {
    const items = room.players.map((p) => ({
      ...p,
      value: room.progress[p.id] ?? 0,
    }));
    items.sort((a, b) => b.value - a.value || a.nickname.localeCompare(b.nickname));
    return items;
  }, [room.players, room.progress]);

  const topValue = ranked[0]?.value ?? 0;
  const top8 = ranked.slice(0, TOP_VISIBLE);

  const showStageEndedBanner =
    room.lastEnded !== null &&
    now - room.lastEnded.endedAt < STAGE_ENDED_BANNER_DURATION_MS;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-bg-tertiary p-6">
        <motion.p
          animate={{ opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="font-mono text-xs tracking-[0.3em] text-accent-cyan"
          data-testid="broadcast-header"
        >
          {room.status === "ended"
            ? "LIFTOFF · CARRERA COMPLETADA"
            : `STAGE ${stage ? stage.stageIndex + 1 : "?"} · ${
                stage?.stageId.toUpperCase() ?? ""
              }`}
        </motion.p>
        <div className="flex items-center gap-3">
          {stage && room.status === "racing" && (
            <div
              className="rounded-full bg-bg-tertiary px-3 py-1.5 font-mono text-xs text-fg-secondary"
              data-testid="broadcast-timer"
            >
              QUEDAN {remainingS}s
            </div>
          )}
          <div className="rounded-full bg-bg-tertiary px-3 py-1.5 font-mono text-xs text-fg-secondary">
            {room.players.length}/50
          </div>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[1fr_360px]">
        {room.status === "ended" && room.lastEnded ? (
          <HostPodium leaderboard={room.lastEnded.leaderboard} />
        ) : (
        <section className="relative flex flex-col items-center justify-end overflow-hidden p-12">
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan/10 blur-3xl"
            aria-hidden
          />
          {showStageEndedBanner && (
            <motion.div
              data-testid="broadcast-banner"
              initial={{ opacity: 0, scale: 0.85, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="absolute top-1/2 left-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 rounded-3xl bg-bg-secondary/95 px-12 py-10 shadow-[0_0_80px_rgba(34,211,238,0.45)] ring-2 ring-accent-cyan backdrop-blur"
            >
              <p className="font-mono text-xs tracking-[0.4em] text-accent-cyan">
                STAGE COMPLETADA
              </p>
              <p className="text-4xl font-medium text-fg-primary">
                Planeta alcanzado
              </p>
              <p className="font-mono text-xs tracking-wider text-fg-muted">
                líder · {room.lastEnded?.leaderboard[0]?.nickname ?? "—"} ·{" "}
                {room.lastEnded?.leaderboard[0]?.value ?? 0} m
              </p>
            </motion.div>
          )}
          <div
            className="relative grid w-full max-w-3xl grid-cols-4 gap-6"
            data-testid="broadcast-rockets"
          >
            {top8.map((p) => {
              const ratio = topValue > 0 ? p.value / topValue : 0;
              const lift = Math.round(ratio * 200);
              const skin = p.rocketSkin as RocketSkin;
              return (
                <div
                  key={p.id}
                  data-testid={`broadcast-rocket-${p.nickname}`}
                  className="relative flex flex-col items-center"
                >
                  {lift > 6 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 bottom-12 z-0 w-[6px] -translate-x-1/2 rounded-full"
                      style={{
                        height: `${lift}px`,
                        background: `linear-gradient(to top, var(--color-rocket-${skin}) 0%, transparent 100%)`,
                        opacity: 0.7,
                        filter: `blur(0.5px) drop-shadow(0 0 8px var(--color-rocket-${skin}))`,
                      }}
                    />
                  )}
                  <motion.div
                    initial={false}
                    animate={{ y: -lift }}
                    transition={{ type: "spring", stiffness: 60, damping: 14 }}
                    className="relative z-10 flex flex-col items-center gap-2"
                  >
                    <span
                      className="relative inline-flex items-center justify-center"
                      style={{
                        filter: `drop-shadow(0 0 12px var(--color-rocket-${skin}))`,
                      }}
                    >
                      <Rocket skin={skin} size={56} animate />
                    </span>
                    <span className="rounded-full bg-bg-secondary/85 px-2 py-0.5 font-mono text-xs text-fg-primary backdrop-blur">
                      {p.nickname}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-fg-muted">
                      {p.value}
                    </span>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </section>
        )}

        <aside className="flex flex-col gap-2 border-l border-bg-tertiary p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs tracking-wider text-fg-muted">
              LEADERBOARD
            </p>
            <p className="font-mono text-xs text-accent-cyan">
              {room.players.length}/50
            </p>
          </div>
          <ul
            className="flex flex-col gap-1 overflow-y-auto"
            data-testid="broadcast-leaderboard"
          >
            {ranked.map((p, i) => (
              <li
                key={p.id}
                data-testid={`leaderboard-${p.nickname}`}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2",
                  i < 3 ? "bg-bg-tertiary" : "bg-bg-secondary",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 font-mono text-xs text-fg-muted">
                    #{i + 1}
                  </span>
                  <Rocket skin={p.rocketSkin as RocketSkin} size={14} />
                  <span className="text-sm text-fg-primary">{p.nickname}</span>
                </div>
                <span className="font-mono text-xs text-fg-secondary">{p.value}</span>
              </li>
            ))}
            {ranked.length === 0 && (
              <li className="rounded-lg bg-bg-secondary px-3 py-4 text-center font-mono text-xs text-fg-muted">
                sin jugadores
              </li>
            )}
          </ul>
        </aside>
      </div>

    </main>
  );
}
