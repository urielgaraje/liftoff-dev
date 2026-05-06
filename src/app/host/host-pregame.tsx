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
          <motion.div
            aria-hidden
            animate={{ scale: [1, 1.05, 1], opacity: [0.45, 0.8, 0.45] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-[-18px] rounded-3xl"
            style={{
              border: "1.5px solid var(--color-accent-cyan)",
              boxShadow: "0 0 40px rgba(34,211,238,0.4)",
              opacity: 0.55,
            }}
          />
          <motion.div
            aria-hidden
            animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-[-36px] rounded-3xl"
            style={{ border: "1px solid var(--color-accent-cyan)" }}
          />
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute"
        style={{
          left: "-45vw",
          bottom: "-45vw",
          width: "110vw",
          height: "110vw",
        }}
      >
        <div
          className="size-full rounded-full"
          style={{
            background: `
              radial-gradient(circle at 65% 30%, rgba(120,200,240,0.45) 0%, rgba(34,90,140,0.25) 30%, rgba(8,8,30,0.6) 65%, rgba(8,8,30,0.95) 100%)
            `,
            boxShadow: `
              inset -60px -60px 200px rgba(0,0,0,0.7),
              0 0 120px rgba(34,211,238,0.25),
              0 0 240px rgba(34,211,238,0.18)
            `,
          }}
        />
        <motion.div
          animate={{ opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 70%, rgba(34,211,238,0.18) 0%, transparent 50%)",
            mixBlendMode: "screen",
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "1px solid rgba(34,211,238,0.18)",
          }}
        />
      </motion.div>
    </div>
  );
}
