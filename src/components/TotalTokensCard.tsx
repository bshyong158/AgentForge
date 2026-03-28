"use client";

import { useMemo } from "react";
import { useMetrics } from "../hooks/useMetrics";

const TOKEN_FORMATTER = new Intl.NumberFormat("en-US");
const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function TotalTokensCard() {
  const { data, isLoading, error } = useMetrics();

  const { totalTokens, totalCost } = useMemo(() => {
    const tokensCoder = data.totals.total_tokens_coder;
    const tokensEvaluator = data.totals.total_tokens_evaluator;

    return {
      totalTokens: tokensCoder + tokensEvaluator,
      totalCost: data.totals.cost_usd,
    };
  }, [data.totals.cost_usd, data.totals.total_tokens_coder, data.totals.total_tokens_evaluator]);

  const hasTokenData = totalTokens > 0 || totalCost > 0;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Total tokens and cost">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Token spend</h3>
      </div>

      <p className="text-3xl font-semibold tabular-nums text-zinc-100">
        {TOKEN_FORMATTER.format(totalTokens)} <span className="text-sm text-zinc-400">tokens</span>
      </p>
      <p className="mt-2 text-xs text-zinc-400">Estimated cost: {USD_FORMATTER.format(totalCost)}</p>

      {isLoading && <p className="mt-3 text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="mt-3 text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasTokenData && (
        <p className="mt-3 text-sm text-zinc-400">
          No token usage yet. Token and cost totals appear once feature runs are recorded.
        </p>
      )}
    </section>
  );
}
