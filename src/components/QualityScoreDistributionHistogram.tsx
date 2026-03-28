"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";

interface ScoreBin {
  label: string;
  min: number;
  maxExclusive: number;
}

interface ScoreBinPoint {
  score_range: string;
  count: number;
}

const SCORE_BINS: ScoreBin[] = [
  { label: "1-2", min: 1, maxExclusive: 3 },
  { label: "3-4", min: 3, maxExclusive: 5 },
  { label: "5-6", min: 5, maxExclusive: 7 },
  { label: "7-8", min: 7, maxExclusive: 9 },
  { label: "9-10", min: 9, maxExclusive: 11 },
];

function buildDistribution(features: MetricsFeature[]): ScoreBinPoint[] {
  const counts = SCORE_BINS.map((bin) => ({
    score_range: bin.label,
    count: 0,
  }));

  for (const feature of features) {
    if (feature.status === "pending") {
      continue;
    }

    const score = feature.final_score;

    if (!Number.isFinite(score) || score < 1 || score > 10) {
      continue;
    }

    const binIndex = SCORE_BINS.findIndex((bin) => score >= bin.min && score < bin.maxExclusive);

    if (binIndex !== -1) {
      counts[binIndex].count += 1;
    }
  }

  return counts;
}

export function QualityScoreDistributionHistogram() {
  const { data, isLoading, error } = useMetrics();
  const chartData = useMemo(() => buildDistribution(data.features), [data.features]);
  const scoredFeatures = chartData.reduce((total, point) => total + point.count, 0);
  const hasChartData = scoredFeatures > 0;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Quality score distribution histogram">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Score distribution</h3>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">
          No scored features yet. Distribution appears once features have final quality scores.
        </p>
      )}

      {!isLoading && hasChartData && (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 20, bottom: 12, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="score_range" stroke="#a1a1aa" tickLine={false} />
              <YAxis allowDecimals={false} stroke="#a1a1aa" tickLine={false} />
              <Tooltip
                cursor={{ fill: "#27272a" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#3f3f46",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: any) => [`${value}`, "Features"]}
                labelFormatter={(value: any) => `Score ${value}`}
              />
              <Bar dataKey="count" name="Features" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
