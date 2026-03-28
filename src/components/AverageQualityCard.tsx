"use client";

import { useMemo } from "react";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

type TrendDirection = "up" | "down" | "flat";

interface TrendVisual {
  symbol: string;
  label: string;
  className: string;
}

const TREND_VISUALS: Record<TrendDirection, TrendVisual> = {
  up: {
    symbol: "↑",
    label: "Up",
    className: "text-emerald-300",
  },
  down: {
    symbol: "↓",
    label: "Down",
    className: "text-rose-300",
  },
  flat: {
    symbol: "→",
    label: "Flat",
    className: "text-zinc-300",
  },
};

function toTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getCompletedFeatures(features: MetricsFeature[]): MetricsFeature[] {
  return features
    .filter((feature) => feature.status === "passed")
    .sort((a, b) => toTimestamp(a.completed_at) - toTimestamp(b.completed_at));
}

function getAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function getTrendDirection(overallAverage: number, lastFiveAverage: number): TrendDirection {
  if (lastFiveAverage > overallAverage) {
    return "up";
  }

  if (lastFiveAverage < overallAverage) {
    return "down";
  }

  return "flat";
}

export function AverageQualityCard() {
  const { data, isLoading, error } = useMetrics();

  const { hasCompletedFeatures, overallAverage, lastFiveAverage, trendDirection } = useMemo(() => {
    const completedFeatures = getCompletedFeatures(data.features);

    if (completedFeatures.length === 0) {
      return {
        hasCompletedFeatures: false,
        overallAverage: 0,
        lastFiveAverage: 0,
        trendDirection: "flat" as const,
      };
    }

    const overall = getAverage(completedFeatures.map((feature) => feature.final_score));
    const lastFive = getAverage(
      completedFeatures
        .slice(-5)
        .map((feature) => feature.final_score),
    );

    return {
      hasCompletedFeatures: true,
      overallAverage: overall,
      lastFiveAverage: lastFive,
      trendDirection: getTrendDirection(overall, lastFive),
    };
  }, [data.features]);

  const trendVisual = TREND_VISUALS[trendDirection];

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Average quality score" variant="card" />;
  }

  return (
    <section
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      aria-label="Average quality score"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Average quality score</h3>
        <div className={`flex items-center gap-2 text-sm font-semibold ${trendVisual.className}`}>
          <span aria-hidden="true">{trendVisual.symbol}</span>
          <span>{trendVisual.label}</span>
        </div>
      </div>

      <p className="text-3xl font-semibold tabular-nums text-zinc-100">{overallAverage.toFixed(2)}</p>
      <p className="mt-2 text-xs text-zinc-400">
        Last 5 average: {lastFiveAverage.toFixed(2)} vs overall {overallAverage.toFixed(2)}
      </p>

      {isLoading && <p className="mt-3 text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="mt-3 text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasCompletedFeatures && (
        <p className="mt-3 text-sm text-zinc-400">
          No completed features yet. Quality trend appears once scores are available.
        </p>
      )}
    </section>
  );
}
