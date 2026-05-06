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
  const iconNode = (
    <RocketIcon
      size={size}
      strokeWidth={1.5}
      className={cn(SKIN_TEXT_CLASS[skin], className)}
      style={{ transform: "rotate(-45deg)" }}
      aria-label={`cohete ${skin}`}
    />
  );

  if (!animate) {
    return iconNode;
  }

  const flameWidth = Math.max(5, size * 0.22);
  const flameHeight = Math.max(8, size * 0.42);
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
      {/* outer flame, behind */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: -flameHeight * 0.25,
          width: flameWidth,
          height: flameHeight,
          background: `linear-gradient(to top, var(--color-rocket-orange) 0%, var(--color-accent-yellow) 50%, transparent 100%)`,
          borderRadius: "50% 50% 40% 40% / 65% 65% 35% 35%",
          filter: "blur(2px)",
          transformOrigin: "top center",
          zIndex: 0,
        }}
        animate={{
          scaleY: [1, 1.3, 0.9, 1.2, 1],
          scaleX: [1, 0.85, 1.05, 0.9, 1],
          opacity: [0.85, 1, 0.7, 0.95, 0.85],
        }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* inner flame, brighter */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: -flameHeight * 0.18,
          width: innerWidth,
          height: innerHeight,
          background: `linear-gradient(to top, #ffffff 0%, var(--color-accent-yellow) 65%, transparent 100%)`,
          borderRadius: "50% 50% 40% 40% / 65% 65% 35% 35%",
          transformOrigin: "top center",
          zIndex: 1,
        }}
        animate={{
          scaleY: [0.9, 1.2, 0.8, 1.1, 0.9],
          opacity: [0.9, 1, 0.6, 0.95, 0.9],
        }}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* rocket on top */}
      <span style={{ position: "relative", zIndex: 2 }}>{iconNode}</span>
    </motion.span>
  );
}
