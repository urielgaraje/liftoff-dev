import type { StageModule } from "../types";
import { pickParagraph } from "./words";

// Fallback duration for any code path that consults the module directly.
// The runtime source of truth is `room.stageDurationMs` (per-room).
const DEFAULT_DURATION_MS = 30_000;
const MAX_CHARS_PER_SECOND = 25;

export type TypingInit = { paragraph: string };

export const typingStage: StageModule<TypingInit> = {
  id: "typing",
  durationMs: DEFAULT_DURATION_MS,
  scoreMultiplier: 1,
  buildInit: () => ({ paragraph: pickParagraph() }),
  validateProgress: ({ prev, next, elapsedMs }) => {
    if (next < 0) return false;
    if (next < prev) return false;
    const delta = next - prev;
    const maxDelta = Math.ceil((elapsedMs / 1000) * MAX_CHARS_PER_SECOND) + 5;
    if (delta > maxDelta) return false;
    return true;
  },
};
