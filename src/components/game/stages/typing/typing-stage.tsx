"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TypingParagraph } from "./typing-paragraph";
import { Button } from "@/components/ui/button";

const PROGRESS_INTERVAL_MS = 500;
const ERROR_FLASH_MS = 150;

type Props = {
  code: string;
  stageIndex: number;
  startedAt: string;
  durationMs: number;
  init: { paragraph: string };
};

export function TypingStage({
  code,
  stageIndex,
  startedAt,
  durationMs,
  init,
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

  return (
    <main className="flex min-h-screen flex-col bg-bg-primary">
      <header className="flex items-center justify-between border-b border-bg-tertiary p-6">
        <div className="flex items-center gap-3">
          <p className="font-mono text-xs tracking-[0.3em] text-accent-cyan">
            STAGE 1 · DESPEGUE
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="rounded-full bg-bg-tertiary px-3 py-1.5 font-mono text-xs text-fg-secondary"
            data-testid="typing-altitude"
          >
            {cursor} m
          </div>
          <div
            className="rounded-full bg-bg-tertiary px-3 py-1.5 font-mono text-xs text-fg-secondary"
            data-testid="typing-timer"
          >
            QUEDAN {remainingS}s
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex w-full max-w-4xl flex-col gap-4" data-testid="typing-stage">
          <TypingParagraph
            paragraph={paragraph}
            cursor={cursor}
            errorFlash={errorFlash}
          />
          <p className="text-center font-mono text-xs text-fg-muted">
            teclea para subir · errores no cuentan ni se atraviesan
          </p>
        </div>
      </div>

      <footer className="flex items-center justify-end p-6">
        <Button variant="ghost" disabled className="h-9">
          Abandonar
        </Button>
      </footer>
    </main>
  );
}
