"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

interface FeatureCostPoint {
  completion_order: number;
  feature_id: number;
  token_cost: number;
}

const TOKEN_FORMATTER = new Intl.NumberFormat("en-US");

function toTimestamp(value: string): number | null {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function buildCostSeries(features: MetricsFeature[]): FeatureCostPoint[] {
  return features
    .filter((feature) => feature.status !== "pending")
    .map((feature) => ({
      feature_id: feature.id,
      completed_at_timestamp: toTimestamp(feature.completed_at),
      token_cost: feature.attempts.reduce(
        (total, attempt) => total + attempt.tokens_coder + attempt.tokens_evaluator,
        0,
      ),
    }))
    .filter((feature) => feature.token_cost > 0)
    .sort((a, b) => {
      if (a.completed_at_timestamp !== null && b.completed_at_timestamp !== null) {
        return a.completed_at_timestamp - b.completed_at_timestamp;
      }

      if (a.completed_at_timestamp === null && b.completed_at_timestamp !== null) {
        return 1;
      }

      if (a.completed_at_timestamp !== null && b.completed_at_timestamp === null) {
        return -1;
      }

      return a.feature_id - b.feature_id;
    })
    .map((feature, index) => ({
      completion_order: index + 1,
      feature_id: feature.feature_id,
      token_cost: feature.token_cost,
    }));
}

function formatTokens(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return TOKEN_FORMATTER.format(Math.max(0, Math.round(value)));
}

export function CostPerFeatureLineChart() {
  const { data, isLoading, error } = useMetrics();
  const chartData = useMemo(() => buildCostSeries(data.features), [data.features]);
  const hasChartData = chartData.length > 0;

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Cost per feature chart" variant="chart" />;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Cost per feature chart">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          Cost per feature (token total)
        </h3>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">
          No completed feature token usage yet. This chart appears once completed features include attempts.
        </p>
      )}

      {!isLoading && hasChartData && (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 20, bottom: 12, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis
                dataKey="completion_order"
                tickFormatter={(value: number) => `#${value}`}
                stroke="#a1a1aa"
                tickLine={false}
              />
              <YAxis
                dataKey="token_cost"
                stroke="#a1a1aa"
                tickLine={false}
                tickFormatter={(value: number) => formatTokens(Number(value))}
              />
              <Tooltip
                cursor={{ stroke: "#52525b", strokeDasharray: "4 4" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#3f3f46",
                  borderRadius: "0.5rem",
                }}
                labelFormatter={(value: any, payload: any) => {
                  const featureId = payload?.[0]?.payload?.feature_id;
                  if (typeof featureId === "number") {
                    return `Order ${value} - Feature ${featureId}`;
                  }

                  return `Order ${value}`;
                }}
                formatter={(value: any) => [`${formatTokens(Number(value))} tokens`, "Feature cost"]}
              />
              <Line
                type="monotone"
                dataKey="token_cost"
                stroke="#14b8a6"
                strokeWidth={2.5}
                dot={{ r: 4, stroke: "#14b8a6", fill: "#18181b" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
