"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Layer = 0 | 1 | 2;

type Star = {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
  phase: number;
  layer: Layer;
  tint: string;
  bright: boolean;
};

const STAR_COUNT = 200;

const TINTS = {
  white: "255,255,255",
  cyan: "34,211,238",
  magenta: "236,72,153",
  yellow: "250,204,21",
} as const;

function pickTint(): string {
  const r = Math.random();
  if (r < 0.04) return TINTS.cyan;
  if (r < 0.06) return TINTS.magenta;
  if (r < 0.075) return TINTS.yellow;
  return TINTS.white;
}

function spawnStars(w: number, h: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const lr = Math.random();
    let layer: Layer;
    let r: number;
    let vy: number;
    let alpha: number;
    if (lr < 0.55) {
      layer = 0;
      r = 0.2 + Math.random() * 0.5;
      vy = 0.006 + Math.random() * 0.012;
      alpha = 0.18 + Math.random() * 0.3;
    } else if (lr < 0.85) {
      layer = 1;
      r = 0.55 + Math.random() * 0.7;
      vy = 0.025 + Math.random() * 0.025;
      alpha = 0.42 + Math.random() * 0.35;
    } else {
      layer = 2;
      r = 0.95 + Math.random() * 0.85;
      vy = 0.055 + Math.random() * 0.04;
      alpha = 0.65 + Math.random() * 0.3;
    }
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r,
      vy,
      alpha,
      phase: Math.random() * Math.PI * 2,
      layer,
      tint: pickTint(),
      bright: layer === 2 && Math.random() < 0.2,
    });
  }
  return stars;
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const speedRef = useRef(1);
  speedRef.current = pathname?.startsWith("/host") ? 4 : 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let stars: Star[] = [];
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = spawnStars(w, h);
    };

    const draw = (now: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      const speed = speedRef.current;
      const showTrails = speed > 2 && !reduceMotion;

      for (const s of stars) {
        if (!reduceMotion) {
          s.y += s.vy * speed;
          if (s.y > h + 4) {
            s.y = -4;
            s.x = Math.random() * w;
          }
        }
        const twinkle = reduceMotion
          ? 1
          : 0.7 + 0.3 * Math.sin(now * 0.0018 + s.phase);
        const a = s.alpha * twinkle;

        // warp trail at high speed (host)
        if (showTrails && s.layer >= 1) {
          const trailLen = s.vy * speed * 22;
          const grad = ctx.createLinearGradient(s.x, s.y - trailLen, s.x, s.y);
          grad.addColorStop(0, `rgba(${s.tint},0)`);
          grad.addColorStop(1, `rgba(${s.tint},${a * 0.55})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(0.6, s.r * 0.9);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(s.x, s.y - trailLen);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
        }

        // glow halo for bright stars
        if (s.bright) {
          const haloR = s.r * 4.5;
          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloR);
          grad.addColorStop(0, `rgba(${s.tint},${a * 0.55})`);
          grad.addColorStop(1, `rgba(${s.tint},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.tint},${a})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduceMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
