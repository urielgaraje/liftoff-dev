"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/game/code";

export default function LandingPage() {
  const router = useRouter();

  const [passphrase, setPassphrase] = useState("");
  const [hostError, setHostError] = useState<string | null>(null);
  const [hostBusy, setHostBusy] = useState(false);

  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setHostError(null);
    setHostBusy(true);
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 bg-bg-primary p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-accent-cyan">
          5 · 4 · 3 · 2 · 1
        </p>
        <h1 className="text-7xl font-bold tracking-tight text-fg-primary">Liftoff</h1>
        <p className="text-fg-secondary">Carrera de cohetes multijugador en directo</p>
        <p className="font-mono text-xs tracking-wide text-fg-muted">
          50 jugadores · 3 etapas · ~4 min
        </p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
        <form
          onSubmit={onCreate}
          aria-label="crear partida"
          className="flex flex-col gap-4 rounded-2xl bg-bg-secondary p-6 ring-1 ring-bg-tertiary"
        >
          <div>
            <p className="font-mono text-xs tracking-wider text-fg-muted">SOY HOST</p>
            <h2 className="mt-1 text-lg font-medium text-fg-primary">Crear partida</h2>
          </div>
          <Input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="passphrase"
            className="h-10"
            autoComplete="off"
            aria-label="passphrase de host"
            data-testid="host-passphrase"
          />
          <Button
            type="submit"
            disabled={!passphrase || hostBusy}
            data-testid="host-create"
            className="h-10"
          >
            {hostBusy ? "Creando…" : "Crear partida"}
          </Button>
          {hostError && (
            <p className="text-sm text-rocket-red" role="alert">
              {hostError}
            </p>
          )}
        </form>

        <form
          onSubmit={onJoin}
          aria-label="unirse a partida"
          className="flex flex-col gap-4 rounded-2xl bg-bg-secondary p-6 ring-1 ring-bg-tertiary"
        >
          <div>
            <p className="font-mono text-xs tracking-wider text-fg-muted">SOY JUGADOR</p>
            <h2 className="mt-1 text-lg font-medium text-fg-primary">Tengo un código</h2>
          </div>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="AB12"
            maxLength={4}
            className="h-10 text-center font-mono text-2xl tracking-[0.4em] uppercase"
            aria-label="código de sala"
            data-testid="join-code"
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={code.length !== 4}
            data-testid="join-submit"
            className="h-10"
          >
            Únete
          </Button>
          {joinError && (
            <p className="text-sm text-rocket-red" role="alert">
              {joinError}
            </p>
          )}
        </form>
      </div>

      <p className="font-mono text-xs text-fg-muted">
        Mejor experiencia en navegador desktop
      </p>
    </main>
  );
}
