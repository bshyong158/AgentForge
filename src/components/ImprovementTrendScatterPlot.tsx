"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";

interface BaseTrendPoint {
  completion_index: number;
  feature_id: number;
  final_score: number;
  completed_at: string;
}

interface TrendPoint extends BaseTrendPoint {
  trend_score: number;
}

interface TrendModel {
  points: TrendPoint[];
  slope: number;
}

function isValidFinalScore(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 10;
}

function parseTimestamp(isoTimestamp: string): number | null {
  const timestamp = Date.parse(isoTimestamp);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function clampScore(value: number): number {
  return Math.min(10, Math.max(0, value));
}

function computeRegression(points: BaseTrendPoint[]): { slope: number; intercept: number } {
  if (points.length === 0) {
    return { slope: 0, intercept: 0 };
  }

  if (points.length === 1) {
    return { slope: 0, intercept: points[0].final_score };
  }

  const count = points.length;
  const sumX = points.reduce((total, point) => total + point.completion_index, 0);
  const sumY = points.reduce((total, point) => total + point.final_score, 0);
  const sumXY = points.reduce(
    (total, point) => total + point.completion_index * point.final_score,
    0,
  );
  const sumXX = points.reduce(
    (total, point) => total + point.completion_index * point.completion_index,
    0,
  );

  const denominator = count * sumXX - sumX * sumX;

  if (denominator === 0) {
    return { slope: 0, intercept: sumY / count };
  }

  const slope = (count * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / count;

  return { slope, intercept };
}

function buildTrendModel(features: MetricsFeature[]): TrendModel {
  const scoredFeatures = features
    .filter((feature) => feature.status !== "pending")
    .filter((feature) => isValidFinalScore(feature.final_score))
    .map((feature) => ({
      feature_id: feature.id,
      final_score: feature.final_score,
      completed_at: feature.completed_at,
      completed_timestamp: parseTimestamp(feature.completed_at),
    }))
    .filter(
      (feature): feature is typeof feature & { completed_timestamp: number } =>
        feature.completed_timestamp !== null,
    )
    .sort(
      (a, b) =>
        a.completed_timestamp - b.completed_timestamp ||
        a.feature_id - b.feature_id,
    );

  const basePoints: BaseTrendPoint[] = scoredFeatures.map((feature, index) => ({
    completion_index: index + 1,
    feature_id: feature.feature_id,
    final_score: feature.final_score,
    completed_at: feature.completed_at,
  }));

  const { slope, intercept } = computeRegression(basePoints);

  const points = basePoints.map((point) => ({
    ...point,
    trend_score: clampScore(slope * point.completion_index + intercept),
  }));

  return { points, slope };
}

function buildTrendLabel(slope: number): { label: string; className: string } {
  const epsilon = 0.0001;

  if (slope > epsilon) {
    return { label: "Positive slope", className: "text-emerald-300" };
  }

  if (slope < -epsilon) {
    return { label: "Negative slope", className: "text-rose-300" };
  }

  return { label: "Flat slope", className: "text-zinc-300" };
}

function formatSlope(slope: number): string {
  const sign = slope > 0 ? "+" : "";
  return `${sign}${slope.toFixed(3)}`;
}

export function ImprovementTrendScatterPlot() {
  const { data, isLoading, error } = useMetrics();
  const { points, slope } = useMemo(() => buildTrendModel(data.features), [data.features]);
  const trendDirection = useMemo(() => buildTrendLabel(slope), [slope]);
  const hasChartData = points.length > 0;

  return (
    <section
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      aria-label="Improvement trend scatter plot with linear regression"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Improvement trend</h3>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">
          No completed scores yet. Trend appears once features have completion timestamps and final scores.
        </p>
      )}

      {!isLoading && hasChartData && (
        <>
          <p className={`mb-4 text-sm ${trendDirection.className}`}>
            {trendDirection.label}: {formatSlope(slope)} score points per completed feature.
          </p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 12, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis
                  type="number"
                  dataKey="completion_index"
                  domain={[1, Math.max(1, points.length)]}
                  allowDecimals={false}
                  tickLine={false}
                  stroke="#a1a1aa"
                  label={{ value: "Completion order", position: "insideBottom", offset: -8, fill: "#a1a1aa" }}
                />
                <YAxis
                  type="number"
                  domain={[0, 10]}
                  allowDecimals={false}
                  tickLine={false}
                  stroke="#a1a1aa"
                  label={{ value: "Final score", angle: -90, position: "insideLeft", fill: "#a1a1aa" }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "4 4", stroke: "#52525b" }}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#3f3f46",
                    borderRadius: "0.5rem",
                  }}
                  labelFormatter={(value: any, payload: any) => {
                    const point = payload?.[0]?.payload as TrendPoint | undefined;
                    const featureText = point ? `Feature ${point.feature_id}` : "Feature";
                    return `${featureText} - Completion #${value}`;
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === "final_score") {
                      return [Number(value).toFixed(2), "Final score"];
                    }

                    if (name === "trend_score") {
                      return [Number(value).toFixed(2), "Regression line"];
                    }

                    return [value, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ color: "#d4d4d8", fontSize: "12px" }}
                  formatter={(value: any) => (value === "trend_score" ? "Regression line" : "Final score")}
                />
                <Scatter dataKey="final_score" name="Final score" fill="#22d3ee" />
                <Line
                  type="linear"
                  dataKey="trend_score"
                  name="trend_score"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
