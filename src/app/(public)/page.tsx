"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rocket } from "@/components/game/rocket";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/game/code";

const NEON_CTA =
  "rounded-xl bg-accent-cyan font-bold text-bg-primary shadow-[0_0_24px_var(--color-accent-cyan)] hover:bg-accent-cyan/90";

const PULSE_RINGS: Array<{
  size: number;
  border: string;
  thickness: string;
  scale: number;
  opacity: number[];
  duration: number;
  delay: number;
}> = [
  { size: 280, border: "border-accent-cyan/20", thickness: "border", scale: 1.08, opacity: [0.15, 0.28, 0.15], duration: 3.6, delay: 0 },
  { size: 200, border: "border-accent-cyan/40", thickness: "border", scale: 1.1, opacity: [0.3, 0.5, 0.3], duration: 3, delay: 0.4 },
  { size: 140, border: "border-accent-cyan/55", thickness: "border-2", scale: 1.12, opacity: [0.45, 0.65, 0.45], duration: 2.6, delay: 0.8 },
];

function EyebrowPill({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent-cyan/70 px-3 py-1.5">
      <span className="size-1.5 rounded-full bg-accent-cyan shadow-[0_0_8px_var(--color-accent-cyan)]" />
      <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-accent-cyan">
        {children}
      </span>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const [hostOpen, setHostOpen] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [stageDurationS, setStageDurationS] = useState("30");
  const [maxPlayers, setMaxPlayers] = useState("50");
  const [hostError, setHostError] = useState<string | null>(null);
  const [hostBusy, setHostBusy] = useState(false);
  const [hostAuthed, setHostAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/host/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { authenticated: false }))
      .then((data: { authenticated?: boolean }) => {
        if (cancelled) return;
        setHostAuthed(Boolean(data.authenticated));
      })
      .catch(() => {
        if (cancelled) return;
        setHostAuthed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // open dialog when arriving via /?restart=1 from the host podium
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("restart") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHostOpen(true);
    }
  }, []);

  const onJoin = (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setJoinError("Código inválido (4 caracteres)");
      return;
    }
    setJoinError(null);
    router.push(`/play?code=${normalized}`);
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setHostError(null);

    const durationS = Number(stageDurationS);
    const maxN = Number(maxPlayers);
    if (!Number.isFinite(durationS) || durationS < 5 || durationS > 600) {
      setHostError("Duración entre 5 y 600 segundos");
      return;
    }
    if (!Number.isFinite(maxN) || maxN < 1 || maxN > 100) {
      setHostError("Jugadores entre 1 y 100");
      return;
    }

    setHostBusy(true);
    try {
      const payload: Record<string, unknown> = {
        stageDurationMs: Math.round(durationS * 1000),
        maxPlayers: maxN,
      };
      if (!hostAuthed) payload.passphrase = passphrase;

      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setHostError(body.error ?? "Error creando la partida");
        return;
      }
      router.push("/host");
    } catch {
      setHostError("Error de red");
    } finally {
      setHostBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <LandingScene />

      <div className="relative z-10 flex flex-1 items-center">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col px-12 lg:px-20">
          <header className="pt-10">
            <p className="font-mono text-sm font-bold tracking-[0.3em] text-fg-primary">
              LIFTOFF
            </p>
          </header>

          <div className="mt-20 flex max-w-[640px] flex-col">
            <motion.p
              animate={{ opacity: [0.65, 1, 0.65] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="font-mono text-xs font-bold tracking-[0.3em] text-accent-cyan"
            >
              T-MINUS  5 · 4 · 3 · 2 · 1
            </motion.p>

            <div className="mt-4">
              <EyebrowPill>EN DIRECTO  ·  MULTIJUGADOR</EyebrowPill>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mt-3 text-[clamp(96px,11vw,140px)] font-bold leading-none tracking-tight text-fg-primary"
            >
              Liftoff
            </motion.h1>

            <p className="mt-6 max-w-md text-2xl font-semibold text-fg-primary">
              Una carrera de cohetes en directo.
            </p>
            <p className="mt-1 max-w-md text-lg text-fg-secondary">
              50 jugadores · 3 etapas · ~4 minutos de pura velocidad.
            </p>

            <form
              onSubmit={onJoin}
              aria-label="unirse a partida"
              className="mt-10 flex items-center gap-3"
            >
              <Input
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().slice(0, 4))
                }
                placeholder="AB12"
                maxLength={4}
                className="h-[72px] w-[200px] rounded-xl border-bg-tertiary bg-bg-secondary px-4 text-center font-mono text-[28px] font-bold uppercase tracking-[0.4em] text-fg-primary placeholder:text-fg-muted"
                aria-label="código de sala"
                data-testid="join-code"
              />
              <Button
                type="submit"
                disabled={code.length !== 4}
                data-testid="join-submit"
                className={`h-[72px] w-[228px] text-base ${NEON_CTA}`}
              >
                Únete →
              </Button>
            </form>
            {joinError && (
              <p className="mt-3 text-sm text-rocket-red" role="alert">
                {joinError}
              </p>
            )}

            <button
              type="button"
              onClick={() => setHostOpen(true)}
              data-testid="host-open"
              className="mt-8 self-start text-sm font-medium text-accent-cyan transition-opacity hover:opacity-80"
            >
              ¿Eres host? Crea una partida →
            </button>

            <p className="mt-6 font-mono text-[11px] font-bold tracking-[0.28em] text-fg-muted">
              SIN INSTALACIÓN   ·   REALTIME   ·   DESKTOP
            </p>
          </div>
        </div>
      </div>

      <p className="pointer-events-none absolute right-12 bottom-6 z-10 font-mono text-[11px] text-fg-muted">
        Mejor experiencia en navegador desktop
      </p>

      <Dialog open={hostOpen} onOpenChange={setHostOpen}>
        <DialogContent className="gap-3 bg-bg-secondary p-8 ring-bg-tertiary sm:max-w-[480px]">
          <DialogHeader className="gap-2">
            <EyebrowPill>SOY HOST</EyebrowPill>
            <DialogTitle className="text-3xl font-bold text-fg-primary">
              Crear partida
            </DialogTitle>
            <DialogDescription className="text-fg-secondary">
              Introduce la passphrase del host para activar la sala.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={onCreate}
            aria-label="crear partida"
            className="mt-2 flex flex-col gap-3"
          >
            {!hostAuthed && (
              <>
                <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-fg-muted">
                  PASSPHRASE
                </p>
                <Input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="••••••••"
                  className="h-[52px] rounded-[10px] border-bg-tertiary bg-bg-tertiary px-4 font-mono text-base text-fg-primary"
                  autoComplete="off"
                  autoFocus
                  aria-label="passphrase de host"
                  data-testid="host-passphrase"
                />
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="stage-duration"
                  className="font-mono text-[11px] font-bold tracking-[0.2em] text-fg-muted"
                >
                  DURACIÓN (s)
                </label>
                <Input
                  id="stage-duration"
                  type="number"
                  min={5}
                  max={600}
                  value={stageDurationS}
                  onChange={(e) => setStageDurationS(e.target.value)}
                  className="h-[52px] rounded-[10px] border-bg-tertiary bg-bg-tertiary px-4 font-mono text-base text-fg-primary"
                  aria-label="duración del stage en segundos"
                  data-testid="host-duration"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="max-players"
                  className="font-mono text-[11px] font-bold tracking-[0.2em] text-fg-muted"
                >
                  JUGADORES MÁX
                </label>
                <Input
                  id="max-players"
                  type="number"
                  min={1}
                  max={100}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className="h-[52px] rounded-[10px] border-bg-tertiary bg-bg-tertiary px-4 font-mono text-base text-fg-primary"
                  aria-label="número máximo de jugadores"
                  data-testid="host-max-players"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={(!hostAuthed && !passphrase) || hostBusy}
              data-testid="host-create"
              className={`h-[56px] text-base ${NEON_CTA}`}
            >
              {hostBusy ? "Creando…" : "Crear partida →"}
            </Button>
            {hostError && (
              <p className="text-sm text-rocket-red" role="alert">
                {hostError}
              </p>
            )}
            <p className="text-xs text-fg-muted">
              {hostAuthed
                ? "Sesión de host activa. No hace falta passphrase."
                : "La passphrase la define HOST_PASSPHRASE del entorno."}
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function LandingScene() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute -top-[280px] -right-[200px] size-[640px]">
        <motion.div
          className="absolute -inset-10 rounded-full border border-accent-cyan/35"
          animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.02, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 38% 35%, #14B8A6 0%, #0F766E 55%, #064E3B 100%)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 78% 50%, transparent 48%, var(--color-bg-primary) 100%)",
            opacity: 0.7,
          }}
        />
      </div>

      <div className="absolute right-[6%] top-1/2 -translate-y-1/2 lg:right-[10%]">
        <div className="relative">
          {PULSE_RINGS.map((r, i) => (
            <motion.div
              key={i}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${r.thickness} ${r.border}`}
              style={{ width: r.size, height: r.size }}
              animate={{ scale: [1, r.scale, 1], opacity: r.opacity }}
              transition={{
                duration: r.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: r.delay,
              }}
            />
          ))}
          <Rocket skin="cyan" size={200} animate intensity={1.2} />
        </div>

        <div className="absolute -left-44 top-12 opacity-90">
          <Rocket skin="magenta" size={80} animate intensity={0.8} />
        </div>
        <div className="absolute -right-32 top-32 opacity-80">
          <Rocket skin="yellow" size={64} animate intensity={0.7} />
        </div>
      </div>
    </div>
  );
}
