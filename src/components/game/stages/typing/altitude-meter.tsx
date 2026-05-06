"use client";

import { motion } from "framer-motion";
import { Rocket } from "@/components/game/rocket";
import { cn } from "@/lib/utils";
import { SKIN_TEXT_CLASS, type RocketSkin } from "@/lib/game/skins";

const TRACK_HEIGHT_PX = 160;

export function AltitudeMeter({
  ratio,
  skin,
}: {
  ratio: number;
  skin: RocketSkin;
}) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const percent = Math.round(clamped * 100);

  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col items-end gap-1">
        <span className="font-mono text-[10px] tracking-[0.3em] text-fg-muted">
          ALTÍMETRO
        </span>
        <span
          className={cn(
            "font-mono text-xs tabular-nums",
            SKIN_TEXT_CLASS[skin],
          )}
        >
          {percent}%
        </span>
      </div>
      <div
        className="relative w-9 overflow-hidden rounded-full bg-bg-secondary/70 ring-1 ring-bg-tertiary backdrop-blur"
        style={{ height: TRACK_HEIGHT_PX }}
      >
        <motion.div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-accent-cyan/30 to-transparent"
          initial={false}
          animate={{ height: `${clamped * 100}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 14 }}
        />
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          initial={false}
          animate={{
            bottom: `calc(${clamped * 100}% - 12px)`,
          }}
          transition={{ type: "spring", stiffness: 90, damping: 12 }}
        >
          <Rocket skin={skin} size={20} />
        </motion.div>
      </div>
    </div>
  );
}
