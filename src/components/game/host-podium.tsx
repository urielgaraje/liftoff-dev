"use client";

import { motion } from "framer-motion";
import { Rocket } from "@/components/game/rocket";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/realtime/events";
import {
  SKIN_BG_CLASS,
  SKIN_TEXT_CLASS,
  type RocketSkin,
} from "@/lib/game/skins";

const ORDER: ReadonlyArray<{ rank: 0 | 1 | 2; size: number; pillarH: number; medal: string; medalLabel: string; }> = [
  { rank: 1, size: 56, pillarH: 110, medal: "text-fg-secondary", medalLabel: "PLATA" },
  { rank: 0, size: 88, pillarH: 170, medal: "text-accent-yellow", medalLabel: "ORO" },
  { rank: 2, size: 48, pillarH: 70, medal: "text-rocket-orange", medalLabel: "BRONCE" },
];

export function HostPodium({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  const top = leaderboard.slice(0, 3);

  return (
    <section className="relative flex flex-col items-center justify-end overflow-hidden p-12">
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan/10 blur-3xl"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-12 flex flex-col items-center gap-2"
      >
        <p className="font-mono text-xs tracking-[0.5em] text-accent-cyan">
          PLANETA LIFTOFF
        </p>
        <h1 className="text-4xl font-medium tracking-tight text-fg-primary">
          Carrera completada
        </h1>
      </motion.div>

      <div className="relative flex w-full max-w-3xl items-end justify-center gap-6">
        {ORDER.map(({ rank, size, pillarH, medal, medalLabel }, i) => {
          const player = top[rank];
          const isFirst = rank === 0;
          if (!player) {
            return (
              <div key={i} className="flex flex-col items-center gap-3 opacity-40">
                <Rocket skin="cyan" size={size} />
                <PodiumPillar
                  rank={rank}
                  height={pillarH}
                  medalLabel="—"
                  medalColor="text-fg-muted"
                  delay={0.15 * i}
                />
              </div>
            );
          }
          const skin = player.rocketSkin as RocketSkin;
          return (
            <div
              key={player.playerId}
              data-testid={`podium-${player.nickname}`}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                initial={{ y: -240, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 70,
                  damping: 14,
                  delay: 0.2 + 0.18 * i,
                }}
                className="relative flex flex-col items-center gap-2"
              >
                {isFirst && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-12 rounded-full"
                    style={{
                      background: `radial-gradient(circle, var(--color-rocket-${skin}) 0%, transparent 65%)`,
                      opacity: 0.28,
                    }}
                  />
                )}
                <span
                  className="relative inline-flex items-center justify-center"
                  style={{
                    filter: `drop-shadow(0 0 ${isFirst ? 16 : 10}px var(--color-rocket-${skin}))`,
                  }}
                >
                  <Rocket skin={skin} size={size} />
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 font-mono text-xs ring-1 backdrop-blur",
                    "bg-bg-secondary/85 ring-bg-tertiary",
                    SKIN_TEXT_CLASS[skin],
                  )}
                >
                  {player.nickname}
                </span>
                <span className="font-mono text-xs tabular-nums text-fg-muted">
                  {player.value} m
                </span>
              </motion.div>
              <PodiumPillar
                rank={rank}
                height={pillarH}
                medalLabel={medalLabel}
                medalColor={medal}
                delay={0.18 * i}
                skin={skin}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PodiumPillar({
  rank,
  height,
  medalLabel,
  medalColor,
  delay,
  skin,
}: {
  rank: 0 | 1 | 2;
  height: number;
  medalLabel: string;
  medalColor: string;
  delay: number;
  skin?: RocketSkin;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 + delay }}
      className={cn(
        "relative flex w-32 items-start justify-center overflow-hidden rounded-t-2xl bg-gradient-to-b ring-1",
        rank === 0
          ? "from-bg-tertiary to-bg-secondary ring-accent-yellow/40"
          : "from-bg-tertiary to-bg-secondary/80 ring-bg-tertiary",
      )}
      style={{ minHeight: 0 }}
    >
      <div className="flex w-full flex-col items-center gap-1 pt-3">
        <span className="font-mono text-3xl font-bold tabular-nums text-fg-primary">
          {rank + 1}
        </span>
        <span
          className={cn("font-mono text-[10px] tracking-[0.3em]", medalColor)}
        >
          {medalLabel}
        </span>
      </div>
      {skin && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-x-0 bottom-0 h-1",
            SKIN_BG_CLASS[skin],
          )}
        />
      )}
    </motion.div>
  );
}
