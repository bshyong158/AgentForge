"use client";

import { useMemo } from "react";
import { type MetricsFeature, useMetrics } from "../hooks/useMetrics";
import { MetricsSectionSkeleton } from "./MetricsSectionSkeleton";
import { type CodeVolumeSparklinePoint, CodeVolumeSparkline } from "./CodeVolumeSparkline";

interface CommitFeedItem {
  id: number;
  commitSha: string;
  commitMessage: string;
  completedAtRaw: string;
  completedAtLabel: string;
  completedAtMs: number;
  score: number | null;
  linesAdded: number;
  sparklineData: CodeVolumeSparklinePoint[];
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function isValidScore(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 10;
}

function toCommitMessage(feature: MetricsFeature): string {
  const description = feature.description.trim();
  if (description.length > 0) {
    return `feat(#${feature.id}): ${description}`;
  }

  return `feat(#${feature.id})`;
}

function toTimestampLabel(timestamp: string): { label: string; ms: number } {
  const parsedMs = Date.parse(timestamp);
  if (!Number.isFinite(parsedMs)) {
    return {
      label: "Timestamp unavailable",
      ms: -1,
    };
  }

  return {
    label: DATE_FORMATTER.format(parsedMs),
    ms: parsedMs,
  };
}

function getScoreBadgeClassName(score: number | null): string {
  if (score === null) {
    return "border-zinc-600/40 bg-zinc-700/40 text-zinc-200";
  }

  if (score >= 7) {
    return "border-emerald-400/40 bg-emerald-500/20 text-emerald-200";
  }

  return "border-rose-400/40 bg-rose-500/20 text-rose-200";
}

function formatScore(score: number | null): string {
  if (score === null) {
    return "Score --";
  }

  return `Score ${score.toFixed(1)}`;
}

function normalizeLinesAdded(linesAdded: number): number {
  if (!Number.isFinite(linesAdded) || linesAdded < 0) {
    return 0;
  }

  return Math.round(linesAdded);
}

function buildCommitFeedItems(features: MetricsFeature[]): CommitFeedItem[] {
  const baseItems = features
    .filter((feature) => feature.commit_sha.trim().length > 0)
    .map((feature) => {
      const timestamp = toTimestampLabel(feature.completed_at);

      return {
        id: feature.id,
        commitSha: feature.commit_sha.trim(),
        commitMessage: toCommitMessage(feature),
        completedAtRaw: feature.completed_at,
        completedAtLabel: timestamp.label,
        completedAtMs: timestamp.ms,
        score: isValidScore(feature.final_score) ? feature.final_score : null,
        linesAdded: normalizeLinesAdded(feature.lines_added),
      };
    })
    .sort((left, right) => {
      if (left.completedAtMs !== right.completedAtMs) {
        return left.completedAtMs - right.completedAtMs;
      }

      return left.id - right.id;
    });

  const itemsWithSparkline = baseItems.map((item, index) => {
    const windowStart = Math.max(0, index - 5);
    const sparklineData = baseItems.slice(windowStart, index + 1).map((windowItem) => ({
      featureId: windowItem.id,
      linesAdded: windowItem.linesAdded,
      isCurrent: windowItem.id === item.id,
    }));

    return {
      ...item,
      sparklineData,
    };
  });

  return itemsWithSparkline
    .sort((left, right) => {
      if (left.completedAtMs !== right.completedAtMs) {
        return right.completedAtMs - left.completedAtMs;
      }

      return right.id - left.id;
    });
}

export function GitCommitFeed() {
  const { data, isLoading, error } = useMetrics();
  const commitFeedItems = useMemo(() => buildCommitFeedItems(data.features), [data.features]);

  if (isLoading) {
    return <MetricsSectionSkeleton ariaLabel="Recent commit feed" variant="feed" />;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Recent commit feed">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Recent commits</h3>
        <p className="text-xs text-zinc-500">{commitFeedItems.length} recorded</p>
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && commitFeedItems.length === 0 && (
        <p className="text-sm text-zinc-400">No commit activity yet. Commits appear here once features complete.</p>
      )}

      {!isLoading && commitFeedItems.length > 0 && (
        <ul className="space-y-3" aria-label="Commit log">
          {commitFeedItems.map((item) => (
            <li
              key={`${item.id}-${item.commitSha}`}
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-200">{item.commitMessage}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-zinc-300">
                      {item.commitSha.slice(0, 7)}
                    </span>
                    <time dateTime={item.completedAtRaw || undefined}>{item.completedAtLabel}</time>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${getScoreBadgeClassName(item.score)}`}
                  >
                    {formatScore(item.score)}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <CodeVolumeSparkline data={item.sparklineData} featureId={item.id} />
                    <p className="text-[11px] leading-none text-zinc-500">
                      {item.linesAdded.toLocaleString()} lines
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
