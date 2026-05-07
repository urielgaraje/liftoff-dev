export type StatusBucket = "2xx" | "4xx" | "5xx" | "network";

export type Metrics = {
  progressLatenciesMs: number[];
  broadcastLagsMs: number[];
  statusCounts: Record<StatusBucket, number>;
  joinFailures: number;
  pusherSubscribeFailures: number;
  startedAt: number;
  endedAt: number | null;
};

export function createMetrics(): Metrics {
  return {
    progressLatenciesMs: [],
    broadcastLagsMs: [],
    statusCounts: { "2xx": 0, "4xx": 0, "5xx": 0, network: 0 },
    joinFailures: 0,
    pusherSubscribeFailures: 0,
    startedAt: Date.now(),
    endedAt: null,
  };
}

export function recordProgress(m: Metrics, latencyMs: number, status: number | null): void {
  m.progressLatenciesMs.push(latencyMs);
  m.statusCounts[bucketize(status)] += 1;
}

export function recordBroadcastLag(m: Metrics, lagMs: number): void {
  m.broadcastLagsMs.push(lagMs);
}

function bucketize(status: number | null): StatusBucket {
  if (status === null) return "network";
  if (status >= 500) return "5xx";
  if (status >= 400) return "4xx";
  return "2xx";
}

export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.floor((p / 100) * sortedAsc.length),
  );
  return sortedAsc[idx];
}

export type Summary = {
  progress: { count: number; p50: number; p95: number; p99: number; max: number };
  broadcast: { count: number; p50: number; p95: number; p99: number; max: number };
  errorRate: number;
  statusCounts: Record<StatusBucket, number>;
  joinFailures: number;
  pusherSubscribeFailures: number;
  durationMs: number;
};

export function summarize(m: Metrics): Summary {
  const progress = [...m.progressLatenciesMs].sort((a, b) => a - b);
  const lag = [...m.broadcastLagsMs].sort((a, b) => a - b);
  const total =
    m.statusCounts["2xx"] +
    m.statusCounts["4xx"] +
    m.statusCounts["5xx"] +
    m.statusCounts.network;
  const errors = m.statusCounts["5xx"] + m.statusCounts.network;
  return {
    progress: {
      count: progress.length,
      p50: percentile(progress, 50),
      p95: percentile(progress, 95),
      p99: percentile(progress, 99),
      max: progress[progress.length - 1] ?? 0,
    },
    broadcast: {
      count: lag.length,
      p50: percentile(lag, 50),
      p95: percentile(lag, 95),
      p99: percentile(lag, 99),
      max: lag[lag.length - 1] ?? 0,
    },
    errorRate: total === 0 ? 0 : errors / total,
    statusCounts: m.statusCounts,
    joinFailures: m.joinFailures,
    pusherSubscribeFailures: m.pusherSubscribeFailures,
    durationMs: (m.endedAt ?? Date.now()) - m.startedAt,
  };
}
