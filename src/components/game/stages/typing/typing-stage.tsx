"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TypingParagraph } from "./typing-paragraph";
import { AltitudeMeter } from "./altitude-meter";
import { Rocket } from "@/components/game/rocket";
import { cn } from "@/lib/utils";
import {
  SKIN_BG_CLASS,
  SKIN_TEXT_CLASS,
  type RocketSkin,
} from "@/lib/game/skins";
import type { SelfPlayer } from "@/app/play/play-client";

const PROGRESS_INTERVAL_MS = 500;
const ERROR_FLASH_MS = 150;

type Props = {
  code: string;
  stageIndex: number;
  startedAt: string;
  durationMs: number;
  init: { paragraph: string };
  selfPlayer: SelfPlayer | null;
};

export function TypingStage({
  code,
  stageIndex,
  startedAt,
  durationMs,
  init,
  selfPlayer,
}: Props) {
  const paragraph = init.paragraph;
  const startMs = new Date(startedAt).getTime();

  const [cursor, setCursor] = useState(0);
  const [errorFlash, setErrorFlash] = useState(false);
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, durationMs - (Date.now() - startMs)),
  );

  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const lastSentRef = useRef(0);
  const flashTimerRef = useRef<number | null>(null);
  const sendTimerRef = useRef<number | null>(null);
  const endedRef = useRef(false);

  const sendProgress = useCallback(
    (force = false) => {
      const value = cursorRef.current;
      if (!force && value === lastSentRef.current) return;
      lastSentRef.current = value;
      void fetch(`/api/room/${code}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageIndex, value }),
      }).catch(() => {});
    },
    [code, stageIndex],
  );

  const finishStage = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    sendProgress(true);
    void fetch(`/api/room/${code}/end-stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageIndex }),
    }).catch(() => {});
  }, [code, stageIndex, sendProgress]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (endedRef.current) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      e.preventDefault();
      const expected = paragraph[cursorRef.current];
      if (expected === undefined) return;
      if (e.key === expected) {
        setCursor((c) => c + 1);
      } else {
        setErrorFlash(true);
        if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
        flashTimerRef.current = window.setTimeout(
          () => setErrorFlash(false),
          ERROR_FLASH_MS,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    };
  }, [paragraph]);

  useEffect(() => {
    sendTimerRef.current = window.setInterval(
      () => sendProgress(),
      PROGRESS_INTERVAL_MS,
    );
    return () => {
      if (sendTimerRef.current) window.clearInterval(sendTimerRef.current);
    };
  }, [sendProgress]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const left = Math.max(0, durationMs - (Date.now() - startMs));
      setRemainingMs(left);
      if (left === 0) {
        finishStage();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [durationMs, startMs, finishStage]);

  const remainingS = Math.ceil(remainingMs / 1000);
  const countdownColor =
    remainingS <= 5
      ? "text-rocket-red"
      : remainingS <= 10
        ? "text-accent-magenta"
        : "text-accent-cyan";
  const ratio = paragraph.length > 0 ? cursor / paragraph.length : 0;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-bg-tertiary/60 px-8 py-5">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-bg-secondary/70 px-3 py-1 font-mono text-[10px] tracking-[0.35em] text-accent-cyan ring-1 ring-bg-tertiary backdrop-blur">
            STAGE 1 · DESPEGUE
          </span>
        </div>
        <AnimatePresence mode="popLayout">
          <motion.p
            key={remainingS}
            initial={{ opacity: 0, y: -8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cn(
              "font-mono text-5xl font-medium tabular-nums tracking-tight transition-colors",
              countdownColor,
            )}
            data-testid="typing-timer"
          >
            {remainingS}s
          </motion.p>
        </AnimatePresence>
        <div className="flex items-center gap-3">
          <motion.span
            key={cursor}
            initial={{ y: -4, opacity: 0.6, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="rounded-full bg-bg-secondary/70 px-3 py-1.5 font-mono text-xs text-fg-secondary tabular-nums ring-1 ring-bg-tertiary backdrop-blur"
            data-testid="typing-altitude"
          >
            <span className="text-accent-cyan">{cursor}</span>
            <span className="ml-1 text-fg-muted">m</span>
          </motion.span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-8 py-10">
        <div
          className="flex w-full max-w-5xl flex-col gap-5"
          data-testid="typing-stage"
        >
          <TypingParagraph
            paragraph={paragraph}
            cursor={cursor}
            errorFlash={errorFlash}
          />
          <p className="text-center font-mono text-xs tracking-wider text-fg-muted">
            teclea para subir · errores no atraviesan
          </p>
        </div>
      </div>

      <footer className="flex items-end justify-between gap-6 px-8 py-6">
        <div className="flex items-center gap-3">
          {selfPlayer ? (
            <>
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg ring-1 ring-bg-tertiary",
                  SKIN_BG_CLASS[selfPlayer.rocketSkin],
                  "bg-opacity-25",
                )}
              >
                <Rocket skin={selfPlayer.rocketSkin} size={20} />
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] tracking-[0.3em] text-fg-muted">
                  TÚ
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    SKIN_TEXT_CLASS[selfPlayer.rocketSkin],
                  )}
                >
                  {selfPlayer.nickname}
                </span>
              </div>
            </>
          ) : (
            <span className="font-mono text-[10px] tracking-[0.3em] text-fg-muted">
              EN PISTA
            </span>
          )}
        </div>
        <AltitudeMeter
          ratio={ratio}
          skin={(selfPlayer?.rocketSkin ?? "cyan") as RocketSkin}
        />
      </footer>
    </main>
  );
}
