import "server-only";

type StageKey = string;

const store = new Map<StageKey, Map<string, number>>();
const activeStages = new Set<StageKey>();

function key(code: string, stageIndex: number): StageKey {
  return `${code}:${stageIndex}`;
}

export function activateStage(code: string, stageIndex: number): void {
  activeStages.add(key(code, stageIndex));
}

export function deactivateStage(code: string, stageIndex: number): void {
  activeStages.delete(key(code, stageIndex));
}

export function isStageActive(code: string, stageIndex: number): boolean {
  return activeStages.has(key(code, stageIndex));
}

export function getValue(code: string, stageIndex: number, playerId: string): number {
  return store.get(key(code, stageIndex))?.get(playerId) ?? 0;
}

// Returns true if the value was accepted (stage active + monotonic), false if dropped.
export function setValue(
  code: string,
  stageIndex: number,
  playerId: string,
  value: number,
): boolean {
  const k = key(code, stageIndex);
  if (!activeStages.has(k)) return false;
  let m = store.get(k);
  if (!m) {
    m = new Map();
    store.set(k, m);
  }
  const prev = m.get(playerId) ?? 0;
  if (value > prev) m.set(playerId, value);
  return true;
}

export function getAllForStage(
  code: string,
  stageIndex: number,
): Map<string, number> {
  return store.get(key(code, stageIndex)) ?? new Map();
}

export function clearStage(code: string, stageIndex: number): void {
  store.delete(key(code, stageIndex));
  activeStages.delete(key(code, stageIndex));
}

export function clearRoom(code: string): void {
  for (const k of Array.from(store.keys())) {
    if (k.startsWith(`${code}:`)) store.delete(k);
  }
  for (const k of Array.from(activeStages)) {
    if (k.startsWith(`${code}:`)) activeStages.delete(k);
  }
}
