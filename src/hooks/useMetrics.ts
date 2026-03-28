"use client";

import { useEffect, useState } from "react";
import {
  createEmptyMetricsData,
  normalizeMetricsData,
} from "@/types/metrics";
import type {
  MetricsAttempt,
  MetricsData,
  MetricsFeature,
  MetricsTotals,
} from "@/types/metrics";

interface UseMetricsResult {
  metrics: MetricsData;
  isLoading: boolean;
  error: string | null;
}

const METRICS_ENDPOINT = "/metrics.json";

export function useMetrics(): UseMetricsResult {
  const [metrics, setMetrics] = useState<MetricsData>(() =>
    createEmptyMetricsData(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMetrics = async () => {
      try {
        const response = await fetch(METRICS_ENDPOINT, { cache: "no-store" });

        if (!response.ok) {
          if (response.status === 404) {
            if (isMounted) {
              setMetrics(createEmptyMetricsData());
              setError(null);
            }
            return;
          }

          throw new Error(`Failed to fetch metrics: ${response.status}`);
        }

        const payload: unknown = await response.json();

        if (isMounted) {
          setMetrics(normalizeMetricsData(payload));
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setMetrics(createEmptyMetricsData());
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load metrics",
          );
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

  return { metrics, isLoading, error };
}

export type { MetricsAttempt, MetricsData, MetricsFeature, MetricsTotals };
