"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

interface RunningCostPoint {
  feature_number: number;
  running_total_usd: number | null;
  projected_total_usd: number | null;
}

interface CostProjectionSeries {
  points: RunningCostPoint[];
  processedCount: number;
  projectedFinalCostUsd: number;
  totalFeatures: number;
}

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toTimestamp(value: string): number | null {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function formatCurrency(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  return USD_FORMATTER.format(safeValue);
}

function formatAxisCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return "$0";
  }

  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}k`;
  }

  return `$${Math.round(value)}`;
}

function sortProcessedFeatures(features: MetricsFeature[]): MetricsFeature[] {
  return [...features]
    .filter((feature) => feature.status !== "pending")
    .sort((a, b) => {
      const aTimestamp = toTimestamp(a.completed_at);
      const bTimestamp = toTimestamp(b.completed_at);

      if (aTimestamp !== null && bTimestamp !== null) {
        return aTimestamp - bTimestamp;
      }

      if (aTimestamp === null && bTimestamp !== null) {
        return 1;
      }

      if (aTimestamp !== null && bTimestamp === null) {
        return -1;
      }

      return a.id - b.id;
    });
}

function readFeatureTokenTotal(feature: MetricsFeature): number {
  return feature.attempts.reduce((total, attempt) => total + attempt.tokens_coder + attempt.tokens_evaluator, 0);
}

function allocateFeatureCosts(tokenTotals: number[], totalCostUsd: number): number[] {
  const safeTotalCost = Number.isFinite(totalCostUsd) ? Math.max(0, totalCostUsd) : 0;
  if (tokenTotals.length === 0) {
    return [];
  }

  const safeTokenTotals = tokenTotals.map((tokenTotal) => Math.max(0, tokenTotal));
  const allTokens = safeTokenTotals.reduce((total, tokenTotal) => total + tokenTotal, 0);

  if (allTokens <= 0) {
    const evenShare = safeTotalCost / safeTokenTotals.length;
    return safeTokenTotals.map((_, index) => {
      if (index === safeTokenTotals.length - 1) {
        return Math.max(0, safeTotalCost - evenShare * (safeTokenTotals.length - 1));
      }

      return evenShare;
    });
  }

  let allocatedCost = 0;
  return safeTokenTotals.map((tokenTotal, index) => {
    if (index === safeTokenTotals.length - 1) {
      return Math.max(0, safeTotalCost - allocatedCost);
    }

    const featureCost = (tokenTotal / allTokens) * safeTotalCost;
    allocatedCost += featureCost;
    return featureCost;
  });
}

function buildProjectionSeries(
  features: MetricsFeature[],
  totalCostUsd: number,
  totalFeatures: number,
): CostProjectionSeries {
  const safeTotalFeatures = totalFeatures > 0 ? Math.round(totalFeatures) : 30;
  const processedFeatures = sortProcessedFeatures(features).slice(0, safeTotalFeatures);
  const processedCount = processedFeatures.length;
  const safeTotalCost = Number.isFinite(totalCostUsd) ? Math.max(0, totalCostUsd) : 0;

  if (processedCount === 0) {
    return {
      points: [],
      processedCount: 0,
      projectedFinalCostUsd: 0,
      totalFeatures: safeTotalFeatures,
    };
  }

  const featureTokenTotals = processedFeatures.map(readFeatureTokenTotal);
  const featureCosts = allocateFeatureCosts(featureTokenTotals, safeTotalCost);

  const runningTotals: number[] = [];
  let runningCost = 0;

  for (const featureCost of featureCosts) {
    runningCost += featureCost;
    runningTotals.push(runningCost);
  }

  const projectedFinalCostUsd = (safeTotalCost / processedCount) * safeTotalFeatures;

  const points: RunningCostPoint[] = Array.from({ length: safeTotalFeatures }, (_, index) => ({
    feature_number: index + 1,
    running_total_usd: index < runningTotals.length ? runningTotals[index] : null,
    projected_total_usd: null,
  }));

  points[processedCount - 1].projected_total_usd = safeTotalCost;
  points[safeTotalFeatures - 1].projected_total_usd = projectedFinalCostUsd;

  return {
    points,
    processedCount,
    projectedFinalCostUsd,
    totalFeatures: safeTotalFeatures,
  };
}

export function RunningTotalCostProjectionChart() {
  const { data, isLoading, error } = useMetrics();
  const totalFeatures = data.meta.total_features > 0 ? data.meta.total_features : 30;
  const currentTotalCostUsd = Number.isFinite(data.totals.cost_usd) ? Math.max(0, data.totals.cost_usd) : 0;

  const series = useMemo(
    () => buildProjectionSeries(data.features, currentTotalCostUsd, totalFeatures),
    [currentTotalCostUsd, data.features, totalFeatures],
  );

  const hasChartData = series.points.length > 0;

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Running total and projected final cost chart" variant="chart" />;
  }

  return (
    <section
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      aria-label="Running total and projected final cost chart"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          Running total and projected final cost
        </h3>
        <p className="text-xs text-zinc-400">
          Processed features: {series.processedCount} / {series.totalFeatures}
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Current total</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{formatCurrency(currentTotalCostUsd)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Projected at feature {series.totalFeatures}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">
            {series.processedCount > 0 ? formatCurrency(series.projectedFinalCostUsd) : "--"}
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">
          No processed features yet. This projection appears once completed or skipped features are recorded.
        </p>
      )}

      {!isLoading && hasChartData && (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series.points} margin={{ top: 12, right: 20, bottom: 12, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis
                dataKey="feature_number"
                type="number"
                allowDecimals={false}
                domain={[1, series.totalFeatures]}
                tickFormatter={(value: any) => `#${value}`}
                stroke="#a1a1aa"
                tickLine={false}
              />
              <YAxis
                stroke="#a1a1aa"
                tickLine={false}
                tickFormatter={(value: any) => formatAxisCurrency(Number(value))}
              />
              <Tooltip
                cursor={{ stroke: "#52525b", strokeDasharray: "4 4" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#3f3f46",
                  borderRadius: "0.5rem",
                }}
                labelFormatter={(value: any) => `Feature ${value}`}
                formatter={(value: any, name: any) => {
                  const label = name === "projected_total_usd" ? "Projection trend" : "Running total";
                  return [formatCurrency(Number(value)), label];
                }}
              />
              <Line
                type="monotone"
                dataKey="running_total_usd"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 3, stroke: "#38bdf8", fill: "#18181b" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="linear"
                dataKey="projected_total_usd"
                stroke="#f97316"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 3, stroke: "#f97316", fill: "#18181b" }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
