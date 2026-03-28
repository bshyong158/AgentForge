"use client";

import { useMemo } from "react";
import { useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

export function TotalIterationsCard() {
  const { data, isLoading, error } = useMetrics();

  const totalIterations = useMemo(
    () => data.features.reduce((total, feature) => total + feature.attempts.length, 0),
    [data.features],
  );

  const hasIterationData = totalIterations > 0;

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Total build iterations" variant="card" />;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Total build iterations">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Total iterations</h3>
      </div>

      <p className="text-3xl font-semibold tabular-nums text-zinc-100">{totalIterations}</p>
      <p className="mt-2 text-xs text-zinc-400">Sum of all feature attempt counts.</p>

      {isLoading && <p className="mt-3 text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="mt-3 text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasIterationData && (
        <p className="mt-3 text-sm text-zinc-400">
          No iteration data yet. Totals appear once feature attempts are recorded.
        </p>
      )}
    </section>
  );
}
