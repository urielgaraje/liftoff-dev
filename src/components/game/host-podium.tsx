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

type Slot = {
  rank: 0 | 1 | 2;
  size: number;
  pillarH: number;
  medalLabel: "ORO" | "PLATA" | "BRONCE";
  medalColor: string;
};

const SLOTS: Record<0 | 1 | 2, Slot> = {
  0: {
    rank: 0,
    size: 72,
    pillarH: 200,
    medalLabel: "ORO",
    medalColor: "text-accent-yellow",
  },
  1: {
    rank: 1,
    size: 56,
    pillarH: 130,
    medalLabel: "PLATA",
    medalColor: "text-fg-secondary",
  },
  2: {
    rank: 2,
    size: 48,
    pillarH: 90,
    medalLabel: "BRONCE",
    medalColor: "text-rocket-orange",
  },
};

const RENDER_ORDER: ReadonlyArray<0 | 1 | 2> = [1, 0, 2];

export function HostPodium({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  const top = leaderboard.slice(0, 3);
  const presentRanks = RENDER_ORDER.filter((r) => Boolean(top[r]));

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden p-12">
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan/10 blur-3xl"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-10 flex flex-col items-center gap-2"
      >
        <p className="font-mono text-xs tracking-[0.5em] text-accent-cyan">
          PLANETA LIFTOFF
        </p>
        <h1 className="text-4xl font-medium tracking-tight text-fg-primary">
          Carrera completada
        </h1>
      </motion.div>

      <div className="relative flex w-full max-w-3xl items-end justify-center gap-8">
        {presentRanks.map((rank, displayIdx) => {
          const slot = SLOTS[rank];
          const player = top[rank]!;
          const skin = player.rocketSkin as RocketSkin;
          const isFirst = rank === 0;
          return (
            <div
              key={player.playerId}
              data-testid={`podium-${player.nickname}`}
              className="flex flex-col items-center"
            >
              <motion.div
                initial={{ y: -180, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 80,
                  damping: 16,
                  delay: 0.2 + 0.16 * displayIdx,
                }}
                className="relative mb-3 flex flex-col items-center gap-1.5"
              >
                {isFirst && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-[-30%] rounded-full"
                    style={{
                      background: `radial-gradient(circle, var(--color-rocket-${skin}) 0%, transparent 65%)`,
                      opacity: 0.22,
                    }}
                  />
                )}
                <span
                  className="relative inline-flex items-center justify-center"
                  style={{
                    filter: `drop-shadow(0 0 ${isFirst ? 16 : 10}px var(--color-rocket-${skin}))`,
                  }}
                >
                  <Rocket skin={skin} size={slot.size} animate />
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-0.5 font-mono text-[11px] ring-1 backdrop-blur",
                    "bg-bg-secondary/85 ring-bg-tertiary",
                    SKIN_TEXT_CLASS[skin],
                  )}
                >
                  {player.nickname}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-fg-muted">
                  {player.value} m
                </span>
              </motion.div>
              <PodiumPillar
                rank={rank}
                height={slot.pillarH}
                medalLabel={slot.medalLabel}
                medalColor={slot.medalColor}
                delay={0.16 * displayIdx}
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
  skin: RocketSkin;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height, opacity: 1 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.4 + delay }}
      className={cn(
        "relative flex w-32 flex-col items-center overflow-hidden rounded-t-2xl bg-gradient-to-b from-bg-tertiary to-bg-secondary ring-1",
        rank === 0 ? "ring-accent-yellow/40" : "ring-bg-tertiary",
      )}
      style={{ minHeight: 0 }}
    >
      <div className="flex flex-col items-center gap-1 pt-4">
        <span className="font-mono text-3xl font-semibold tabular-nums text-fg-primary">
          {rank + 1}
        </span>
        <span
          className={cn("font-mono text-[10px] tracking-[0.3em]", medalColor)}
        >
          {medalLabel}
        </span>
      </div>
      <div
        aria-hidden
        className={cn("absolute inset-x-0 bottom-0 h-1", SKIN_BG_CLASS[skin])}
      />
    </motion.div>
  );
}
