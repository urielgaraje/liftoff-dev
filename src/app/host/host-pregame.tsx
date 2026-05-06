"use client";

import { Check, Clipboard, Play, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Rocket } from "@/components/game/rocket";
import { Button } from "@/components/ui/button";
import {
  SKIN_TEXT_CLASS,
  type RocketSkin,
} from "@/lib/game/skins";
import { type useRoomChannel } from "@/lib/realtime/use-room-channel";
import { cn } from "@/lib/utils";

type Props = {
  code: string;
  playUrl: string;
  room: ReturnType<typeof useRoomChannel>;
};

const VISIBLE_ROCKETS = 8;

export function HostPreGame({ code, playUrl, room }: Props) {
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const onStart = async () => {
    setStartError(null);
    setStarting(true);
    try {
      const res = await fetch(`/api/room/${code}/start`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStartError(body.error ?? "no se pudo iniciar");
      }
    } catch {
      setStartError("error de red");
    } finally {
      setStarting(false);
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(playUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const players = room.players;
  const visiblePlayers = players.slice(0, VISIBLE_ROCKETS);
  const hiddenCount = players.length - visiblePlayers.length;
  const hasPlayers = players.length > 0;

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <PlanetBackdrop />

      <header className="relative z-10 flex items-center justify-between p-6">
        <motion.p
          animate={{ opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="font-mono text-xs tracking-[0.4em] text-accent-cyan"
        >
          LIFTOFF · PRE-PARTIDA
        </motion.p>
        <div className="flex items-center gap-2 rounded-full bg-bg-tertiary/80 px-3 py-1.5 font-mono text-xs text-fg-secondary backdrop-blur">
          <Users size={14} />
          <span data-testid="host-count">{players.length}/50</span>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-8 pb-12 pt-4">
        <motion.p
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="font-mono text-[10px] tracking-[0.45em] text-fg-muted"
        >
          DESTINO · GDI
        </motion.p>

        <div className="relative flex flex-col items-center gap-5">
          <p className="font-mono text-[10px] tracking-[0.4em] text-fg-muted">
            CÓDIGO DE SALA
          </p>
          <motion.p
            data-testid="host-code"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-mono text-[88px] font-medium tracking-[0.2em] text-fg-primary leading-none"
            style={{
              textShadow:
                "0 0 50px rgba(34,211,238,0.5), 0 0 12px rgba(34,211,238,0.6)",
            }}
          >
            {code}
          </motion.p>
          <div className="flex items-center gap-2 rounded-full bg-bg-secondary/80 px-4 py-1.5 font-mono text-xs text-fg-secondary ring-1 ring-bg-tertiary backdrop-blur">
            <span className="truncate">{playUrl}</span>
            <button
              type="button"
              onClick={onCopy}
              data-testid="host-copy"
              className={cn(
                "ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] tracking-wider transition",
                copied
                  ? "bg-accent-cyan/20 text-accent-cyan"
                  : "bg-bg-tertiary/80 text-fg-secondary hover:bg-bg-tertiary",
              )}
            >
              {copied ? <Check size={11} /> : <Clipboard size={11} />}
              {copied ? "COPIADO" : "COPIAR"}
            </button>
          </div>
        </div>

        <div className="flex w-full max-w-3xl flex-col items-center gap-3">
          <p className="font-mono text-[10px] tracking-[0.4em] text-fg-muted">
            COHETES EN PISTA · {players.length}/50
          </p>
          {hasPlayers ? (
            <ul
              className="flex flex-wrap items-center justify-center gap-4"
              data-testid="host-player-list"
            >
              {visiblePlayers.map((p, i) => (
                <motion.li
                  key={p.id}
                  data-testid={`host-player-${p.nickname}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut", delay: i * 0.04 }}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    style={{
                      filter: `drop-shadow(0 0 8px var(--color-rocket-${p.rocketSkin}))`,
                    }}
                  >
                    <Rocket
                      skin={p.rocketSkin as RocketSkin}
                      size={28}
                      animate
                      intensity={0.7}
                    />
                  </span>
                  <span
                    className={cn(
                      "max-w-[5rem] truncate font-mono text-[10px]",
                      SKIN_TEXT_CLASS[p.rocketSkin as RocketSkin],
                    )}
                  >
                    {p.nickname}
                  </span>
                </motion.li>
              ))}
              {hiddenCount > 0 && (
                <li className="flex flex-col items-center gap-1">
                  <span className="flex size-7 items-center justify-center rounded-full bg-bg-secondary/70 ring-1 ring-bg-tertiary">
                    <span className="font-mono text-[10px] text-fg-secondary">
                      +{hiddenCount}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-fg-muted">más</span>
                </li>
              )}
            </ul>
          ) : (
            <p className="font-mono text-xs text-fg-muted">
              comparte el código para que se conecten
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button
            type="button"
            onClick={onStart}
            disabled={starting || !hasPlayers}
            className="h-14 gap-3 rounded-full px-12 text-base font-semibold shadow-[0_0_40px_rgba(34,211,238,0.45)]"
            data-testid="host-start"
          >
            <Play size={18} fill="currentColor" />
            {starting ? "Iniciando…" : "Iniciar carrera"}
          </Button>
          {startError && (
            <p className="text-center text-sm text-rocket-red" role="alert">
              {startError}
            </p>
          )}
          {!hasPlayers && !startError && (
            <p className="font-mono text-[10px] tracking-wider text-fg-muted">
              esperando al menos un jugador
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function PlanetBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: "-88vw",
          width: "100vw",
          height: "100vw",
        }}
      >
        {/* base esfera sólida verde */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 50% 78%, #74dab0 0%, #4ebd8e 13%, #339f73 28%, #1f785a 50%, #0c3a32 75%, #061018 96%)
            `,
            boxShadow: `
              0 0 140px rgba(80,210,160,0.32),
              0 0 280px rgba(80,210,160,0.18)
            `,
          }}
        />

        {/* bandas atmosféricas finas (líneas tipo gaseoso) — opacidad subida */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              repeating-linear-gradient(
                to bottom,
                transparent 0%,
                rgba(180,235,210,0.22) 1.2%,
                transparent 2.4%,
                rgba(10,55,40,0.45) 3.6%,
                transparent 5.6%,
                rgba(140,210,170,0.28) 7%,
                transparent 9.5%,
                rgba(30,90,65,0.32) 11%,
                transparent 14%
              )
            `,
            mixBlendMode: "overlay",
          }}
        />

        {/* bandas anchas claro/oscuro tipo Saturno — más visibles */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(ellipse 120% 6% at 50% 56%, rgba(220,245,220,0.45) 0%, transparent 80%),
              radial-gradient(ellipse 120% 5% at 50% 62%, rgba(10,55,40,0.5) 0%, transparent 80%),
              radial-gradient(ellipse 120% 8% at 50% 70%, rgba(150,220,180,0.35) 0%, transparent 82%),
              radial-gradient(ellipse 120% 5% at 50% 78%, rgba(8,45,32,0.55) 0%, transparent 80%),
              radial-gradient(ellipse 120% 7% at 50% 85%, rgba(180,235,200,0.32) 0%, transparent 82%),
              radial-gradient(ellipse 120% 4% at 50% 92%, rgba(8,40,28,0.5) 0%, transparent 80%)
            `,
            mixBlendMode: "multiply",
          }}
        />

        {/* nubes/tormentas en movimiento — simulan rotación del planeta */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <motion.div
            className="absolute inset-y-0"
            style={{
              left: "-100%",
              width: "300%",
              background: `
                radial-gradient(ellipse 7% 3% at 8% 78%, rgba(5,40,28,0.7) 0%, transparent 70%),
                radial-gradient(ellipse 5% 2.2% at 18% 82%, rgba(5,35,25,0.6) 0%, transparent 70%),
                radial-gradient(ellipse 4% 1.8% at 26% 72%, rgba(220,250,225,0.55) 0%, transparent 70%),
                radial-gradient(ellipse 8% 3.5% at 36% 80%, rgba(8,42,30,0.5) 0%, transparent 70%),
                radial-gradient(ellipse 5% 2% at 45% 74%, rgba(180,240,210,0.45) 0%, transparent 70%),
                radial-gradient(ellipse 6% 2.5% at 55% 82%, rgba(5,38,28,0.6) 0%, transparent 70%),
                radial-gradient(ellipse 4% 1.6% at 64% 76%, rgba(220,250,225,0.5) 0%, transparent 70%),
                radial-gradient(ellipse 7% 3% at 74% 80%, rgba(8,42,30,0.55) 0%, transparent 70%),
                radial-gradient(ellipse 5% 2% at 85% 73%, rgba(180,240,210,0.45) 0%, transparent 70%),
                radial-gradient(ellipse 6% 2.6% at 92% 78%, rgba(5,40,28,0.6) 0%, transparent 70%)
              `,
              mixBlendMode: "overlay",
            }}
            animate={{ x: ["0%", "-66.66%"] }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* tormenta principal pulsante (un "ojo" tipo Júpiter) */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse 5% 2.5% at 42% 80%, rgba(255,210,180,0.7) 0%, rgba(180,90,60,0.4) 30%, transparent 70%)",
            mixBlendMode: "overlay",
          }}
          animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.04, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* polos más oscuros */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(ellipse 70% 14% at 50% 100%, rgba(0,18,12,0.6) 0%, transparent 75%),
              radial-gradient(ellipse 70% 14% at 50% 0%, rgba(0,18,12,0.55) 0%, transparent 75%)
            `,
          }}
        />

        {/* terminator (sombra de borde) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 50% 80%, transparent 0%, transparent 30%, rgba(0,8,12,0.55) 72%, rgba(0,4,8,0.92) 100%)
            `,
          }}
        />

        {/* atmósfera exterior pulsante */}
        <motion.div
          animate={{ opacity: [0.55, 0.8, 0.55] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[-2.5%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, transparent 48%, rgba(110,220,170,0.32) 50.5%, rgba(110,220,170,0.12) 53%, transparent 57%)",
          }}
        />

      </motion.div>
    </div>
  );
}
