"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Star = {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
  phase: number;
  layer: 0 | 1;
};

const STAR_COUNT = 160;

function spawnStars(w: number, h: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const isClose = Math.random() < 0.35;
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: isClose ? Math.random() * 1.3 + 0.7 : Math.random() * 0.7 + 0.25,
      vy: isClose ? 0.045 + Math.random() * 0.035 : 0.012 + Math.random() * 0.018,
      alpha: isClose ? 0.55 + Math.random() * 0.4 : 0.25 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      layer: isClose ? 1 : 0,
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
      for (const s of stars) {
        if (!reduceMotion) {
          s.y += s.vy * speed;
          if (s.y > h + 2) {
            s.y = -2;
            s.x = Math.random() * w;
          }
        }
        const twinkle = reduceMotion
          ? 1
          : 0.7 + 0.3 * Math.sin(now * 0.0018 + s.phase);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * twinkle})`;
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
