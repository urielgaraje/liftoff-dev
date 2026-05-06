"use client";

import { motion } from "framer-motion";
import { SKIN_TEXT_CLASS, type RocketSkin } from "@/lib/game/skins";
import { cn } from "@/lib/utils";

type Props = {
  skin: RocketSkin;
  size?: number;
  className?: string;
  animate?: boolean;
  /** 0..1 — modula tamaño/intensidad de llama. Default 1. */
  intensity?: number;
};

function RocketSvg({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* cuerpo + punta */}
      <path d="M12 2 C 14.5 5.5 16 10 16 14 V 18 H 8 V 14 C 8 10 9.5 5.5 12 2 Z" />
      {/* ventana */}
      <circle cx="12" cy="11" r="2" />
      {/* aleta izquierda */}
      <path d="M8 15 L 4 19 L 4 21 L 8 19" />
      {/* aleta derecha */}
      <path d="M16 15 L 20 19 L 20 21 L 16 19" />
      {/* boquilla / cierre inferior */}
      <line x1="9.5" y1="18" x2="14.5" y2="18" />
    </svg>
  );
}

export function Rocket({
  skin,
  size = 48,
  className,
  animate = false,
  intensity = 1,
}: Props) {
  if (!animate) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center",
          SKIN_TEXT_CLASS[skin],
          className,
        )}
        aria-label={`cohete ${skin}`}
      >
        <RocketSvg size={size} />
      </span>
    );
  }

  const k = Math.max(0.4, Math.min(1.4, intensity));
  const flameW = Math.max(5, size * 0.2 * (0.8 + k * 0.5));
  const flameH = Math.max(10, size * 0.5 * (0.6 + k * 0.6));
  const innerW = flameW * 0.55;
  const innerH = flameH * 0.65;
  const baseTop = size * (18 / 24); // base del body en coords del span (viewBox y=18)

  return (
    <motion.span
      className={cn(
        "relative inline-flex items-center justify-center",
        SKIN_TEXT_CLASS[skin],
        className,
      )}
      style={{ width: size, height: size }}
      animate={{ y: [0, -1.5, 0], scale: [1, 1.03, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      aria-label={`cohete ${skin}`}
    >
      {/* outer flame */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: baseTop,
          width: flameW,
          height: flameH,
          background: `linear-gradient(to bottom, var(--color-accent-yellow) 0%, var(--color-rocket-orange) 55%, transparent 100%)`,
          borderRadius: "45% 45% 50% 50% / 35% 35% 65% 65%",
          filter: "blur(2px)",
          transformOrigin: "top center",
          zIndex: 0,
        }}
        animate={{
          scaleY: [1, 1.3, 0.9, 1.2, 1],
          scaleX: [1, 0.85, 1.05, 0.9, 1],
          opacity: [0.8, 1, 0.65, 0.95, 0.8],
        }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* inner flame brighter */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: baseTop,
          width: innerW,
          height: innerH,
          background: `linear-gradient(to bottom, #ffffff 0%, var(--color-accent-yellow) 70%, transparent 100%)`,
          borderRadius: "45% 45% 50% 50% / 35% 35% 65% 65%",
          transformOrigin: "top center",
          zIndex: 1,
        }}
        animate={{
          scaleY: [0.9, 1.2, 0.8, 1.1, 0.9],
          opacity: [0.9, 1, 0.6, 0.95, 0.9],
        }}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* rocket body on top */}
      <span style={{ position: "relative", zIndex: 2 }}>
        <RocketSvg size={size} />
      </span>
    </motion.span>
  );
}
