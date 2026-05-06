"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TypingParagraph } from "./typing-paragraph";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SelfPlayer } from "@/app/play/play-client";

const PROGRESS_INTERVAL_MS = 500;
const ERROR_FLASH_MS = 150;

const STAGE_TABS: ReadonlyArray<{ index: number; label: string }> = [
  { index: 0, label: "Despegue" },
  { index: 1, label: "Órbita" },
  { index: 2, label: "Aproximación" },
];

type Props = {
  code: string;
  stageIndex: number;
  startedAt: string;
  durationMs: number;
  init: { paragraph: string };
  selfPlayer: SelfPlayer | null;
  selfRank: number | null;
  totalPlayers: number;
};

export function TypingStage({
  code,
  stageIndex,
  startedAt,
  durationMs,
  init,
  selfRank,
  totalPlayers,
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

  return (
    <main className="flex min-h-screen flex-col">
      <header className="grid grid-cols-[1fr_auto_1fr] items-start gap-6 px-10 py-8">
        <div />
        <div className="flex flex-col items-center gap-2">
          <p className="font-mono text-[10px] tracking-[0.4em] text-fg-muted">
            ETAPA
          </p>
          <div className="flex items-center gap-2 font-mono text-xs">
            {STAGE_TABS.map((t) => {
              const active = t.index === stageIndex;
              const done = t.index < stageIndex;
              return (
                <span
                  key={t.index}
                  className={cn(
                    "rounded-full px-3 py-1 ring-1 transition",
                    active &&
                      "bg-bg-secondary text-accent-yellow ring-accent-yellow/50",
                    done && "text-fg-secondary ring-bg-tertiary",
                    !active && !done && "text-fg-muted ring-bg-tertiary/60",
                  )}
                >
                  {t.label}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="font-mono text-[10px] tracking-[0.4em] text-fg-muted">
            POSICIÓN
          </p>
          <p
            className="font-mono text-base text-accent-magenta tabular-nums"
            data-testid="typing-altitude"
          >
            <span className="text-base">#{selfRank ?? "—"}</span>
            <span className="ml-1 text-fg-muted">de {totalPlayers}</span>
          </p>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-10">
        <div
          className="w-full max-w-4xl"
          data-testid="typing-stage"
        >
          <TypingParagraph
            paragraph={paragraph}
            cursor={cursor}
            errorFlash={errorFlash}
          />
        </div>
      </div>

      <footer className="flex flex-col items-center gap-3 px-10 py-10">
        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-[10px] tracking-[0.4em] text-fg-muted">
            QUEDAN
          </span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={remainingS}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "text-2xl tabular-nums",
                countdownColor,
              )}
              data-testid="typing-timer"
            >
              {remainingS}s
            </motion.span>
          </AnimatePresence>
        </div>
        <Button variant="ghost" disabled className="h-7 text-xs text-fg-muted">
          Abandonar
        </Button>
      </footer>
    </main>
  );
}
