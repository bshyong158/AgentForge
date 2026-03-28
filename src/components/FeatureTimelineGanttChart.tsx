"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type FeatureStatus, type MetricsFeature, useMetrics } from "../hooks/useMetrics";

interface TimelinePoint {
  feature_id: number;
  feature_label: string;
  status: FeatureStatus;
  started_at_ms: number;
  completed_at_ms: number;
  start_offset_minutes: number;
  duration_minutes: number;
}

interface RawTimelinePoint {
  feature_id: number;
  status: FeatureStatus;
  started_at_ms: number;
  completed_at_ms: number;
  duration_minutes: number;
}

const STATUS_COLORS: Record<FeatureStatus, string> = {
  passed: "#22c55e",
  skipped: "#f59e0b",
  pending: "#52525b",
};

function parseTimestampMs(value: string): number | null {
  const parsedTimestamp = Date.parse(value);
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : null;
}

function formatStatus(status: FeatureStatus): string {
  if (status === "passed") {
    return "Passed";
  }

  if (status === "skipped") {
    return "Skipped";
  }

  return "Pending";
}

function formatMinutes(value: number): string {
  if (!Number.isFinite(value)) {
    return "0.0";
  }

  return value.toFixed(1);
}

function buildTimelineSeries(features: MetricsFeature[]): TimelinePoint[] {
  const rawPoints: RawTimelinePoint[] = [];

  for (const feature of features) {
    const startedAtMs = parseTimestampMs(feature.started_at);
    const completedAtMs = parseTimestampMs(feature.completed_at);

    if (startedAtMs === null || completedAtMs === null || completedAtMs < startedAtMs) {
      continue;
    }

    rawPoints.push({
      feature_id: feature.id,
      status: feature.status,
      started_at_ms: startedAtMs,
      completed_at_ms: completedAtMs,
      duration_minutes: (completedAtMs - startedAtMs) / 60_000,
    });
  }

  if (rawPoints.length === 0) {
    return [];
  }

  rawPoints.sort((a, b) => {
    if (a.started_at_ms !== b.started_at_ms) {
      return a.started_at_ms - b.started_at_ms;
    }

    return a.feature_id - b.feature_id;
  });

  const earliestStartMs = rawPoints[0].started_at_ms;

  return rawPoints.map((point) => ({
    feature_id: point.feature_id,
    feature_label: `#${point.feature_id}`,
    status: point.status,
    started_at_ms: point.started_at_ms,
    completed_at_ms: point.completed_at_ms,
    start_offset_minutes: (point.started_at_ms - earliestStartMs) / 60_000,
    duration_minutes: point.duration_minutes,
  }));
}

function TimelineTooltipContent({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as TimelinePoint | undefined;
  if (!point) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950/95 p-3 text-xs text-zinc-200 shadow-lg">
      <p className="font-semibold text-zinc-100">Feature #{point.feature_id}</p>
      <p className="text-zinc-400">{formatStatus(point.status)}</p>
      <p className="mt-2 text-zinc-300">
        Start: <span className="tabular-nums text-zinc-100">{new Date(point.started_at_ms).toLocaleString()}</span>
      </p>
      <p className="text-zinc-300">
        End: <span className="tabular-nums text-zinc-100">{new Date(point.completed_at_ms).toLocaleString()}</span>
      </p>
      <p className="mt-1 text-zinc-300">
        Duration: <span className="tabular-nums text-zinc-100">{formatMinutes(point.duration_minutes)} min</span>
      </p>
    </div>
  );
}

export function FeatureTimelineGanttChart() {
  const { data, isLoading, error } = useMetrics();
  const chartData = useMemo(() => buildTimelineSeries(data.features), [data.features]);
  const hasChartData = chartData.length > 0;
  const chartHeight = Math.max(320, chartData.length * 34);

  return (
    <section
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      aria-label="Feature timeline Gantt chart"
    >
      <div className="mb-4 flex flex-col gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Feature timeline (Gantt view)</h3>
        <p className="text-sm text-zinc-400">
          Bars are ordered by start time. Left offset indicates when each feature started, and width shows duration.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            Passed
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
            Skipped
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-zinc-500" />
            Pending
          </span>
        </div>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">
          No feature timeline data yet. Bars appear after features have valid start and completion timestamps.
        </p>
      )}

      {!isLoading && hasChartData && (
        <div className="max-h-[36rem] overflow-y-auto pr-2">
          <div style={{ height: chartHeight, minWidth: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 12, right: 24, bottom: 12, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#a1a1aa"
                  tickLine={false}
                  tickFormatter={(value: number) => `${formatMinutes(Number(value))}m`}
                />
                <YAxis
                  type="category"
                  dataKey="feature_label"
                  stroke="#a1a1aa"
                  tickLine={false}
                  width={56}
                  interval={0}
                />
                <Tooltip cursor={{ fill: "#27272a" }} content={<TimelineTooltipContent />} />
                <Bar dataKey="start_offset_minutes" stackId="timeline" fill="transparent" isAnimationActive={false} />
                <Bar dataKey="duration_minutes" stackId="timeline" radius={[4, 4, 4, 4]} isAnimationActive={false}>
                  {chartData.map((entry) => (
                    <Cell key={`timeline-duration-${entry.feature_id}`} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
