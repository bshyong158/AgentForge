"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

interface ScoreComparisonPoint {
  feature_id: number;
  first_attempt_score: number;
  final_score: number;
}

function isValidScore(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 10;
}

function buildComparisonSeries(features: MetricsFeature[]): ScoreComparisonPoint[] {
  return features
    .filter((feature) => feature.status !== "pending" && feature.attempts.length > 0)
    .map((feature) => ({
      feature_id: feature.id,
      first_attempt_score: feature.attempts[0].score,
      final_score: feature.final_score,
    }))
    .filter(
      (feature) =>
        isValidScore(feature.first_attempt_score) &&
        isValidScore(feature.final_score),
    )
    .sort((a, b) => a.feature_id - b.feature_id);
}

export function FirstVsFinalScoreScatterPlot() {
  const { data, isLoading, error } = useMetrics();
  const chartData = useMemo(() => buildComparisonSeries(data.features), [data.features]);
  const hasChartData = chartData.length > 0;

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="First attempt versus final score scatter plot" variant="chart" />;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="First attempt versus final score scatter plot">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          First attempt vs final score
        </h3>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">
          No scored attempts yet. Scatter points appear once features have first-attempt and final scores.
        </p>
      )}

      {!isLoading && hasChartData && (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis
                type="number"
                dataKey="first_attempt_score"
                domain={[0, 10]}
                allowDecimals={false}
                stroke="#a1a1aa"
                tickLine={false}
                label={{ value: "First attempt", position: "insideBottom", offset: -8, fill: "#a1a1aa" }}
              />
              <YAxis
                type="number"
                dataKey="final_score"
                domain={[0, 10]}
                allowDecimals={false}
                stroke="#a1a1aa"
                tickLine={false}
                label={{ value: "Final score", angle: -90, position: "insideLeft", fill: "#a1a1aa" }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "4 4", stroke: "#52525b" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#3f3f46",
                  borderRadius: "0.5rem",
                }}
                labelFormatter={(_value: any, payload: any) => {
                  const point = payload?.[0]?.payload as ScoreComparisonPoint | undefined;
                  return point ? `Feature ${point.feature_id}` : "Feature";
                }}
                formatter={(value: any, name: any) => {
                  if (name === "first_attempt_score") {
                    return [value, "First attempt"];
                  }

                  if (name === "final_score") {
                    return [value, "Final score"];
                  }

                  return [value, name];
                }}
              />
              <ReferenceLine
                segment={[
                  { x: 0, y: 0 },
                  { x: 10, y: 10 },
                ]}
                stroke="#a1a1aa"
                strokeDasharray="6 4"
                label={{ value: "x = y", position: "insideTopLeft", fill: "#a1a1aa", fontSize: 12 }}
              />
              <Scatter data={chartData} name="Features" fill="#22d3ee" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
