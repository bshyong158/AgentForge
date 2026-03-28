"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

interface CompletionPoint {
  timestamp: number;
  completed_at: string;
  completed_count: number;
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function toTimestamp(value: string): number | null {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function buildCompletionSeries(features: MetricsFeature[]): CompletionPoint[] {
  const completedWithTimestamp = features
    .filter((feature) => feature.status === "passed")
    .map((feature) => ({
      completed_at: feature.completed_at,
      timestamp: toTimestamp(feature.completed_at),
    }))
    .filter((feature): feature is { completed_at: string; timestamp: number } => feature.timestamp !== null)
    .sort((a, b) => a.timestamp - b.timestamp);

  return completedWithTimestamp.map((feature, index) => ({
    timestamp: feature.timestamp,
    completed_at: feature.completed_at,
    completed_count: index + 1,
  }));
}

function formatTimestamp(value: number): string {
  return DATE_TIME_FORMATTER.format(new Date(value));
}

export function CumulativeCompletionChart() {
  const { data, isLoading, error } = useMetrics();

  const chartData = useMemo(() => buildCompletionSeries(data.features), [data.features]);
  const totalFeatures = data.meta.total_features > 0 ? data.meta.total_features : 30;
  const hasChartData = chartData.length > 0;

  const singlePointDomain: [number, number] | undefined =
    chartData.length === 1
      ? [chartData[0].timestamp - 60_000, chartData[0].timestamp + 60_000]
      : undefined;

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Cumulative completion chart" variant="chart" />;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Cumulative completion chart">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          Cumulative completion over time
        </h3>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">
          No completed features yet. The timeline appears once features receive completion timestamps.
        </p>
      )}

      {!isLoading && hasChartData && (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 20, bottom: 12, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={singlePointDomain ?? ["dataMin", "dataMax"]}
                tickFormatter={formatTimestamp}
                minTickGap={36}
                stroke="#a1a1aa"
                tickLine={false}
              />
              <YAxis
                dataKey="completed_count"
                domain={[0, totalFeatures]}
                allowDecimals={false}
                stroke="#a1a1aa"
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: "#52525b", strokeDasharray: "4 4" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#3f3f46",
                  borderRadius: "0.5rem",
                }}
                labelFormatter={(value: any) => formatTimestamp(Number(value))}
                formatter={(value: any) => [`${value} / ${totalFeatures}`, "Completed features"]}
              />
              <Line
                type="monotone"
                dataKey="completed_count"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ r: 4, stroke: "#22c55e", fill: "#18181b" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
