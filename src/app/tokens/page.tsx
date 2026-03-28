"use client";

import { CostPerFeatureLineChart } from "../../components/CostPerFeatureLineChart";
import { RunningTotalCostProjectionChart } from "../../components/RunningTotalCostProjectionChart";
import { TokenSpendPieChart } from "../../components/TokenSpendPieChart";

export default function TokensPage() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Token Economics</h2>
      <p className="text-sm text-zinc-400">Token usage, cost breakdown, and model roles across the build.</p>

      {/* Model Roles */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <p className="font-semibold text-zinc-100">GPT-5.3 Codex</p>
            <span className="ml-auto rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">Builder</span>
          </div>
          <p className="text-sm text-zinc-400">
            Writes all application code via Codex CLI in <code className="text-xs bg-zinc-800 px-1 rounded">--full-auto</code> mode.
            Sandboxed to workspace writes only. One feature per invocation.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-zinc-800/50 px-2 py-1.5">
              <span className="text-zinc-500">Mode</span>
              <p className="font-medium text-zinc-300">codex exec --full-auto</p>
            </div>
            <div className="rounded bg-zinc-800/50 px-2 py-1.5">
              <span className="text-zinc-500">Timeout</span>
              <p className="font-medium text-zinc-300">7 min per feature</p>
            </div>
            <div className="rounded bg-zinc-800/50 px-2 py-1.5">
              <span className="text-zinc-500">Cost</span>
              <p className="font-medium text-zinc-300">~$0.01/1K tokens</p>
            </div>
            <div className="rounded bg-zinc-800/50 px-2 py-1.5">
              <span className="text-zinc-500">Output</span>
              <p className="font-medium text-zinc-300">Code + tests + build</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <p className="font-semibold text-zinc-100">Claude Sonnet 4</p>
            <span className="ml-auto rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">Evaluator</span>
          </div>
          <p className="text-sm text-zinc-400">
            Scores each feature on 3 dimensions via API call. Returns structured JSON with pass/fail and specific feedback per dimension.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-zinc-800/50 px-2 py-1.5">
              <span className="text-zinc-500">Dimensions</span>
              <p className="font-medium text-zinc-300">Complete / Visual / No Placeholders</p>
            </div>
            <div className="rounded bg-zinc-800/50 px-2 py-1.5">
              <span className="text-zinc-500">Weights</span>
              <p className="font-medium text-zinc-300">40% / 30% / 30%</p>
            </div>
            <div className="rounded bg-zinc-800/50 px-2 py-1.5">
              <span className="text-zinc-500">Cost</span>
              <p className="font-medium text-zinc-300">~$0.003/1K tokens</p>
            </div>
            <div className="rounded bg-zinc-800/50 px-2 py-1.5">
              <span className="text-zinc-500">Output</span>
              <p className="font-medium text-zinc-300">Score + feedback JSON</p>
            </div>
          </div>
        </div>
      </div>

      {/* Why two models */}
      <div className="rounded-lg border border-amber-900/30 bg-amber-950/20 px-4 py-3">
        <p className="text-sm text-amber-200/80">
          <span className="font-semibold">Why separate models?</span> The builder (Codex) optimizes for completing the feature.
          The evaluator (Sonnet) optimizes for finding flaws. Same model doing both leads to
          &ldquo;confidently praising its own mediocre work.&rdquo; Different model, fresh context = honest scoring.
        </p>
      </div>

      {/* Charts */}
      <h3 className="text-lg font-semibold text-zinc-200 pt-2">Token Split</h3>
      <TokenSpendPieChart />
      <h3 className="text-lg font-semibold text-zinc-200 pt-2">Cost per Feature</h3>
      <p className="text-xs text-zinc-500">Shows whether the agent becomes more efficient over time.</p>
      <CostPerFeatureLineChart />
      <h3 className="text-lg font-semibold text-zinc-200 pt-2">Running Total &amp; Projection</h3>
      <RunningTotalCostProjectionChart />
    </section>
  );
}
