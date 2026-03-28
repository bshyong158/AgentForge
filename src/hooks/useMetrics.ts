"use client";

import { useEffect, useState } from "react";

export type FeatureStatus = "passed" | "skipped" | "pending";

export interface MetricsAttempt {
  iteration: number;
  score: number;
  feedback: string;
  tokens_coder: number;
  tokens_evaluator: number;
  duration_sec: number;
}

export interface MetricsFeature {
  id: number;
  description: string;
  category: string;
  status: FeatureStatus;
  attempts: MetricsAttempt[];
  final_score: number;
  started_at: string;
  completed_at: string;
  lines_added: number;
  commit_sha: string;
  skip_reason: string;
}

export interface MetricsTotals {
  features_completed: number;
  features_skipped: number;
  total_iterations: number;
  total_tokens_coder: number;
  total_tokens_evaluator: number;
  cost_usd: number;
  started_at: string;
  last_updated: string;
}

export interface MetricsMeta {
  project: string;
  total_features: number;
}

export interface MetricsData {
  features: MetricsFeature[];
  totals: MetricsTotals;
  meta: MetricsMeta;
}

export interface UseMetricsResult {
  data: MetricsData;
  isLoading: boolean;
  error: string | null;
}

const EMPTY_TOTALS: MetricsTotals = {
  features_completed: 0,
  features_skipped: 0,
  total_iterations: 0,
  total_tokens_coder: 0,
  total_tokens_evaluator: 0,
  cost_usd: 0,
  started_at: "",
  last_updated: "",
};

const EMPTY_META: MetricsMeta = {
  project: "AgentForge",
  total_features: 30,
};

export const EMPTY_METRICS_DATA: MetricsData = {
  features: [],
  totals: EMPTY_TOTALS,
  meta: EMPTY_META,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(record: Record<string, unknown>, key: string, fallback = 0): number {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readString(record: Record<string, unknown>, key: string, fallback = ""): string {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
}

function parseAttempt(raw: unknown, index: number): MetricsAttempt {
  const attempt = isObject(raw) ? raw : {};

  return {
    iteration: readNumber(attempt, "iteration", index + 1),
    score: readNumber(attempt, "score"),
    feedback: readString(attempt, "feedback"),
    tokens_coder: readNumber(attempt, "tokens_coder"),
    tokens_evaluator: readNumber(attempt, "tokens_evaluator"),
    duration_sec: readNumber(attempt, "duration_sec"),
  };
}

function parseStatus(value: unknown): FeatureStatus {
  if (value === "passed" || value === "skipped" || value === "pending") {
    return value;
  }

  return "pending";
}

function parseFeature(raw: unknown, index: number): MetricsFeature {
  const feature = isObject(raw) ? raw : {};
  const attemptsRaw = Array.isArray(feature.attempts) ? feature.attempts : [];

  return {
    id: readNumber(feature, "id", index + 1),
    description: readString(feature, "description"),
    category: readString(feature, "category"),
    status: parseStatus(feature.status),
    attempts: attemptsRaw.map(parseAttempt),
    final_score: readNumber(feature, "final_score"),
    started_at: readString(feature, "started_at"),
    completed_at: readString(feature, "completed_at"),
    lines_added: readNumber(feature, "lines_added"),
    commit_sha: readString(feature, "commit_sha"),
    skip_reason: readString(feature, "skip_reason"),
  };
}

function toIsoNow(): string {
  return new Date().toISOString();
}

function parseMetricsData(raw: unknown): MetricsData {
  if (!isObject(raw)) {
    return EMPTY_METRICS_DATA;
  }

  const featuresRaw = Array.isArray(raw.features) ? raw.features : [];
  const features = featuresRaw.map(parseFeature);

  const totals = isObject(raw.totals) ? raw.totals : {};
  const meta = isObject(raw.meta) ? raw.meta : {};

  const featuresCompletedFallback = features.filter((feature) => feature.status === "passed").length;
  const featuresSkippedFallback = features.filter((feature) => feature.status === "skipped").length;
  const totalIterationsFallback = features.reduce((total, feature) => total + feature.attempts.length, 0);
  const totalTokensCoderFallback = features.reduce(
    (total, feature) =>
      total +
      feature.attempts.reduce((attemptTotal, attempt) => attemptTotal + attempt.tokens_coder, 0),
    0,
  );
  const totalTokensEvaluatorFallback = features.reduce(
    (total, feature) =>
      total +
      feature.attempts.reduce((attemptTotal, attempt) => attemptTotal + attempt.tokens_evaluator, 0),
    0,
  );
  const lastUpdatedFallback = features.length > 0 ? toIsoNow() : "";

  const normalizedTotals: MetricsTotals = {
    features_completed: readNumber(totals, "features_completed", featuresCompletedFallback),
    features_skipped: readNumber(totals, "features_skipped", featuresSkippedFallback),
    total_iterations: readNumber(totals, "total_iterations", totalIterationsFallback),
    total_tokens_coder: readNumber(
      totals,
      "total_tokens_coder",
      readNumber(totals, "tokens_coder", totalTokensCoderFallback),
    ),
    total_tokens_evaluator: readNumber(
      totals,
      "total_tokens_evaluator",
      readNumber(totals, "tokens_evaluator", totalTokensEvaluatorFallback),
    ),
    cost_usd: readNumber(totals, "cost_usd"),
    started_at: readString(totals, "started_at", readString(raw, "started_at")),
    last_updated: readString(totals, "last_updated", lastUpdatedFallback),
  };

  const normalizedMeta: MetricsMeta = {
    project: readString(meta, "project", readString(raw, "project", EMPTY_META.project)),
    total_features: readNumber(meta, "total_features", EMPTY_META.total_features),
  };

  return {
    features,
    totals: normalizedTotals,
    meta: normalizedMeta,
  };
}

export function useMetrics(): UseMetricsResult {
  const [data, setData] = useState<MetricsData>(EMPTY_METRICS_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMetrics = async () => {
      try {
        const response = await fetch("/metrics.json", { cache: "no-store" });

        if (!response.ok) {
          if (response.status === 404) {
            if (isMounted) {
              setData(EMPTY_METRICS_DATA);
              setError(null);
            }
            return;
          }

          throw new Error(`Failed to fetch metrics.json (${response.status})`);
        }

        const metricsJson: unknown = await response.json();

        if (isMounted) {
          setData(parseMetricsData(metricsJson));
          setError(null);
        }
      } catch (caughtError) {
        if (isMounted) {
          setData(EMPTY_METRICS_DATA);
          setError(caughtError instanceof Error ? caughtError.message : "Failed to load metrics data.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading, error };
}
