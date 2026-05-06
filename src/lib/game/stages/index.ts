import { typingStage } from "./typing/typing";
import type { StageModule } from "./types";

export const STAGES: StageModule[] = [typingStage];

export function getStage(index: number): StageModule | null {
  if (index < 0 || index >= STAGES.length) return null;
  return STAGES[index];
}

export function totalStages(): number {
  return STAGES.length;
}

export type { StageModule } from "./types";
