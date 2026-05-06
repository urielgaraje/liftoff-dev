"use client";

import { cn } from "@/lib/utils";

export function TypingParagraph({
  paragraph,
  cursor,
  errorFlash,
}: {
  paragraph: string;
  cursor: number;
  errorFlash: boolean;
}) {
  const typed = paragraph.slice(0, cursor);
  const next = paragraph[cursor] ?? "";
  const rest = paragraph.slice(cursor + 1);

  return (
    <div
      className={cn(
        "rounded-2xl border-l-4 border-accent-magenta bg-bg-secondary p-8 ring-1 ring-bg-tertiary transition-colors",
        errorFlash && "border-rocket-red ring-rocket-red/40",
      )}
    >
      <p className="font-mono text-2xl leading-relaxed text-fg-muted">
        <span className="text-accent-cyan">{typed}</span>
        <span
          className={cn(
            "rounded-sm bg-accent-magenta/40 text-fg-primary",
            errorFlash && "bg-rocket-red/60",
          )}
        >
          {next || "·"}
        </span>
        <span>{rest}</span>
      </p>
    </div>
  );
}
