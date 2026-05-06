"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { RocketSkin } from "@/lib/game/skins";

const PALETTE: ReadonlyArray<string> = [
  "var(--color-accent-yellow)",
  "var(--color-rocket-orange)",
  "var(--color-rocket-red)",
];

type Particle = {
  delay: number;
  duration: number;
  jitter: number;
  size: number;
  color: string;
  fall: number;
};

function rng(seed: number) {
  let x = seed | 0 || 1;
  return () => {
    x = (x * 1664525 + 1013904223) | 0;
    return ((x >>> 0) % 10000) / 10000;
  };
}

export function RocketTrail({
  intensity,
  skin: _skin,
  seed,
  topOffset = 0,
}: {
  intensity: number;
  skin: RocketSkin;
  seed: number;
  topOffset?: number;
}) {
  const k = Math.max(0, Math.min(1, intensity));
  const count = useMemo(() => Math.max(3, Math.round(3 + k * 9)), [k]);
  const fallBase = 80 + k * 90;

  const particles = useMemo<Particle[]>(() => {
    const r = rng(seed * 977 + count * 31);
    return Array.from({ length: count }, (_, i) => ({
      delay: (i / count) * 0.95 + r() * 0.08,
      duration: 0.8 + r() * 0.4,
      jitter: (r() - 0.5) * 18,
      size: 2.4 + r() * 2.6,
      color: PALETTE[Math.floor(r() * PALETTE.length)],
      fall: fallBase * (0.85 + r() * 0.4),
    }));
  }, [count, fallBase, seed]);

  if (k <= 0) return null;

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-1/2 -translate-x-1/2"
      style={{ top: topOffset, width: 0, height: 0 }}
    >
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${4 + p.size}px ${p.color}`,
            left: -p.size / 2,
            top: 0,
          }}
          initial={{ y: 0, x: 0, opacity: 0.95, scale: 1 }}
          animate={{ y: p.fall, x: p.jitter, opacity: 0, scale: 0.4 }}
          transition={{
            duration: p.duration,
            ease: "easeOut",
            repeat: Infinity,
            delay: p.delay,
          }}
        />
      ))}
    </span>
  );
}
