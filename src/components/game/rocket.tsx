"use client";

import { Rocket as RocketIcon } from "lucide-react";
import { motion } from "framer-motion";
import { SKIN_TEXT_CLASS, type RocketSkin } from "@/lib/game/skins";
import { cn } from "@/lib/utils";

type Props = {
  skin: RocketSkin;
  size?: number;
  className?: string;
  animate?: boolean;
};

export function Rocket({ skin, size = 48, className, animate = false }: Props) {
  if (!animate) {
    return (
      <RocketIcon
        size={size}
        strokeWidth={1.5}
        className={cn(SKIN_TEXT_CLASS[skin], className)}
        aria-label={`cohete ${skin}`}
      />
    );
  }

  const flameWidth = Math.max(6, size * 0.32);
  const flameHeight = Math.max(10, size * 0.55);
  const innerWidth = flameWidth * 0.55;
  const innerHeight = flameHeight * 0.7;

  return (
    <motion.span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={{ y: [0, -1.5, 0], scale: [1, 1.03, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      aria-label={`cohete ${skin}`}
    >
      <RocketIcon
        size={size}
        strokeWidth={1.5}
        className={cn("relative z-10", SKIN_TEXT_CLASS[skin], className)}
        aria-hidden
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: `calc(50% - ${size * 0.55}px)`,
          width: flameWidth,
          height: flameHeight,
          background: `linear-gradient(to top, var(--color-rocket-orange) 0%, var(--color-accent-yellow) 45%, transparent 95%)`,
          borderRadius: "50% 50% 40% 40% / 60% 60% 40% 40%",
          filter: "blur(2px)",
          transformOrigin: "top center",
        }}
        animate={{
          scaleY: [1, 1.35, 0.9, 1.2, 1],
          scaleX: [1, 0.85, 1.05, 0.9, 1],
          opacity: [0.85, 1, 0.7, 0.95, 0.85],
        }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: `calc(50% - ${size * 0.5}px)`,
          width: innerWidth,
          height: innerHeight,
          background: `linear-gradient(to top, #ffffff 0%, var(--color-accent-yellow) 60%, transparent 100%)`,
          borderRadius: "50% 50% 40% 40% / 60% 60% 40% 40%",
          transformOrigin: "top center",
        }}
        animate={{
          scaleY: [0.9, 1.2, 0.85, 1.1, 0.9],
          opacity: [0.9, 1, 0.6, 0.95, 0.9],
        }}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.span>
  );
}
