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
          top: "-72vw",
          width: "85vw",
          height: "85vw",
        }}
      >
        {/* Saturn rings — anillo trasero (asoma por arriba/a los lados del planeta) */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "165%",
            height: "13%",
            transform: "translate(-50%, -50%) rotate(-7deg)",
            background: `linear-gradient(to right,
              transparent 0%,
              transparent 6%,
              rgba(155,180,140,0.55) 14%,
              rgba(220,235,200,0.75) 22%,
              rgba(170,195,150,0.55) 30%,
              transparent 42%,
              transparent 58%,
              rgba(170,195,150,0.55) 70%,
              rgba(220,235,200,0.75) 78%,
              rgba(155,180,140,0.55) 86%,
              transparent 94%,
              transparent 100%
            )`,
            borderRadius: "50%",
            filter: "blur(0.5px)",
          }}
        />

        {/* base esfera sólida verde (Saturno-like) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 50% 78%, #74dab0 0%, #4ebd8e 13%, #339f73 28%, #1f785a 50%, #0c3a32 75%, #061018 96%)
            `,
            boxShadow: `
              0 0 140px rgba(80,210,160,0.28),
              0 0 280px rgba(80,210,160,0.15)
            `,
          }}
        />

        {/* bandas atmosféricas finas (estilo gaseoso) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              repeating-linear-gradient(
                to bottom,
                transparent 0%,
                rgba(160,225,195,0.10) 1.4%,
                transparent 2.8%,
                rgba(15,75,55,0.24) 4.2%,
                transparent 6%,
                rgba(70,160,115,0.13) 7.5%,
                transparent 11%
              )
            `,
            mixBlendMode: "overlay",
          }}
        />

        {/* bandas más anchas — claros y oscuros que dan textura tipo Júpiter/Saturno */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(ellipse 110% 7% at 50% 60%, rgba(180,230,200,0.22) 0%, transparent 75%),
              radial-gradient(ellipse 110% 5% at 50% 67%, rgba(15,70,50,0.32) 0%, transparent 75%),
              radial-gradient(ellipse 110% 8% at 50% 75%, rgba(80,180,130,0.18) 0%, transparent 80%),
              radial-gradient(ellipse 110% 5% at 50% 84%, rgba(15,55,40,0.36) 0%, transparent 75%),
              radial-gradient(ellipse 110% 6% at 50% 91%, rgba(110,200,160,0.18) 0%, transparent 80%)
            `,
            mixBlendMode: "multiply",
          }}
        />

        {/* polos más oscuros */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(ellipse 70% 14% at 50% 100%, rgba(0,18,12,0.55) 0%, transparent 75%),
              radial-gradient(ellipse 70% 14% at 50% 0%, rgba(0,18,12,0.5) 0%, transparent 75%)
            `,
          }}
        />

        {/* terminator (oscurece lateralmente para sensación de esfera) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 50% 80%, transparent 0%, transparent 32%, rgba(0,8,12,0.5) 72%, rgba(0,4,8,0.9) 100%)
            `,
          }}
        />

        {/* highlight especular */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse 32% 14% at 48% 92%, rgba(225,255,235,0.32) 0%, transparent 70%)",
            mixBlendMode: "screen",
          }}
        />

        {/* atmósfera exterior pulsante */}
        <motion.div
          animate={{ opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[-2.5%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, transparent 48%, rgba(110,220,170,0.28) 50.5%, rgba(110,220,170,0.1) 53%, transparent 57%)",
          }}
        />

        {/* Saturn rings — parte delantera (cruza por delante del planeta) */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "172%",
            height: "11%",
            transform: "translate(-50%, calc(-50% + 1.2%)) rotate(-7deg)",
            background: `linear-gradient(to right,
              transparent 0%,
              transparent 16%,
              rgba(170,195,150,0.0) 22%,
              rgba(190,215,170,0.55) 30%,
              rgba(235,245,215,0.75) 38%,
              rgba(170,195,150,0.5) 45%,
              transparent 50%,
              transparent 50%,
              rgba(170,195,150,0.5) 55%,
              rgba(235,245,215,0.75) 62%,
              rgba(190,215,170,0.55) 70%,
              transparent 78%,
              transparent 100%
            )`,
            borderRadius: "50%",
            filter: "blur(0.4px)",
            mixBlendMode: "screen",
          }}
        />
      </motion.div>
    </div>
  );
}
