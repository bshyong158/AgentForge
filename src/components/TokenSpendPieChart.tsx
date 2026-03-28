"use client";

import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useMetrics } from "../hooks/useMetrics";

interface TokenSpendPoint {
  role: "Coder" | "Evaluator";
  tokens: number;
}

const TOKEN_COLORS = {
  Coder: "#38bdf8",
  Evaluator: "#f97316",
} as const;

function buildTokenSpendData(coderTokens: number, evaluatorTokens: number): TokenSpendPoint[] {
  return [
    { role: "Coder", tokens: Math.max(0, coderTokens) },
    { role: "Evaluator", tokens: Math.max(0, evaluatorTokens) },
  ];
}

export function TokenSpendPieChart() {
  const { data, isLoading, error } = useMetrics();
  const chartData = useMemo(
    () => buildTokenSpendData(data.totals.total_tokens_coder, data.totals.total_tokens_evaluator),
    [data.totals.total_tokens_coder, data.totals.total_tokens_evaluator],
  );
  const totalTokens = chartData.reduce((sum, point) => sum + point.tokens, 0);
  const hasChartData = totalTokens > 0;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5" aria-label="Token spend split chart">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Token spend split</h3>
        {hasChartData && <p className="text-xs text-zinc-400">Total: {totalTokens.toLocaleString()} tokens</p>}
      </div>

      {isLoading && <p className="text-sm text-zinc-400">Loading metrics...</p>}
      {!isLoading && error && <p className="text-sm text-amber-300">Using empty metrics data.</p>}
      {!isLoading && !hasChartData && (
        <p className="text-sm text-zinc-400">No token usage yet. The pie chart appears after metrics include token spend.</p>
      )}

      {!isLoading && hasChartData && (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="tokens"
                nameKey="role"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={108}
                labelLine={false}
                label={({ role, percent }: any) => `${role} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((point) => (
                  <Cell key={`token-slice-${point.role}`} fill={TOKEN_COLORS[point.role]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#3f3f46",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: any) => [Number(value).toLocaleString(), "Tokens"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
