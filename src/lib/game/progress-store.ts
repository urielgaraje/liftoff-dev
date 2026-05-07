import "server-only";

type StageKey = string;

const store = new Map<StageKey, Map<string, number>>();

function key(code: string, stageIndex: number): StageKey {
  return `${code}:${stageIndex}`;
}

export function getValue(code: string, stageIndex: number, playerId: string): number {
  return store.get(key(code, stageIndex))?.get(playerId) ?? 0;
}

export function setValue(
  code: string,
  stageIndex: number,
  playerId: string,
  value: number,
): void {
  const k = key(code, stageIndex);
  let m = store.get(k);
  if (!m) {
    m = new Map();
    store.set(k, m);
  }
  const prev = m.get(playerId) ?? 0;
  if (value > prev) m.set(playerId, value);
}

export function getAllForStage(
  code: string,
  stageIndex: number,
): Map<string, number> {
  return store.get(key(code, stageIndex)) ?? new Map();
}

export function clearStage(code: string, stageIndex: number): void {
  store.delete(key(code, stageIndex));
}

export function clearRoom(code: string): void {
  for (const k of Array.from(store.keys())) {
    if (k.startsWith(`${code}:`)) store.delete(k);
  }
}
