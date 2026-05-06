"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
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

type Props = {
  code: string;
  alreadyJoined: boolean;
  playerId: string | null;
};

export type SelfPlayer = {
  id: string;
  nickname: string;
  rocketSkin: RocketSkin;
};

export function PlayClient({ code, alreadyJoined, playerId }: Props) {
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
      <main className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between p-6">
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="font-mono text-xs tracking-[0.3em] text-accent-cyan"
          >
            LIFTOFF
          </motion.p>
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

  return <JoinedView code={code} playerId={playerId} />;
}

function JoinedView({ code, playerId }: { code: string; playerId: string | null }) {
  const room = useRoomChannel(code);

  useEffect(() => {
    const onHide = () => {
      navigator.sendBeacon(`/api/room/${code}/leave`);
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [code]);

  const selfPlayer = useMemo<SelfPlayer | null>(() => {
    if (!playerId) return null;
    const p = room.players.find((x) => x.id === playerId);
    if (!p) return null;
    return {
      id: p.id,
      nickname: p.nickname,
      rocketSkin: p.rocketSkin as RocketSkin,
    };
  }, [playerId, room.players]);

  const selfRank = useMemo<number | null>(() => {
    if (!playerId) return null;
    const ranked = [...room.players].sort((a, b) => {
      const va = room.progress[a.id] ?? 0;
      const vb = room.progress[b.id] ?? 0;
      if (vb !== va) return vb - va;
      return a.nickname.localeCompare(b.nickname);
    });
    const idx = ranked.findIndex((x) => x.id === playerId);
    return idx >= 0 ? idx + 1 : null;
  }, [playerId, room.players, room.progress]);

  if (room.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
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
        selfPlayer={selfPlayer}
        selfRank={selfRank}
        totalPlayers={room.players.length}
      />
    );
  }

  if (room.status === "ended") {
    return (
      <EndedView code={code} lastEnded={room.lastEnded} selfPlayer={selfPlayer} />
    );
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
    <main className="flex min-h-screen flex-col" data-testid="lobby">
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="font-mono text-xs tracking-[0.3em] text-accent-cyan"
          >
            LIFTOFF
          </motion.p>
          <RoomBadge code={code} withDot />
        </div>
        <div className="rounded-full bg-bg-tertiary px-3 py-1.5 font-mono text-xs text-fg-secondary">
          {ready}/50 listos
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <div className="flex flex-col items-center gap-3">
          <motion.p
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="font-mono text-[10px] tracking-[0.4em] text-fg-muted"
          >
            DESTINO
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl font-medium tracking-tight text-fg-primary"
            style={{
              textShadow: "0 0 30px rgba(34,211,238,0.25)",
            }}
          >
            Planeta Liftoff
          </motion.h1>
          <div className="flex items-center gap-2">
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="size-1.5 rounded-full bg-accent-cyan"
              style={{ boxShadow: "0 0 10px var(--color-accent-cyan)" }}
            />
            <motion.p
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="font-mono text-xs tracking-[0.35em] text-accent-cyan"
            >
              PREPARANDO DESPEGUE
            </motion.p>
          </div>
        </div>

        <div className="w-full max-w-4xl">
          <p className="mb-3 font-mono text-xs tracking-wider text-fg-muted">
            COHETES EN PISTA · {ready}/50
          </p>
          <ul
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            data-testid="player-list"
          >
            {room.players.map((p, i) => (
              <motion.li
                key={p.id}
                data-testid={`player-${p.nickname}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut", delay: i * 0.04 }}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className="flex items-center gap-3 rounded-xl bg-bg-secondary p-3 ring-1 ring-bg-tertiary transition-shadow hover:shadow-[0_0_24px_rgba(34,211,238,0.18)]"
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    SKIN_BG_CLASS[p.rocketSkin as RocketSkin],
                    "bg-opacity-20",
                  )}
                >
                  <Rocket skin={p.rocketSkin as RocketSkin} size={22} animate />
                </span>
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    SKIN_TEXT_CLASS[p.rocketSkin as RocketSkin],
                  )}
                >
                  {p.nickname}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-xs text-fg-muted">esperando al host</p>
      </div>
    </main>
  );
}

const MEDAL_LABEL: Record<number, string> = {
  0: "ORO",
  1: "PLATA",
  2: "BRONCE",
};

const MEDAL_COLOR: Record<number, string> = {
  0: "text-accent-yellow",
  1: "text-fg-secondary",
  2: "text-rocket-orange",
};

function EndedView({
  code,
  lastEnded,
  selfPlayer,
}: {
  code: string;
  lastEnded: ReturnType<typeof useRoomChannel>["lastEnded"];
  selfPlayer: SelfPlayer | null;
}) {
  const board = lastEnded?.leaderboard ?? [];
  const top3 = board.slice(0, 3);
  const selfIndex = selfPlayer
    ? board.findIndex((p) => p.playerId === selfPlayer.id)
    : -1;
  const selfEntry = selfIndex >= 0 ? board[selfIndex] : null;
  const selfInTop3 = selfIndex >= 0 && selfIndex < 3;

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-10 p-8 text-center"
      data-testid="play-ended"
    >
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-2"
      >
        <p className="font-mono text-xs tracking-[0.5em] text-accent-cyan">
          PLANETA ALCANZADO
        </p>
        <h1 className="text-5xl font-medium tracking-tight text-fg-primary">
          Carrera completada
        </h1>
      </motion.div>

      {top3.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          <p className="font-mono text-[10px] tracking-[0.4em] text-fg-muted">
            TOP 3
          </p>
          <ul className="flex flex-col gap-2">
            {top3.map((p, i) => {
              const isSelf = selfPlayer?.id === p.playerId;
              return (
                <motion.li
                  key={p.playerId}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    delay: 0.25 + i * 0.12,
                  }}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl px-5 py-3 font-mono ring-1 backdrop-blur",
                    isSelf
                      ? "bg-bg-secondary ring-accent-cyan/60 shadow-[0_0_30px_rgba(34,211,238,0.18)]"
                      : "bg-bg-secondary/80 ring-bg-tertiary",
                  )}
                >
                  <span
                    className={cn(
                      "w-12 text-left text-[10px] tracking-[0.3em]",
                      MEDAL_COLOR[i],
                    )}
                  >
                    {MEDAL_LABEL[i]}
                  </span>
                  <span
                    className="relative inline-flex items-center justify-center"
                    style={{
                      filter: `drop-shadow(0 0 ${i === 0 ? 14 : 8}px var(--color-rocket-${p.rocketSkin}))`,
                    }}
                  >
                    <Rocket skin={p.rocketSkin} size={i === 0 ? 32 : 24} />
                  </span>
                  <span
                    className={cn(
                      "min-w-[8rem] text-left text-sm",
                      SKIN_TEXT_CLASS[p.rocketSkin as RocketSkin],
                    )}
                  >
                    {p.nickname}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-fg-secondary">
                    {p.value} m
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}

      {selfEntry && !selfInTop3 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.6 }}
          className="flex items-center gap-3 rounded-2xl bg-bg-secondary/80 px-5 py-3 font-mono ring-1 ring-bg-tertiary backdrop-blur"
        >
          <span className="text-[10px] tracking-[0.3em] text-fg-muted">
            TÚ
          </span>
          <Rocket skin={selfEntry.rocketSkin} size={20} />
          <span
            className={cn(
              "text-sm",
              SKIN_TEXT_CLASS[selfEntry.rocketSkin as RocketSkin],
            )}
          >
            {selfEntry.nickname}
          </span>
          <span className="text-xs tabular-nums text-fg-secondary">
            #{selfIndex + 1} · {selfEntry.value} m
          </span>
        </motion.div>
      )}

      <p className="font-mono text-[10px] tracking-[0.3em] text-fg-muted">
        SALA · {code}
      </p>
    </main>
  );
}
