"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "lobby" | "stage" | "ended";

type Props = {
  phase: Phase;
  stageIndex?: number | null;
};

const LOBBY_TRACK = "/music/lobby.mp3";
const STAGE_TRACKS = [
  "/music/last_sector_run_2.mp3",
  "/music/lunar_base_jump_1.mp3",
  "/music/vector_decendent_3.mp3",
];
const MUTED_KEY = "liftoff:music:muted";
const LOBBY_VOLUME = 0.4;
const STAGE_VOLUME = 0.35;

function pickStageTrack() {
  return STAGE_TRACKS[Math.floor(Math.random() * STAGE_TRACKS.length)];
}

export function BackgroundMusic({ phase, stageIndex = null }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // hydrate from localStorage post-mount to avoid SSR mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuted(window.localStorage.getItem(MUTED_KEY) === "1");
  }, []);

  const stageTrack = useMemo(() => {
    void stageIndex;
    return phase === "stage" ? pickStageTrack() : null;
  }, [phase, stageIndex]);

  const currentSrc =
    phase === "lobby" ? LOBBY_TRACK : phase === "stage" ? stageTrack : null;
  const targetVolume = phase === "stage" ? STAGE_VOLUME : LOBBY_VOLUME;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = targetVolume;

    if (!currentSrc) {
      audio.pause();
      return;
    }

    const absoluteSrc = new URL(currentSrc, window.location.origin).href;
    if (audio.src !== absoluteSrc) {
      audio.src = currentSrc;
      audio.load();
    }

    let cancelled = false;
    let unlock: (() => void) | null = null;

    const tryPlay = () => {
      if (cancelled) return;
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          if (cancelled || unlock) return;
          const handler = () => {
            unlock?.();
            audio.play().catch(() => {});
          };
          unlock = () => {
            document.removeEventListener("pointerdown", handler);
            document.removeEventListener("keydown", handler);
            unlock = null;
          };
          document.addEventListener("pointerdown", handler, { once: true });
          document.addEventListener("keydown", handler, { once: true });
        });
      }
    };

    tryPlay();

    return () => {
      cancelled = true;
      unlock?.();
    };
  }, [currentSrc, targetVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
  }, [muted]);

  const onToggle = () => {
    setMuted((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MUTED_KEY, next ? "1" : "0");
      }
      return next;
    });
  };

  return (
    <>
      <audio ref={audioRef} loop preload="auto" aria-hidden />
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={muted}
        aria-label={muted ? "reactivar música" : "silenciar música"}
        data-testid="music-toggle"
        className={cn(
          "fixed bottom-4 right-4 z-40 flex size-10 items-center justify-center rounded-full",
          "bg-bg-secondary/80 text-fg-secondary ring-1 ring-bg-tertiary backdrop-blur",
          "transition hover:bg-bg-tertiary hover:text-fg-primary",
        )}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </>
  );
}
