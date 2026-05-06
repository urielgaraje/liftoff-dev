export interface ValidateProgressArgs {
  prev: number;
  next: number;
  elapsedMs: number;
}

export interface StageModule<Init = unknown> {
  id: string;
  durationMs: number;
  scoreMultiplier: number;
  buildInit(): Init;
  validateProgress(args: ValidateProgressArgs): boolean;
}

export type StageInit = unknown;
