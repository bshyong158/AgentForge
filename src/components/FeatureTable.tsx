"use client";

import { useMemo, useState } from "react";
import { type FeatureStatus, type MetricsFeature, useMetrics } from "../hooks/useMetrics";

type SortKey = "id" | "description" | "category" | "score" | "iterations" | "status" | "duration";
type SortDirection = "asc" | "desc";

interface FeatureTableRow {
  id: number;
  description: string;
  category: string;
  score: number | null;
  iterations: number;
  status: FeatureStatus;
  durationMinutes: number | null;
}

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

const DEFAULT_SORT: SortState = {
  key: "id",
  direction: "asc",
};

const STATUS_ORDER: Record<FeatureStatus, number> = {
  passed: 0,
  skipped: 1,
  pending: 2,
};

const TABLE_COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: "id", label: "ID" },
  { key: "description", label: "Description" },
  { key: "category", label: "Category" },
  { key: "score", label: "Score" },
  { key: "iterations", label: "Iterations" },
  { key: "status", label: "Status" },
  { key: "duration", label: "Duration" },
];

function isValidScore(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 10;
}

function readDurationMinutes(feature: MetricsFeature): number | null {
  const startedMs = Date.parse(feature.started_at);
  const completedMs = Date.parse(feature.completed_at);

  if (Number.isFinite(startedMs) && Number.isFinite(completedMs)) {
    const diffMs = completedMs - startedMs;
    if (diffMs >= 0) {
      return diffMs / 60_000;
    }
  }

  const attemptsDurationSec = feature.attempts.reduce((sum, attempt) => sum + attempt.duration_sec, 0);
  if (attemptsDurationSec > 0) {
    return attemptsDurationSec / 60;
  }

  return null;
}

function buildRows(features: MetricsFeature[], totalFeatures: number): FeatureTableRow[] {
  const featuresById = new Map<number, MetricsFeature>();
  for (const feature of features) {
    featuresById.set(feature.id, feature);
  }

  const rows: FeatureTableRow[] = [];
  for (let id = 1; id <= totalFeatures; id += 1) {
    const feature = featuresById.get(id);
    if (!feature) {
      rows.push({
        id,
        description: "Pending feature",
        category: "pending",
        score: null,
        iterations: 0,
        status: "pending",
        durationMinutes: null,
      });
      continue;
    }

    rows.push({
      id,
      description: feature.description || "No description available",
      category: feature.category || "unknown",
      score: isValidScore(feature.final_score) ? feature.final_score : null,
      iterations: feature.attempts.length,
      status: feature.status,
      durationMinutes: readDurationMinutes(feature),
    });
  }

  return rows;
}

function compareNullableNumber(a: number | null, b: number | null): number {
  if (a === null && b === null) {
    return 0;
  }
  if (a === null) {
    return 1;
  }
  if (b === null) {
    return -1;
  }
  return a - b;
}

function compareRows(a: FeatureTableRow, b: FeatureTableRow, key: SortKey): number {
  switch (key) {
    case "id":
      return a.id - b.id;
    case "description":
      return a.description.localeCompare(b.description);
    case "category":
      return a.category.localeCompare(b.category);
    case "score":
      return compareNullableNumber(a.score, b.score);
    case "iterations":
      return a.iterations - b.iterations;
    case "status":
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case "duration":
      return compareNullableNumber(a.durationMinutes, b.durationMinutes);
    default:
      return 0;
  }
}

function getStatusClasses(status: FeatureStatus): string {
  if (status === "passed") {
    return "bg-emerald-500/20 text-emerald-300 border-emerald-400/30";
  }

  if (status === "skipped") {
    return "bg-amber-500/20 text-amber-200 border-amber-400/30";
  }

  return "bg-zinc-700/30 text-zinc-300 border-zinc-500/30";
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

function formatDurationMinutes(durationMinutes: number | null): string {
  if (durationMinutes === null) {
    return "--";
  }

  return `${durationMinutes.toFixed(1)}m`;
}

function SortIndicator({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) {
    return <span className="text-zinc-600">-</span>;
  }

  return <span>{direction === "asc" ? "↑" : "↓"}</span>;
}

export function FeatureTable() {
  const { data, isLoading, error } = useMetrics();
  const [sortState, setSortState] = useState<SortState>(DEFAULT_SORT);

  const totalFeatures = data.meta.total_features > 0 ? data.meta.total_features : 30;
  const rows = useMemo(() => buildRows(data.features, totalFeatures), [data.features, totalFeatures]);

  const sortedRows = useMemo(() => {
    const nextRows = [...rows];
    nextRows.sort((a, b) => {
      const result = compareRows(a, b, sortState.key);
      if (result !== 0) {
        return sortState.direction === "asc" ? result : -result;
      }
      return a.id - b.id;
    });
    return nextRows;
  }, [rows, sortState.direction, sortState.key]);

  const hasMetricsRows = data.features.length > 0;

  const handleSort = (key: SortKey) => {
    setSortState((previous) => {
      if (previous.key === key) {
        return {
          key,
          direction: previous.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  };

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Feature table">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Feature details</h3>
      </div>

      {isLoading && <p className="mb-4 text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="mb-4 text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasMetricsRows && (
        <p className="mb-4 text-sm text-zinc-400">No feature metrics yet. Showing pending rows until data arrives.</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800 text-sm">
          <thead className="bg-zinc-950/70">
            <tr>
              {TABLE_COLUMNS.map((column) => {
                const isActiveColumn = sortState.key === column.key;

                return (
                  <th key={column.key} scope="col" className="px-3 py-2 text-left">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition-colors hover:text-zinc-100"
                      onClick={() => handleSort(column.key)}
                    >
                      <span>{column.label}</span>
                      <SortIndicator
                        active={isActiveColumn}
                        direction={isActiveColumn ? sortState.direction : "asc"}
                      />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {sortedRows.map((row) => {
              const isPending = row.status === "pending";
              const rowTextColor = isPending ? "text-zinc-500" : "text-zinc-200";
              const rowBackground = isPending ? "bg-zinc-950/40" : "bg-zinc-950/10";

              return (
                <tr key={row.id} className={rowBackground}>
                  <td className={`px-3 py-3 tabular-nums ${rowTextColor}`}>{row.id}</td>
                  <td className={`max-w-xs px-3 py-3 ${rowTextColor}`}>
                    <p className="truncate" title={row.description}>
                      {row.description}
                    </p>
                  </td>
                  <td className={`px-3 py-3 capitalize ${rowTextColor}`}>{row.category}</td>
                  <td className={`px-3 py-3 tabular-nums ${rowTextColor}`}>
                    {row.score === null ? "--" : row.score.toFixed(1)}
                  </td>
                  <td className={`px-3 py-3 tabular-nums ${rowTextColor}`}>{row.iterations}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${getStatusClasses(row.status)}`}>
                      {formatStatus(row.status)}
                    </span>
                  </td>
                  <td className={`px-3 py-3 tabular-nums ${rowTextColor}`}>
                    {formatDurationMinutes(row.durationMinutes)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
