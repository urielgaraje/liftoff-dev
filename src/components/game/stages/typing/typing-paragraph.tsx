"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const FLASH_DURATION_MS = 380;

export function TypingParagraph({
  paragraph,
  cursor,
  errorFlash,
}: {
  paragraph: string;
  cursor: number;
  errorFlash: boolean;
}) {
  const [flashRange, setFlashRange] = useState<[number, number] | null>(null);
  const prevCursorRef = useRef(cursor);

  useEffect(() => {
    const prev = prevCursorRef.current;
    prevCursorRef.current = cursor;
    if (cursor <= prev) return;
    if (paragraph[cursor - 1] !== " ") return;
    let start = cursor - 2;
    while (start >= 0 && paragraph[start] !== " ") start--;
    start++;
    if (start >= cursor - 1) return;
    setFlashRange([start, cursor - 1]);
    const id = window.setTimeout(() => setFlashRange(null), FLASH_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [cursor, paragraph]);

  const next = paragraph[cursor] ?? "";
  const rest = paragraph.slice(cursor + 1);

  let typedNodes: React.ReactNode;
  if (flashRange) {
    const [fs, fe] = flashRange;
    typedNodes = (
      <>
        <span>{paragraph.slice(0, fs)}</span>
        <motion.span
          key={`${fs}-${fe}`}
          initial={{ backgroundColor: "rgba(52,211,153,0.4)" }}
          animate={{ backgroundColor: "rgba(52,211,153,0)" }}
          transition={{ duration: FLASH_DURATION_MS / 1000, ease: "easeOut" }}
          className="rounded-sm px-0.5"
        >
          {paragraph.slice(fs, fe)}
        </motion.span>
        <span>{paragraph.slice(fe, cursor)}</span>
      </>
    );
  } else {
    typedNodes = paragraph.slice(0, cursor);
  }

  return (
    <motion.div
      animate={errorFlash ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.22 }}
      className={cn(
        "rounded-2xl border-l-4 border-accent-magenta bg-gradient-to-b from-bg-secondary to-bg-tertiary p-10 ring-2 ring-accent-cyan/30 shadow-[0_0_60px_rgba(34,211,238,0.12)] transition-colors",
        errorFlash && "border-rocket-red ring-rocket-red/50",
      )}
    >
      <p className="font-mono text-2xl leading-relaxed text-fg-muted">
        <span className="text-accent-cyan">{typedNodes}</span>
        <motion.span
          animate={{ opacity: [1, 0.45, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "rounded-sm bg-accent-magenta/55 px-0.5 text-fg-primary",
            "shadow-[0_0_14px_rgba(236,72,153,0.9)]",
            errorFlash &&
              "bg-rocket-red/70 shadow-[0_0_14px_rgba(248,113,113,0.9)]",
          )}
        >
          {next || "·"}
        </motion.span>
        <span>{rest}</span>
      </p>
    </motion.div>
  );
}
