"use client";

import { useMemo } from "react";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";

interface SkippedFeatureRow {
  id: number;
  description: string;
  bestScore: number | null;
  skipReason: string;
}

function isValidScore(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 10;
}

function getBestAttemptScore(feature: MetricsFeature): number | null {
  const attemptScores = feature.attempts
    .map((attempt) => attempt.score)
    .filter((score) => isValidScore(score));

  if (attemptScores.length === 0) {
    return null;
  }

  return Math.max(...attemptScores);
}

function buildSkippedFeatures(features: MetricsFeature[]): SkippedFeatureRow[] {
  return features
    .filter((feature) => feature.status === "skipped")
    .map((feature) => {
      const skipReason =
        feature.skip_reason.trim().length > 0 ? feature.skip_reason : "No skip reason provided.";

      return {
        id: feature.id,
        description: feature.description,
        bestScore: getBestAttemptScore(feature),
        skipReason,
      };
    })
    .sort((a, b) => a.id - b.id);
}

function formatBestScore(score: number | null): string {
  if (score === null) {
    return "N/A";
  }

  return score.toFixed(1);
}

export function SkippedFeaturesPanel() {
  const { data, isLoading, error } = useMetrics();
  const skippedFeatures = useMemo(() => buildSkippedFeatures(data.features), [data.features]);
  const hasSkippedFeatures = skippedFeatures.length > 0;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Skipped features panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Failed and skipped features</h3>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasSkippedFeatures && (
        <p className="text-sm text-zinc-400">No skipped features yet.</p>
      )}

      {!isLoading && hasSkippedFeatures && (
        <div className="space-y-3">
          {skippedFeatures.map((feature) => (
            <article key={feature.id} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-zinc-100">Feature {feature.id}</h4>
                <span className="text-xs text-zinc-400">Best score: {formatBestScore(feature.bestScore)}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{feature.description}</p>
              <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">Skip reason</p>
              <p className="mt-1 text-sm text-zinc-300">{feature.skipReason}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
