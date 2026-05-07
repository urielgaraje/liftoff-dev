"use client";

import type { ComponentType } from "react";
import { TypingStage } from "./typing/typing-stage";
import { UnknownStage } from "@/components/game/unknown-stage";
import type { SelfPlayer } from "@/app/play/play-client";
import type { PlayerSnapshot } from "@/lib/realtime/events";

export type StageRendererProps = {
  code: string;
  stageIndex: number;
  startedAt: string;
  durationMs: number;
  init: unknown;
  selfPlayer: SelfPlayer | null;
  players: PlayerSnapshot[];
  progress: Record<string, number>;
};

const RENDERERS: Record<string, ComponentType<StageRendererProps>> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typing: TypingStage as any,
};

export function StageRenderer({
  stageId,
  ...rest
}: StageRendererProps & { stageId: string }) {
  const Component = RENDERERS[stageId];
  if (!Component) return <UnknownStage stageId={stageId} />;
  return <Component {...rest} />;
}
