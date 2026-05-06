"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Rocket } from "@/components/game/rocket";
import { RoomBadge } from "@/components/shared/room-badge";
import { StageRenderer } from "@/components/game/stages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ROCKET_SKINS,
  SKIN_BG_CLASS,
  SKIN_TEXT_CLASS,
  type RocketSkin,
} from "@/lib/game/skins";
import { useRoomChannel } from "@/lib/realtime/use-room-channel";
import { cn } from "@/lib/utils";

type Local = "pre-join" | "joined";

type Props = { code: string; alreadyJoined: boolean };

export function PlayClient({ code, alreadyJoined }: Props) {
  const [local, setLocal] = useState<Local>(alreadyJoined ? "joined" : "pre-join");
  const [nickname, setNickname] = useState("");
  const [skin, setSkin] = useState<RocketSkin>("cyan");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onJoin = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length < 1 || trimmed.length > 24) {
      setError("Nickname entre 1 y 24 caracteres");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/room/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed, rocketSkin: skin }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Error al unirte");
        return;
      }
      setLocal("joined");
    } catch {
      setError("Error de red");
    } finally {
      setBusy(false);
    }
  };

  if (local === "pre-join") {
    return (
      <main className="flex min-h-screen flex-col bg-bg-primary">
        <header className="flex items-center justify-between p-6">
          <p className="font-mono text-xs tracking-[0.3em] text-accent-cyan">LIFTOFF</p>
          <RoomBadge code={code} />
        </header>

        <div className="flex flex-1 items-center justify-center p-8">
          <form
            onSubmit={onJoin}
            aria-label="unirse a la carrera"
            className="flex w-full max-w-md flex-col gap-6 rounded-2xl bg-bg-secondary p-8 ring-1 ring-bg-tertiary"
          >
            <div>
              <h1 className="text-2xl font-medium text-fg-primary">Únete a la carrera</h1>
              <p className="mt-1 text-sm text-fg-secondary">Esperando al host</p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="nickname"
                className="font-mono text-xs tracking-wider text-fg-muted"
              >
                TU NICKNAME
              </label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="cómo te llaman"
                maxLength={24}
                className="h-10"
                autoFocus
                data-testid="nickname-input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-mono text-xs tracking-wider text-fg-muted">
                ELIGE TU COHETE
              </p>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="skin">
                {ROCKET_SKINS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={skin === s}
                    data-testid={`skin-${s}`}
                    onClick={() => setSkin(s)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-xl bg-bg-tertiary transition",
                      "ring-2 ring-transparent hover:bg-bg-tertiary/70",
                      skin === s && "ring-accent-cyan",
                    )}
                  >
                    <Rocket skin={s} size={28} />
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={busy || nickname.trim().length === 0}
              className="h-10"
              data-testid="join-rocket"
            >
              {busy ? "Despegando…" : "Despegar"}
            </Button>
            {error && (
              <p className="text-sm text-rocket-red" role="alert">
                {error}
              </p>
            )}
          </form>
        </div>
      </main>
    );
  }

  return <JoinedView code={code} />;
}

function JoinedView({ code }: { code: string }) {
  const room = useRoomChannel(code);

  useEffect(() => {
    const onHide = () => {
      navigator.sendBeacon(`/api/room/${code}/leave`);
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [code]);

  if (room.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="font-mono text-xs text-fg-muted">cargando…</p>
      </main>
    );
  }

  if (room.status === "racing" && room.stage) {
    return (
      <StageRenderer
        code={code}
        stageId={room.stage.stageId}
        stageIndex={room.stage.stageIndex}
        startedAt={room.stage.startedAt}
        durationMs={room.stage.durationMs}
        init={room.stage.init}
      />
    );
  }

  if (room.status === "ended") {
    return <EndedView code={code} lastEnded={room.lastEnded} />;
  }

  return <LobbyView code={code} room={room} />;
}

function LobbyView({
  code,
  room,
}: {
  code: string;
  room: ReturnType<typeof useRoomChannel>;
}) {
  const ready = room.players.length;

  return (
    <main className="flex min-h-screen flex-col bg-bg-primary" data-testid="lobby">
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <p className="font-mono text-xs tracking-[0.3em] text-accent-cyan">LIFTOFF</p>
          <RoomBadge code={code} withDot />
        </div>
        <div className="rounded-full bg-bg-tertiary px-3 py-1.5 font-mono text-xs text-fg-secondary">
          {ready}/50 listos
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <div className="flex flex-col items-center gap-2">
          <p className="font-mono text-xs tracking-wider text-fg-muted">DESTINO</p>
          <h1 className="text-3xl font-medium text-fg-primary">Planeta Liftoff</h1>
          <p className="font-mono text-xs tracking-wider text-accent-cyan">
            PREPARANDO DESPEGUE
          </p>
        </div>

        <div className="w-full max-w-4xl">
          <p className="mb-3 font-mono text-xs tracking-wider text-fg-muted">
            COHETES EN PISTA · {ready}/50
          </p>
          <ul
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            data-testid="player-list"
          >
            {room.players.map((p) => (
              <li
                key={p.id}
                data-testid={`player-${p.nickname}`}
                className="flex items-center gap-3 rounded-xl bg-bg-secondary p-3 ring-1 ring-bg-tertiary"
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    SKIN_BG_CLASS[p.rocketSkin as RocketSkin],
                    "bg-opacity-20",
                  )}
                >
                  <Rocket skin={p.rocketSkin as RocketSkin} size={20} />
                </span>
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    SKIN_TEXT_CLASS[p.rocketSkin as RocketSkin],
                  )}
                >
                  {p.nickname}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-xs text-fg-muted">esperando al host</p>
      </div>
    </main>
  );
}

function EndedView({
  code,
  lastEnded,
}: {
  code: string;
  lastEnded: ReturnType<typeof useRoomChannel>["lastEnded"];
}) {
  const top3 = lastEnded?.leaderboard.slice(0, 3) ?? [];

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-primary p-8 text-center"
      data-testid="play-ended"
    >
      <p className="font-mono text-xs tracking-[0.4em] text-accent-cyan">
        PLANETA ALCANZADO
      </p>
      <h1 className="text-4xl font-medium text-fg-primary">Carrera completada</h1>

      {top3.length > 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-bg-secondary p-6 ring-1 ring-bg-tertiary">
          <p className="font-mono text-xs tracking-wider text-fg-muted">TOP 3</p>
          <ul className="flex flex-col gap-1 text-left">
            {top3.map((p, i) => (
              <li
                key={p.playerId}
                className="flex items-center gap-3 font-mono text-sm"
              >
                <span className="w-6 text-fg-muted">#{i + 1}</span>
                <Rocket skin={p.rocketSkin} size={16} />
                <span className="text-fg-primary">{p.nickname}</span>
                <span className="text-fg-secondary">— {p.value} m</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="font-mono text-xs text-fg-muted">
        Sala {code} · podio completo en slice posterior
      </p>
    </main>
  );
}
