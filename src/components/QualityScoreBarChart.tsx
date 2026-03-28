"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

interface QualityPoint {
  feature_id: number;
  final_score: number;
}

const PASS_THRESHOLD = 7;
const PASS_COLOR = "#22c55e";
const FAIL_COLOR = "#ef4444";

function buildQualitySeries(features: MetricsFeature[]): QualityPoint[] {
  return features
    .filter((feature) => feature.status === "passed")
    .sort((a, b) => a.id - b.id)
    .map((feature) => ({
      feature_id: feature.id,
      final_score: feature.final_score,
    }));
}

export function QualityScoreBarChart() {
  const { data, isLoading, error } = useMetrics();
  const chartData = useMemo(() => buildQualitySeries(data.features), [data.features]);
  const hasChartData = chartData.length > 0;

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Quality score by feature chart" variant="chart" />;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Quality score by feature chart">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Quality score per feature</h3>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">No completed features yet. Quality bars appear once features are passed.</p>
      )}

      {!isLoading && hasChartData && (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 20, bottom: 12, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="feature_id" stroke="#a1a1aa" tickLine={false} />
              <YAxis domain={[0, 10]} allowDecimals={false} stroke="#a1a1aa" tickLine={false} />
              <Tooltip
                cursor={{ fill: "#27272a" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#3f3f46",
                  borderRadius: "0.5rem",
                }}
                labelFormatter={(value: any) => `Feature ${value}`}
                formatter={(value: any) => [`${value}`, "Quality score"]}
              />
              <Bar dataKey="final_score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={`quality-cell-${entry.feature_id}`} fill={entry.final_score >= PASS_THRESHOLD ? PASS_COLOR : FAIL_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
