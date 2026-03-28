"use client";

import { useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function BuildTimeCards() {
  const { data, isLoading } = useMetrics();

  const passed = data.features.filter((f) => f.status === "passed");
  const totalDuration = passed.reduce((sum, f) => {
    const dur = f.attempts.reduce((a, att) => a + att.duration_sec, 0);
    return sum + dur;
  }, 0);
  const avgDuration = passed.length > 0 ? Math.round(totalDuration / passed.length) : 0;

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Build time metrics" variant="card" />;
  }

  return (
    <section
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      aria-label="Build time metrics"
    >
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-400">Build Time</h3>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl font-semibold tabular-nums text-zinc-100">{formatDuration(totalDuration)}</p>
        <span className="text-sm text-zinc-500">total</span>
      </div>
      <p className="mt-2 text-sm text-zinc-400">
        {formatDuration(avgDuration)} avg per feature
      </p>
      {passed.length > 0 && (
        <p className="mt-1 text-xs text-zinc-500">
          {passed.length} features &middot; fastest {formatDuration(Math.min(...passed.map((f) => f.attempts.reduce((a, att) => a + att.duration_sec, 0))))} &middot; slowest {formatDuration(Math.max(...passed.map((f) => f.attempts.reduce((a, att) => a + att.duration_sec, 0))))}
        </p>
      )}
    </section>
  );
}
