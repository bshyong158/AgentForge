"use client";

import { Fragment, useMemo, useState, type KeyboardEvent } from "react";
import { type FeatureStatus, type MetricsFeature, useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";

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
  attempts: MetricsFeature["attempts"];
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
        attempts: [],
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
      attempts: feature.attempts,
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

function formatAttemptScore(score: number): string {
  if (!isValidScore(score)) {
    return "--";
  }

  return score.toFixed(1);
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
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const totalFeatures = data.meta.total_features > 0 ? data.meta.total_features : 30;
  const rows = useMemo(() => buildRows(data.features, totalFeatures), [data.features, totalFeatures]);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const categoryOptions = useMemo(() => {
    const categories = new Set(rows.map((row) => row.category));
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        normalizedSearchQuery.length === 0 || row.description.toLowerCase().includes(normalizedSearchQuery);
      const matchesCategory = selectedCategory === "all" || row.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [rows, normalizedSearchQuery, selectedCategory]);

  const sortedRows = useMemo(() => {
    const nextRows = [...filteredRows];
    nextRows.sort((a, b) => {
      const result = compareRows(a, b, sortState.key);
      if (result !== 0) {
        return sortState.direction === "asc" ? result : -result;
      }
      return a.id - b.id;
    });
    return nextRows;
  }, [filteredRows, sortState.direction, sortState.key]);

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

  const toggleExpandedRow = (rowId: number) => {
    setExpandedRowId((previous) => (previous === rowId ? null : rowId));
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, rowId: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleExpandedRow(rowId);
    }
  };

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Feature table" variant="table" />;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Feature table">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Feature details</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[34rem]">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Filter descriptions..."
              className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Category</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
            >
              <option value="all">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
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
            {sortedRows.length === 0 ? (
              <tr className="bg-zinc-950/40">
                <td colSpan={TABLE_COLUMNS.length} className="px-3 py-6 text-center text-sm text-zinc-400">
                  No features match the current search and category filters.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const isPending = row.status === "pending";
                const isExpanded = expandedRowId === row.id;
                const rowTextColor = isPending ? "text-zinc-500" : "text-zinc-200";
                const rowBackground = isPending ? "bg-zinc-950/40" : "bg-zinc-950/10";

                return (
                  <Fragment key={row.id}>
                    <tr
                      className={`${rowBackground} cursor-pointer transition-colors hover:bg-zinc-800/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60`}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-controls={`feature-feedback-${row.id}`}
                      onClick={() => toggleExpandedRow(row.id)}
                      onKeyDown={(event) => handleRowKeyDown(event, row.id)}
                    >
                      <td className={`px-3 py-3 tabular-nums ${rowTextColor}`}>
                        <span className="mr-2 text-zinc-500" aria-hidden="true">
                          {isExpanded ? "▾" : "▸"}
                        </span>
                        {row.id}
                      </td>
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
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${getStatusClasses(row.status)}`}
                        >
                          {formatStatus(row.status)}
                        </span>
                      </td>
                      <td className={`px-3 py-3 tabular-nums ${rowTextColor}`}>
                        {formatDurationMinutes(row.durationMinutes)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr id={`feature-feedback-${row.id}`} className="bg-zinc-950/80">
                        <td colSpan={TABLE_COLUMNS.length} className="px-4 py-3">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Evaluator feedback</p>
                            {row.attempts.length === 0 ? (
                              <p className="text-sm text-zinc-400">No attempt feedback is available for this feature yet.</p>
                            ) : (
                              <ul className="space-y-2">
                                {row.attempts.map((attempt, index) => (
                                  <li
                                    key={`${row.id}-${attempt.iteration}-${index}`}
                                    className="rounded-md border border-zinc-700/60 bg-zinc-900/60 p-3"
                                  >
                                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-zinc-400">
                                      <span>Attempt {attempt.iteration || index + 1}</span>
                                      <span className="tabular-nums text-zinc-300">
                                        Score: {formatAttemptScore(attempt.score)}
                                      </span>
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm text-zinc-200">
                                      {attempt.feedback || "No evaluator feedback provided."}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
