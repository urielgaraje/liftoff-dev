"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const FLASH_DURATION_MS = 360;

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
          initial={{ backgroundColor: "rgba(52,211,153,0.28)" }}
          animate={{ backgroundColor: "rgba(52,211,153,0)" }}
          transition={{ duration: FLASH_DURATION_MS / 1000, ease: "easeOut" }}
          className="rounded-sm"
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
    <motion.p
      animate={errorFlash ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.22 }}
      className="text-center font-sans text-4xl font-medium leading-[1.55] tracking-tight text-fg-muted lg:text-[42px]"
    >
      <span className="text-fg-primary">{typedNodes}</span>
      <motion.span
        animate={{ opacity: [1, 0.45, 1] }}
        transition={{ duration: 0.95, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "rounded-[3px] bg-accent-magenta px-[3px] text-fg-primary",
          errorFlash && "bg-rocket-red",
        )}
      >
        {next || "·"}
      </motion.span>
      <span>{rest}</span>
    </motion.p>
  );
}
