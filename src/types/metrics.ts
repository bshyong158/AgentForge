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
  status: string;
  attempts: MetricsAttempt[];
  final_score: number;
  started_at: string;
  completed_at: string;
  lines_added: number;
  commit_sha: string;
}

export interface MetricsTotals {
  tokens_coder: number;
  tokens_evaluator: number;
  cost_usd: number;
  elapsed_sec: number;
}

export interface MetricsData {
  project: string;
  started_at: string;
  features: MetricsFeature[];
  totals: MetricsTotals;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(
  source: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = source[key];
  return typeof value === "string" ? value : fallback;
}

function readNumber(
  source: Record<string, unknown>,
  key: string,
  fallback = 0,
): number {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeAttempt(value: unknown): MetricsAttempt {
  if (!isRecord(value)) {
    return {
      iteration: 0,
      score: 0,
      feedback: "",
      tokens_coder: 0,
      tokens_evaluator: 0,
      duration_sec: 0,
    };
  }

  return {
    iteration: readNumber(value, "iteration"),
    score: readNumber(value, "score"),
    feedback: readString(value, "feedback"),
    tokens_coder: readNumber(value, "tokens_coder"),
    tokens_evaluator: readNumber(value, "tokens_evaluator"),
    duration_sec: readNumber(value, "duration_sec"),
  };
}

function normalizeFeature(value: unknown): MetricsFeature {
  if (!isRecord(value)) {
    return {
      id: 0,
      description: "",
      category: "",
      status: "",
      attempts: [],
      final_score: 0,
      started_at: "",
      completed_at: "",
      lines_added: 0,
      commit_sha: "",
    };
  }

  return {
    id: readNumber(value, "id"),
    description: readString(value, "description"),
    category: readString(value, "category"),
    status: readString(value, "status"),
    attempts: Array.isArray(value.attempts)
      ? value.attempts.map((attempt) => normalizeAttempt(attempt))
      : [],
    final_score: readNumber(value, "final_score"),
    started_at: readString(value, "started_at"),
    completed_at: readString(value, "completed_at"),
    lines_added: readNumber(value, "lines_added"),
    commit_sha: readString(value, "commit_sha"),
  };
}

function normalizeTotals(value: unknown): MetricsTotals {
  if (!isRecord(value)) {
    return {
      tokens_coder: 0,
      tokens_evaluator: 0,
      cost_usd: 0,
      elapsed_sec: 0,
    };
  }

  return {
    tokens_coder: readNumber(value, "tokens_coder"),
    tokens_evaluator: readNumber(value, "tokens_evaluator"),
    cost_usd: readNumber(value, "cost_usd"),
    elapsed_sec: readNumber(value, "elapsed_sec"),
  };
}

export function createEmptyMetricsData(): MetricsData {
  return {
    project: "",
    started_at: "",
    features: [],
    totals: {
      tokens_coder: 0,
      tokens_evaluator: 0,
      cost_usd: 0,
      elapsed_sec: 0,
    },
  };
}

export function normalizeMetricsData(value: unknown): MetricsData {
  if (!isRecord(value)) {
    return createEmptyMetricsData();
  }

  return {
    project: readString(value, "project"),
    started_at: readString(value, "started_at"),
    features: Array.isArray(value.features)
      ? value.features.map((feature) => normalizeFeature(feature))
      : [],
    totals: normalizeTotals(value.totals),
  };
}
