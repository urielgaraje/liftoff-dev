"use client";

import { Check, Clipboard, Users } from "lucide-react";
import { useState } from "react";
import { Rocket } from "@/components/game/rocket";
import { Button } from "@/components/ui/button";
import { type RocketSkin } from "@/lib/game/skins";
import { type useRoomChannel } from "@/lib/realtime/use-room-channel";

type Props = {
  code: string;
  playUrl: string;
  room: ReturnType<typeof useRoomChannel>;
};

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

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-bg-tertiary p-6">
        <p className="font-mono text-xs tracking-[0.3em] text-accent-cyan">
          LIFTOFF · PRE-PARTIDA
        </p>
        <div className="flex items-center gap-2 rounded-full bg-bg-tertiary px-3 py-1.5 font-mono text-xs text-fg-secondary">
          <Users size={14} />
          <span data-testid="host-count">{room.players.length}/50</span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-8 p-8 lg:grid-cols-[1fr_2fr]">
        <section className="flex flex-col items-center justify-center gap-6 rounded-2xl bg-bg-secondary p-8 ring-1 ring-bg-tertiary">
          <p className="font-mono text-xs tracking-wider text-fg-muted">CÓDIGO DE SALA</p>
          <p
            data-testid="host-code"
            className="font-mono text-8xl font-medium tracking-[0.15em] text-fg-primary"
          >
            {code}
          </p>
          <div className="flex w-full flex-col gap-2">
            <p className="font-mono text-xs tracking-wider text-fg-muted">URL</p>
            <div className="rounded-full bg-bg-tertiary px-4 py-2 font-mono text-xs text-fg-secondary">
              <span className="block truncate">{playUrl}</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={onCopy}
              data-testid="host-copy"
              className="h-10"
            >
              {copied ? <Check size={16} /> : <Clipboard size={16} />}
              {copied ? "Copiado" : "Copiar URL"}
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl bg-bg-secondary p-8 ring-1 ring-bg-tertiary">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs tracking-wider text-fg-muted">
              JUGADORES CONECTADOS
            </p>
            <p className="font-mono text-xs text-accent-cyan">
              {room.players.length}/50
            </p>
          </div>

          {room.players.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-fg-muted">
              Comparte el código y la URL con los jugadores
            </div>
          ) : (
            <ul
              className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3"
              data-testid="host-player-list"
            >
              {room.players.map((p) => (
                <li
                  key={p.id}
                  data-testid={`host-player-${p.nickname}`}
                  className="flex items-center gap-3 rounded-xl bg-bg-tertiary p-3"
                >
                  <Rocket skin={p.rocketSkin as RocketSkin} size={24} />
                  <span className="truncate text-sm text-fg-primary">{p.nickname}</span>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            onClick={onStart}
            disabled={starting || room.players.length === 0}
            className="h-12 text-base"
            data-testid="host-start"
          >
            {starting ? "Iniciando…" : "Iniciar carrera"}
          </Button>
          {startError && (
            <p className="text-center text-sm text-rocket-red" role="alert">
              {startError}
            </p>
          )}
          {room.players.length === 0 && !startError && (
            <p className="text-center font-mono text-xs text-fg-muted">
              esperando al menos un jugador
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
