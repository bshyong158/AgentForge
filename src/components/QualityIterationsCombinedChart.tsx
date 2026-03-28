"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

interface QualityIterationsPoint {
  feature_id: number;
  final_score: number;
  iterations: number;
}

function buildSeries(features: MetricsFeature[]): QualityIterationsPoint[] {
  return features
    .filter((feature) => feature.status === "passed")
    .sort((a, b) => a.id - b.id)
    .map((feature) => ({
      feature_id: feature.id,
      final_score: feature.final_score,
      iterations: feature.attempts.length,
    }));
}

export function QualityIterationsCombinedChart() {
  const { data, isLoading, error } = useMetrics();
  const chartData = useMemo(() => buildSeries(data.features), [data.features]);
  const hasChartData = chartData.length > 0;

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Quality and iterations combined chart" variant="chart" />;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Quality and iterations combined chart">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          Quality score and iterations per feature
        </h3>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">
          No completed features yet. Combined quality and iteration trends appear once features are passed.
        </p>
      )}

      {!isLoading && hasChartData && (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 12, right: 20, bottom: 12, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="feature_id" stroke="#a1a1aa" tickLine={false} />
              <YAxis
                yAxisId="quality"
                domain={[0, 10]}
                allowDecimals={false}
                stroke="#a1a1aa"
                tickLine={false}
                label={{ value: "Score", angle: -90, position: "insideLeft", fill: "#a1a1aa" }}
              />
              <YAxis
                yAxisId="iterations"
                orientation="right"
                domain={[0, 5]}
                allowDecimals={false}
                stroke="#a1a1aa"
                tickLine={false}
                label={{ value: "Iterations", angle: 90, position: "insideRight", fill: "#a1a1aa" }}
              />
              <Tooltip
                cursor={{ fill: "#27272a" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#3f3f46",
                  borderRadius: "0.5rem",
                }}
                labelFormatter={(value: any) => `Feature ${value}`}
                formatter={(value: any, name: any) => {
                  if (name === "Quality score") {
                    return [value, "Quality score"];
                  }

                  return [value, "Iterations"];
                }}
              />
              <Legend />
              <Bar
                yAxisId="iterations"
                dataKey="iterations"
                name="Iterations"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="quality"
                type="monotone"
                dataKey="final_score"
                name="Quality score"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ r: 4, stroke: "#22c55e", fill: "#18181b" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
