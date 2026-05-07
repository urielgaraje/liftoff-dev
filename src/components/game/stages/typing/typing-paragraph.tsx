"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const VISIBLE_LINES = 3;
const LINE_HEIGHT_PX = 64;
const CURSOR_BAR_TOP_PX = 8;
const CURSOR_BAR_HEIGHT_PX = 40;
const CURSOR_BAR_WIDTH_PX = 3;

type Token = { kind: "word" | "space"; start: number; end: number };

export function TypingParagraph({
  paragraph,
  cursor,
  errorFlash,
}: {
  paragraph: string;
  cursor: number;
  errorFlash: boolean;
}) {
  const cursorRef = useRef<HTMLSpanElement>(null);
  const [scrollLine, setScrollLine] = useState(0);

  const tokens = useMemo<Token[]>(() => {
    const out: Token[] = [];
    let i = 0;
    while (i < paragraph.length) {
      if (paragraph[i] === " ") {
        let j = i;
        while (j < paragraph.length && paragraph[j] === " ") j++;
        out.push({ kind: "space", start: i, end: j });
        i = j;
      } else {
        let j = i;
        while (j < paragraph.length && paragraph[j] !== " ") j++;
        out.push({ kind: "word", start: i, end: j });
        i = j;
      }
    }
    return out;
  }, [paragraph]);

  useLayoutEffect(() => {
    const cursorEl = cursorRef.current;
    if (!cursorEl) return;
    const offsetTop = cursorEl.offsetTop;
    const currentLine = Math.round(offsetTop / LINE_HEIGHT_PX);
    const newScroll = Math.max(0, currentLine - 1);
    setScrollLine((prev) => (prev !== newScroll ? newScroll : prev));
  }, [cursor]);

  const renderCursor = (ch: string, key: React.Key) => (
    <span key={key} ref={cursorRef} style={{ position: "relative" }}>
      <motion.span
        aria-hidden
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0.55, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "pointer-events-none rounded-[2px]",
          errorFlash ? "bg-rocket-red" : "bg-accent-magenta",
        )}
        style={{
          position: "absolute",
          left: `-${CURSOR_BAR_WIDTH_PX + 1}px`,
          top: `${CURSOR_BAR_TOP_PX}px`,
          width: `${CURSOR_BAR_WIDTH_PX}px`,
          height: `${CURSOR_BAR_HEIGHT_PX}px`,
        }}
      />
      {ch}
    </span>
  );

  const renderTokens = () => {
    const nodes: React.ReactNode[] = [];
    for (const tok of tokens) {
      if (tok.kind === "space") {
        for (let i = tok.start; i < tok.end; i++) {
          if (i === cursor) {
            nodes.push(renderCursor(" ", `c-${i}`));
          } else if (i < cursor) {
            nodes.push(
              <span key={`s-${i}`} className="text-fg-primary">
                {" "}
              </span>,
            );
          } else {
            nodes.push(<span key={`s-${i}`}> </span>);
          }
        }
        continue;
      }

      const { start, end } = tok;

      if (end <= cursor) {
        nodes.push(
          <span
            key={`w-${start}`}
            className="text-fg-primary"
            style={{ display: "inline-block" }}
          >
            {paragraph.slice(start, end)}
          </span>,
        );
        continue;
      }

      if (start > cursor) {
        nodes.push(
          <span key={`w-${start}`} style={{ display: "inline-block" }}>
            {paragraph.slice(start, end)}
          </span>,
        );
        continue;
      }

      const typedPart = paragraph.slice(start, cursor);
      const cursorChar = paragraph[cursor];
      const restPart = paragraph.slice(cursor + 1, end);
      nodes.push(
        <span key={`w-${start}`} style={{ display: "inline-block" }}>
          {typedPart && (
            <span className="text-fg-primary">{typedPart}</span>
          )}
          {renderCursor(cursorChar, `c-${cursor}`)}
          {restPart && <span>{restPart}</span>}
        </span>,
      );
    }
    if (cursor >= paragraph.length) {
      nodes.push(renderCursor(" ", `c-end`));
    }
    return nodes;
  };

  return (
    <motion.div
      animate={errorFlash ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.22 }}
      className="relative overflow-hidden"
      style={{
        height: VISIBLE_LINES * LINE_HEIGHT_PX,
        maskImage:
          "linear-gradient(to bottom, transparent 0px, black 4px, black calc(100% - 4px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0px, black 4px, black calc(100% - 4px), transparent 100%)",
      }}
    >
      <motion.p
        animate={{ y: -scrollLine * LINE_HEIGHT_PX }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="text-center font-sans text-4xl font-medium tracking-tight text-fg-muted lg:text-[40px]"
        style={{ lineHeight: `${LINE_HEIGHT_PX}px` }}
      >
        {renderTokens()}
      </motion.p>
    </motion.div>
  );
}
