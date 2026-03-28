"use client";

import { useMetrics } from "../hooks/useMetrics";

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return value;
}

export function FeatureCompletionCard() {
  const { data, isLoading, error } = useMetrics();

  const totalFeatures = data.meta.total_features > 0 ? data.meta.total_features : 30;
  const completedByStatus = data.features.filter((feature) => feature.status === "passed").length;
  const completedFeatures = data.features.length > 0 ? completedByStatus : data.totals.features_completed;
  const progressPercent = clampPercent((completedFeatures / totalFeatures) * 100);
  const hasNoCompletedFeatures = completedFeatures === 0;

  return (
    <section
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      aria-label="Feature completion progress"
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Features completed</h3>
        <p className="text-2xl font-semibold tabular-nums text-zinc-100">
          {completedFeatures} <span className="text-base text-zinc-400">/ {totalFeatures}</span>
        </p>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
          aria-hidden="true"
        />
      </div>

      <p className="mt-3 text-xs text-zinc-400">{progressPercent.toFixed(1)}% complete</p>

      {isLoading && <p className="mt-3 text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="mt-3 text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && hasNoCompletedFeatures && (
        <p className="mt-3 text-sm text-zinc-400">No completed features yet. Progress appears as data is added.</p>
      )}
    </section>
  );
}
