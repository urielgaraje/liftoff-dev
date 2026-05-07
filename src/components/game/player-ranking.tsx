"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Rocket } from "@/components/game/rocket";
import { SKIN_TEXT_CLASS, type RocketSkin } from "@/lib/game/skins";
import type { PlayerSnapshot } from "@/lib/realtime/events";
import { cn } from "@/lib/utils";

type Props = {
  players: PlayerSnapshot[];
  progress: Record<string, number>;
  selfPlayerId: string | null;
};

export function PlayerRanking({ players, progress, selfPlayerId }: Props) {
  const ranked = useMemo(() => {
    const items = players.map((p) => ({
      ...p,
      value: progress[p.id] ?? 0,
    }));
    items.sort(
      (a, b) => b.value - a.value || a.nickname.localeCompare(b.nickname),
    );
    return items;
  }, [players, progress]);

  if (ranked.length === 0) return null;

  const selfIndex = selfPlayerId
    ? ranked.findIndex((p) => p.id === selfPlayerId)
    : -1;
  const selfRank = selfIndex >= 0 ? selfIndex + 1 : null;
  const total = ranked.length;
  const top3 = ranked.slice(0, 3);

  return (
    <aside
      data-testid="player-ranking"
      className="pointer-events-none fixed top-6 right-6 z-30 flex flex-col items-end gap-3"
    >
      {selfRank !== null && (
        <div className="flex items-baseline gap-2 rounded-full bg-bg-secondary/85 px-4 py-1.5 font-mono ring-1 ring-bg-tertiary backdrop-blur">
          <span className="text-[10px] tracking-[0.3em] text-fg-muted">
            POSICIÓN
          </span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={selfRank}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-base tabular-nums text-accent-cyan"
              data-testid="player-ranking-self"
            >
              {selfRank}
            </motion.span>
          </AnimatePresence>
          <span className="text-xs tabular-nums text-fg-secondary">
            / {total}
          </span>
        </div>
      )}

      <ul className="flex flex-col gap-1.5">
        {top3.map((p, i) => {
          const isSelf = selfPlayerId === p.id;
          return (
            <motion.li
              layout
              key={p.id}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1 font-mono ring-1 backdrop-blur",
                isSelf
                  ? "bg-bg-secondary ring-accent-cyan/60"
                  : "bg-bg-secondary/70 ring-bg-tertiary",
              )}
            >
              <span className="w-3 text-[10px] tabular-nums text-fg-muted">
                {i + 1}
              </span>
              <span
                style={{
                  filter: `drop-shadow(0 0 6px var(--color-rocket-${p.rocketSkin}))`,
                }}
              >
                <Rocket skin={p.rocketSkin as RocketSkin} size={16} />
              </span>
              <span
                className={cn(
                  "max-w-[6.5rem] truncate text-[11px]",
                  SKIN_TEXT_CLASS[p.rocketSkin as RocketSkin],
                )}
              >
                {p.nickname}
              </span>
              <span className="text-[10px] tabular-nums text-fg-secondary">
                {p.value}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </aside>
  );
}
