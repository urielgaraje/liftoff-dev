import type { Summary } from "./metrics";

export type Thresholds = {
  errorRateMax: number;
  progressP95MaxMs: number;
  broadcastP95MaxMs: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  errorRateMax: 0.01,
  progressP95MaxMs: 800,
  broadcastP95MaxMs: 1000,
};

export type Verdict = {
  pass: boolean;
  failures: string[];
};

export function judge(summary: Summary, t: Thresholds = DEFAULT_THRESHOLDS): Verdict {
  const failures: string[] = [];
  if (summary.errorRate > t.errorRateMax) {
    failures.push(
      `error rate ${(summary.errorRate * 100).toFixed(2)}% > ${(t.errorRateMax * 100).toFixed(2)}%`,
    );
  }
  if (summary.progress.p95 > t.progressP95MaxMs) {
    failures.push(`progress p95 ${summary.progress.p95}ms > ${t.progressP95MaxMs}ms`);
  }
  if (summary.broadcast.p95 > t.broadcastP95MaxMs) {
    failures.push(`broadcast p95 ${summary.broadcast.p95}ms > ${t.broadcastP95MaxMs}ms`);
  }
  return { pass: failures.length === 0, failures };
}

export function printReport(
  summary: Summary,
  config: { playerCount: number; browserCount: number; stageDurationMs: number; baseUrl: string },
  verdict: Verdict,
): void {
  const line = "─".repeat(72);
  const out: string[] = [];
  out.push("");
  out.push(line);
  out.push("  LIFTOFF LOAD TEST — RESULTADO");
  out.push(line);
  out.push(`  base url        ${config.baseUrl}`);
  out.push(`  jugadores       ${config.playerCount} (${config.browserCount} browsers + ${config.playerCount - config.browserCount} headless)`);
  out.push(`  stage duration  ${config.stageDurationMs}ms`);
  out.push(`  duración total  ${(summary.durationMs / 1000).toFixed(1)}s`);
  out.push("");
  out.push("  POST /progress");
  out.push(`    samples       ${summary.progress.count}`);
  out.push(`    p50 / p95     ${summary.progress.p50}ms / ${summary.progress.p95}ms`);
  out.push(`    p99 / max     ${summary.progress.p99}ms / ${summary.progress.max}ms`);
  out.push("");
  out.push("  Pusher broadcast lag (server publish → client recv)");
  out.push(`    samples       ${summary.broadcast.count}`);
  out.push(`    p50 / p95     ${summary.broadcast.p50}ms / ${summary.broadcast.p95}ms`);
  out.push(`    p99 / max     ${summary.broadcast.p99}ms / ${summary.broadcast.max}ms`);
  out.push("");
  out.push("  Status codes");
  out.push(`    2xx           ${summary.statusCounts["2xx"]}`);
  out.push(`    4xx           ${summary.statusCounts["4xx"]}`);
  out.push(`    5xx           ${summary.statusCounts["5xx"]}`);
  out.push(`    network err   ${summary.statusCounts.network}`);
  out.push(`    error rate    ${(summary.errorRate * 100).toFixed(2)}%`);
  out.push("");
  out.push("  Setup failures");
  out.push(`    join          ${summary.joinFailures}`);
  out.push(`    pusher sub    ${summary.pusherSubscribeFailures}`);
  out.push("");
  out.push(line);
  if (verdict.pass) {
    out.push("  VEREDICTO: PASS");
  } else {
    out.push("  VEREDICTO: FAIL");
    for (const f of verdict.failures) out.push(`    - ${f}`);
  }
  out.push(line);
  out.push("");
  console.log(out.join("\n"));
}
