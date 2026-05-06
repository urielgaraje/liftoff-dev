import type { StageModule } from "../types";
import { pickParagraph } from "./words";

const DEFAULT_DURATION_MS = 30_000;
const MAX_CHARS_PER_SECOND = 25;

function getDuration(): number {
  const override = process.env.STAGE_DURATION_OVERRIDE_MS;
  if (override) {
    const n = Number(override);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DEFAULT_DURATION_MS;
}

export type TypingInit = { paragraph: string };

export const typingStage: StageModule<TypingInit> = {
  id: "typing",
  get durationMs() {
    return getDuration();
  },
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
