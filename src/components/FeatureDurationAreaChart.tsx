"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

interface DurationPoint {
  feature_id: number;
  duration_minutes: number;
}

function toTimestamp(value: string): number | null {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function buildDurationSeries(features: MetricsFeature[]): DurationPoint[] {
  return features
    .filter((feature) => feature.status === "passed")
    .map((feature) => {
      const startedAt = toTimestamp(feature.started_at);
      const completedAt = toTimestamp(feature.completed_at);

      if (startedAt === null || completedAt === null || completedAt < startedAt) {
        return null;
      }

      return {
        feature_id: feature.id,
        completed_at: completedAt,
        duration_minutes: (completedAt - startedAt) / 60_000,
      };
    })
    .filter((point): point is DurationPoint & { completed_at: number } => point !== null)
    .sort((a, b) => a.completed_at - b.completed_at)
    .map(({ feature_id, duration_minutes }) => ({
      feature_id,
      duration_minutes,
    }));
}

function formatMinutes(value: number): string {
  if (!Number.isFinite(value)) {
    return "0.0";
  }

  return value.toFixed(1);
}

export function FeatureDurationAreaChart() {
  const { data, isLoading, error } = useMetrics();
  const chartData = useMemo(() => buildDurationSeries(data.features), [data.features]);
  const hasChartData = chartData.length > 0;

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Feature duration area chart" variant="chart" />;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Feature duration area chart">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Time spent per feature (minutes)</h3>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">
          No completed features with valid timestamps yet. Duration data appears after features are completed.
        </p>
      )}

      {!isLoading && hasChartData && (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 20, bottom: 12, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="feature_id" stroke="#a1a1aa" tickLine={false} />
              <YAxis
                dataKey="duration_minutes"
                stroke="#a1a1aa"
                tickLine={false}
                tickFormatter={(value: number) => formatMinutes(Number(value))}
              />
              <Tooltip
                cursor={{ stroke: "#52525b", strokeDasharray: "4 4" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#3f3f46",
                  borderRadius: "0.5rem",
                }}
                labelFormatter={(value: any) => `Feature ${value}`}
                formatter={(value: any) => [`${formatMinutes(Number(value))} min`, "Duration"]}
              />
              <Area
                type="monotone"
                dataKey="duration_minutes"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="#38bdf8"
                fillOpacity={0.25}
                dot={{ r: 3, stroke: "#38bdf8", fill: "#18181b" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
