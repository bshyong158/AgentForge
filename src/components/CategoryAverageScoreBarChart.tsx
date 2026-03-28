"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

const CATEGORY_ORDER = [
  "scaffold",
  "cards",
  "timeline",
  "quality",
  "features",
  "tokens",
  "git",
  "polish",
] as const;

type CategoryName = (typeof CATEGORY_ORDER)[number];

const CATEGORY_LABELS: Record<CategoryName, string> = {
  scaffold: "Scaffold",
  cards: "Cards",
  timeline: "Timeline",
  quality: "Quality",
  features: "Features",
  tokens: "Tokens",
  git: "Git",
  polish: "Polish",
};

interface CategoryTotals {
  sum: number;
  count: number;
}

interface CategoryAveragePoint {
  category: CategoryName;
  category_label: string;
  average_score: number;
  feature_count: number;
}

function isKnownCategory(value: string): value is CategoryName {
  return (CATEGORY_ORDER as readonly string[]).includes(value);
}

function isValidScore(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 10;
}

function buildCategoryAverages(features: MetricsFeature[]): CategoryAveragePoint[] {
  const totals = CATEGORY_ORDER.reduce(
    (accumulator, category) => {
      accumulator[category] = { sum: 0, count: 0 };
      return accumulator;
    },
    {} as Record<CategoryName, CategoryTotals>,
  );

  for (const feature of features) {
    if (feature.status === "pending") {
      continue;
    }

    if (!isKnownCategory(feature.category)) {
      continue;
    }

    if (!isValidScore(feature.final_score)) {
      continue;
    }

    totals[feature.category].sum += feature.final_score;
    totals[feature.category].count += 1;
  }

  return CATEGORY_ORDER.map((category) => {
    const total = totals[category];
    const average = total.count > 0 ? total.sum / total.count : 0;

    return {
      category,
      category_label: CATEGORY_LABELS[category],
      average_score: Number(average.toFixed(2)),
      feature_count: total.count,
    };
  }).sort((a, b) => b.average_score - a.average_score || a.category.localeCompare(b.category));
}

export function CategoryAverageScoreBarChart() {
  const { data, isLoading, error } = useMetrics();
  const chartData = useMemo(() => buildCategoryAverages(data.features), [data.features]);
  const hasChartData = chartData.some((point) => point.feature_count > 0);

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Average quality score by category horizontal bar chart" variant="chart" />;
  }

  return (
    <section
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      aria-label="Average quality score by category horizontal bar chart"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Average score by category</h3>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">
          No scored features yet. Category averages appear once features have final scores.
        </p>
      )}

      {!isLoading && hasChartData && (
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 10]}
                tickLine={false}
                stroke="#a1a1aa"
                label={{ value: "Average score", position: "insideBottom", offset: -6, fill: "#a1a1aa" }}
              />
              <YAxis dataKey="category_label" type="category" width={92} tickLine={false} stroke="#a1a1aa" />
              <Tooltip
                cursor={{ fill: "#27272a" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#3f3f46",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: any, _name: any, item: any) => {
                  const point = item?.payload as CategoryAveragePoint | undefined;
                  const count = point?.feature_count ?? 0;
                  const featureLabel = count === 1 ? "feature" : "features";
                  return [`${Number(value).toFixed(2)} / 10`, `Average (${count} ${featureLabel})`];
                }}
                labelFormatter={(value: any) => `${value}`}
              />
              <Bar dataKey="average_score" name="Average score" fill="#34d399" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
