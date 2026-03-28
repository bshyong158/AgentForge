"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

interface IterationPoint {
  feature_id: number;
  first_attempt: number;
  revision_attempts: number;
  total_attempts: number;
}

const FIRST_ATTEMPT_COLOR = "#22c55e";
const REVISION_COLOR = "#f59e0b";

function buildIterationSeries(features: MetricsFeature[]): IterationPoint[] {
  return features
    .filter((feature) => feature.status === "passed")
    .sort((a, b) => a.id - b.id)
    .map((feature) => {
      const totalAttempts = feature.attempts.length;

      return {
        feature_id: feature.id,
        first_attempt: totalAttempts > 0 ? 1 : 0,
        revision_attempts: Math.max(0, totalAttempts - 1),
        total_attempts: totalAttempts,
      };
    });
}

export function IterationsStackedBarChart() {
  const { data, isLoading, error } = useMetrics();
  const chartData = useMemo(() => buildIterationSeries(data.features), [data.features]);
  const hasChartData = chartData.some((point) => point.total_attempts > 0);

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Iterations per feature stacked bar chart" variant="chart" />;
  }

  return (
    <section
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      aria-label="Iterations per feature stacked bar chart"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Iterations per feature</h3>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">
          No iteration data yet. Stacked bars appear after completed features include attempt history.
        </p>
      )}

      {!isLoading && hasChartData && (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 20, bottom: 12, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="feature_id" stroke="#a1a1aa" tickLine={false} />
              <YAxis dataKey="total_attempts" allowDecimals={false} stroke="#a1a1aa" tickLine={false} />
              <Tooltip
                cursor={{ fill: "#27272a" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#3f3f46",
                  borderRadius: "0.5rem",
                }}
                labelFormatter={(value: any) => `Feature ${value}`}
                formatter={(value: any, name: any, payload: any) => {
                  if (name === "first_attempt") {
                    return [value, "First attempt"];
                  }

                  if (name === "revision_attempts") {
                    return [value, "Revision attempts"];
                  }

                  return [payload?.payload?.total_attempts ?? value, "Total attempts"];
                }}
              />
              <Legend
                formatter={(value: string) => {
                  if (value === "first_attempt") {
                    return "First attempt";
                  }

                  if (value === "revision_attempts") {
                    return "Revision attempts";
                  }

                  return value;
                }}
              />
              <Bar dataKey="first_attempt" stackId="attempts" fill={FIRST_ATTEMPT_COLOR} name="first_attempt" />
              <Bar dataKey="revision_attempts" stackId="attempts" fill={REVISION_COLOR} name="revision_attempts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
