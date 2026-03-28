'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────
interface Attempt {
  iteration: number;
  score: number;
  feedback: string;
  tokens_coder: number;
  tokens_evaluator: number;
  duration_sec: number;
}

interface Feature {
  id: number;
  description: string;
  category: string;
  status: 'passed' | 'skipped';
  attempts: Attempt[];
  final_score: number;
  started_at: string;
  completed_at: string;
  lines_added: number;
  commit_sha: string;
}

interface Metrics {
  project: string;
  started_at: string | null;
  features: Feature[];
  totals: {
    tokens_coder: number;
    tokens_evaluator: number;
    cost_usd: number;
    elapsed_sec: number;
  };
}

const TOTAL_FEATURES = 30;
const COLORS = {
  green: '#22c55e', red: '#ef4444', blue: '#3b82f6', purple: '#a855f7',
  amber: '#f59e0b', cyan: '#06b6d4', pink: '#ec4899', zinc: '#71717a',
};
const CATEGORY_COLORS: Record<string, string> = {
  scaffold: COLORS.blue, cards: COLORS.green, timeline: COLORS.purple,
  quality: COLORS.amber, features: COLORS.cyan, tokens: COLORS.pink,
  git: COLORS.red, polish: '#8b5cf6',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function elapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${sec % 60}s`;
}

function fmtCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function timeSince(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m ago`;
}

function linearRegression(pts: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = pts.length;
  if (n < 2) return { slope: 0, intercept: pts[0]?.y ?? 0 };
  const sx = pts.reduce((a, p) => a + p.x, 0);
  const sy = pts.reduce((a, p) => a + p.y, 0);
  const sxy = pts.reduce((a, p) => a + p.x * p.y, 0);
  const sx2 = pts.reduce((a, p) => a + p.x * p.x, 0);
  const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

// ── Components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-900/60 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 mb-4 text-lg font-semibold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 pb-2">{children}</h2>;
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-zinc-700 text-zinc-600 text-sm">
      {msg}
    </div>
  );
}

function Badge({ score }: { score: number }) {
  const bg = score >= 7 ? 'bg-green-500/20 text-green-400' : score >= 5 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400';
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${bg}`}>{score}/10</span>;
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/metrics.json', { cache: 'no-store' });
      if (res.ok) {
        setMetrics(await res.json());
        setLastRefresh(new Date());
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const id = setInterval(fetchMetrics, 15_000);
    return () => clearInterval(id);
  }, [fetchMetrics]);

  if (!metrics) {
    return (
      <main className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse text-lg">Loading metrics...</div>
      </main>
    );
  }

  const passed = metrics.features.filter(f => f.status === 'passed');
  const skipped = metrics.features.filter(f => f.status === 'skipped');
  const avgScore = passed.length > 0
    ? +(passed.reduce((a, f) => a + f.final_score, 0) / passed.length).toFixed(1)
    : 0;
  const totalIterations = metrics.features.reduce((a, f) => a + f.attempts.length, 0);
  const totalTokens = metrics.totals.tokens_coder + metrics.totals.tokens_evaluator;

  // Score trend: last 5 vs overall
  const last5Avg = passed.length >= 5
    ? passed.slice(-5).reduce((a, f) => a + f.final_score, 0) / 5
    : avgScore;
  const trendArrow = last5Avg > avgScore + 0.2 ? '↑' : last5Avg < avgScore - 0.2 ? '↓' : '→';
  const trendColor = trendArrow === '↑' ? COLORS.green : trendArrow === '↓' ? COLORS.red : COLORS.amber;

  // Cumulative features over time
  const cumulativeData = passed.map((f, i) => ({
    time: new Date(f.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    count: i + 1,
    id: f.id,
  }));

  // Score per feature
  const scoreData = metrics.features.map(f => ({
    id: `#${f.id}`,
    score: f.final_score,
    fill: f.final_score >= 7 ? COLORS.green : f.final_score >= 5 ? COLORS.amber : COLORS.red,
    status: f.status,
  }));

  // Iterations per feature (stacked)
  const iterData = metrics.features.map(f => ({
    id: `#${f.id}`,
    first: 1,
    revisions: Math.max(0, f.attempts.length - 1),
  }));

  // Duration per feature (minutes)
  const durationData = metrics.features.filter(f => f.status === 'passed').map(f => {
    const dur = f.attempts.reduce((a, att) => a + att.duration_sec, 0);
    return { id: `#${f.id}`, minutes: +(dur / 60).toFixed(1) };
  });

  // First vs final score scatter
  const scatterData = metrics.features.filter(f => f.attempts.length > 0).map(f => ({
    first: f.attempts[0].score,
    final: f.final_score,
    id: f.id,
  }));

  // Category breakdown
  const catMap = new Map<string, number[]>();
  passed.forEach(f => {
    const arr = catMap.get(f.category) || [];
    arr.push(f.final_score);
    catMap.set(f.category, arr);
  });
  const categoryData = Array.from(catMap.entries()).map(([cat, scores]) => ({
    category: cat,
    avg: +(scores.reduce((a, s) => a + s, 0) / scores.length).toFixed(1),
    fill: CATEGORY_COLORS[cat] || COLORS.zinc,
  })).sort((a, b) => b.avg - a.avg);

  // Token split
  const tokenPie = [
    { name: 'Coder', value: metrics.totals.tokens_coder, color: COLORS.blue },
    { name: 'Evaluator', value: metrics.totals.tokens_evaluator, color: COLORS.purple },
  ];

  // Cost per feature
  const costData = metrics.features.filter(f => f.status === 'passed').map(f => {
    const tc = f.attempts.reduce((a, att) => a + att.tokens_coder, 0);
    const te = f.attempts.reduce((a, att) => a + att.tokens_evaluator, 0);
    return { id: `#${f.id}`, cost: +(tc * 0.00001 + te * 0.000003).toFixed(4) };
  });

  // Improvement trend line
  const trendPts = passed.map((f, i) => ({ x: i, y: f.final_score }));
  const reg = linearRegression(trendPts);

  const noData = metrics.features.length === 0;

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950/90 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">AgentForge</h1>
          <span className="text-xs text-zinc-600 bg-zinc-300 dark:bg-zinc-800 rounded-full px-2 py-0.5">
            {metrics.started_at ? 'LIVE' : 'IDLE'}
          </span>
          {metrics.started_at && (
            <span className="text-xs text-zinc-500">
              Running {elapsed(metrics.totals.elapsed_sec)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-600">
            Refreshed {timeSince(lastRefresh.toISOString())} &middot; auto every 15s
          </span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Auto-refreshing" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Features"
            value={`${passed.length} / ${TOTAL_FEATURES}`}
            sub={skipped.length > 0 ? `${skipped.length} skipped` : `${TOTAL_FEATURES - passed.length - skipped.length} remaining`}
            color={COLORS.green}
          />
          <StatCard
            label="Avg Score"
            value={avgScore > 0 ? `${avgScore}` : '—'}
            sub={passed.length >= 3 ? `Trend ${trendArrow}` : 'Not enough data'}
            color={trendColor}
          />
          <StatCard
            label="Iterations"
            value={totalIterations > 0 ? String(totalIterations) : '—'}
            sub={passed.length > 0 ? `${(totalIterations / metrics.features.length).toFixed(1)} avg per feature` : undefined}
            color={COLORS.blue}
          />
          <StatCard
            label="Tokens / Cost"
            value={totalTokens > 0 ? fmtTokens(totalTokens) : '—'}
            sub={totalTokens > 0 ? fmtCost(metrics.totals.cost_usd) : undefined}
            color={COLORS.purple}
          />
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-3 rounded-full bg-zinc-300 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${(passed.length / TOTAL_FEATURES) * 100}%`,
              background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.green})`,
            }}
          />
        </div>
        <p className="mt-1 text-xs text-zinc-600 text-right">{Math.round((passed.length / TOTAL_FEATURES) * 100)}% complete</p>

        {noData ? (
          <div className="mt-16">
            <EmptyState msg="Waiting for the Ralph Loop to complete its first feature..." />
            <p className="text-center text-zinc-600 text-sm mt-4">
              The dashboard auto-refreshes every 15 seconds. Metrics will appear as features are built.
            </p>
          </div>
        ) : (
          <>
            {/* ── Build Timeline ─────────────────────────────────────── */}
            <SectionTitle>Build Timeline</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cumulative completion */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 p-4">
                <p className="text-sm text-zinc-500 mb-3">Cumulative Features Completed</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={cumulativeData}>
                    <defs>
                      <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="time" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis domain={[0, TOTAL_FEATURES]} tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="count" stroke={COLORS.green} fill="url(#gradGreen)" strokeWidth={2} />
                    <ReferenceLine y={TOTAL_FEATURES} stroke={COLORS.zinc} strokeDasharray="3 3" label={{ value: 'Goal: 30', fill: '#71717a', fontSize: 11 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Score per feature */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 p-4">
                <p className="text-sm text-zinc-500 mb-3">Quality Score per Feature</p>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="id" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                    <ReferenceLine y={7} stroke={COLORS.green} strokeDasharray="3 3" label={{ value: 'Pass', fill: COLORS.green, fontSize: 10 }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {scoreData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Bar>
                    {trendPts.length >= 3 && (
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke={COLORS.amber}
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="6 3"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Iterations per feature */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 p-4">
                <p className="text-sm text-zinc-500 mb-3">Iterations per Feature</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={iterData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="id" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis domain={[0, 4]} tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                    <Bar dataKey="first" stackId="a" fill={COLORS.blue} name="First attempt" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="revisions" stackId="a" fill={COLORS.amber} name="Revisions" radius={[4, 4, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#71717a' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Duration per feature */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 p-4">
                <p className="text-sm text-zinc-500 mb-3">Time per Feature (min)</p>
                {durationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={durationData}>
                      <defs>
                        <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={COLORS.cyan} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="id" tick={{ fill: '#71717a', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                      <Area type="monotone" dataKey="minutes" stroke={COLORS.cyan} fill="url(#gradCyan)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <EmptyState msg="Waiting for timing data..." />}
              </div>
            </div>

            {/* ── Quality Analysis ───────────────────────────────────── */}
            <SectionTitle>Quality Analysis</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Improvement trend */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 p-4">
                <p className="text-sm text-zinc-500 mb-1">Score Improvement Trend</p>
                <p className="text-xs mb-3" style={{ color: reg.slope > 0 ? COLORS.green : reg.slope < 0 ? COLORS.red : COLORS.amber }}>
                  Slope: {reg.slope > 0 ? '+' : ''}{reg.slope.toFixed(3)} per feature {reg.slope > 0 ? '(improving)' : reg.slope < 0 ? '(declining)' : '(stable)'}
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" dataKey="x" name="Feature #" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis type="number" dataKey="y" domain={[0, 10]} name="Score" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                    <Scatter data={trendPts} fill={COLORS.green}>
                      {trendPts.map((_, i) => (
                        <Cell key={i} fill={COLORS.green} />
                      ))}
                    </Scatter>
                    {trendPts.length >= 2 && (
                      <ReferenceLine
                        segment={[
                          { x: 0, y: reg.intercept },
                          { x: trendPts.length - 1, y: reg.intercept + reg.slope * (trendPts.length - 1) },
                        ]}
                        stroke={COLORS.amber}
                        strokeWidth={2}
                        strokeDasharray="6 3"
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* First vs Final scatter */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 p-4">
                <p className="text-sm text-zinc-500 mb-3">First Attempt vs Final Score</p>
                {scatterData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis type="number" dataKey="first" name="First" domain={[0, 10]} tick={{ fill: '#71717a', fontSize: 11 }} label={{ value: 'First Attempt', position: 'insideBottom', offset: -5, fill: '#52525b', fontSize: 10 }} />
                      <YAxis type="number" dataKey="final" name="Final" domain={[0, 10]} tick={{ fill: '#71717a', fontSize: 11 }} label={{ value: 'Final Score', angle: -90, position: 'insideLeft', fill: '#52525b', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                      <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 10, y: 10 }]} stroke={COLORS.zinc} strokeDasharray="3 3" />
                      <Scatter data={scatterData} fill={COLORS.purple} />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : <EmptyState msg="Need multi-attempt features..." />}
              </div>

              {/* Category breakdown */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 p-4">
                <p className="text-sm text-zinc-500 mb-3">Average Score by Category</p>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis type="number" domain={[0, 10]} tick={{ fill: '#71717a', fontSize: 11 }} />
                      <YAxis type="category" dataKey="category" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={70} />
                      <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                      <Bar dataKey="avg" radius={[0, 6, 6, 0]}>
                        {categoryData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState msg="Need completed features..." />}
              </div>

              {/* Token split */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 p-4">
                <p className="text-sm text-zinc-500 mb-3">Token Split: Coder vs Evaluator</p>
                {totalTokens > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={tokenPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {tokenPie.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyState msg="No token data yet..." />}
              </div>
            </div>

            {/* ── Cost Trend ────────────────────────────────────────── */}
            {costData.length > 0 && (
              <>
                <SectionTitle>Token Economics</SectionTitle>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 p-4">
                  <p className="text-sm text-zinc-500 mb-3">Cost per Feature (shows if agent gets more efficient)</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={costData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="id" tick={{ fill: '#71717a', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v: any) => `$${v}`} />
                      <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v: any) => [`$${Number(v).toFixed(4)}`, 'Cost']} />
                      <Line type="monotone" dataKey="cost" stroke={COLORS.pink} strokeWidth={2} dot={{ fill: COLORS.pink, r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* ── Feature Table ──────────────────────────────────────── */}
            <SectionTitle>Feature Log</SectionTitle>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-200 dark:bg-zinc-900 text-zinc-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-center">Score</th>
                    <th className="px-4 py-3 text-center">Iters</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {metrics.features.map(f => (
                    <tr key={f.id} className="hover:bg-zinc-100/80 dark:hover:bg-zinc-900/50 cursor-pointer" onClick={() => setExpandedFeature(expandedFeature === f.id ? null : f.id)}>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">#{f.id}</td>
                      <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200 max-w-xs truncate">{f.description}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs rounded px-2 py-0.5" style={{ background: `${CATEGORY_COLORS[f.category] || COLORS.zinc}22`, color: CATEGORY_COLORS[f.category] || COLORS.zinc }}>
                          {f.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center"><Badge score={f.final_score} /></td>
                      <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400">{f.attempts.length}</td>
                      <td className="px-4 py-3 text-center">
                        {f.status === 'passed'
                          ? <span className="text-green-400 text-xs font-semibold">PASSED</span>
                          : <span className="text-red-400 text-xs font-semibold">SKIPPED</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Expanded feedback */}
              {expandedFeature && (() => {
                const f = metrics.features.find(f => f.id === expandedFeature);
                if (!f) return null;
                return (
                  <div className="bg-zinc-200 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <p className="text-xs font-semibold text-zinc-500 mb-2">Evaluator Feedback — Feature #{f.id}</p>
                    {f.attempts.map((att, i) => (
                      <div key={i} className="mb-2 pl-3 border-l-2" style={{ borderColor: att.score >= 7 ? COLORS.green : COLORS.amber }}>
                        <p className="text-xs text-zinc-500">Attempt {att.iteration} — <Badge score={att.score} /></p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 whitespace-pre-wrap">{att.feedback || 'No feedback recorded'}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* ── Skipped Features ───────────────────────────────────── */}
            {skipped.length > 0 && (
              <>
                <SectionTitle>Skipped Features</SectionTitle>
                <div className="space-y-2">
                  {skipped.map(f => (
                    <div key={f.id} className="rounded-lg border border-red-900/30 bg-red-950/20 px-4 py-3 flex justify-between items-center">
                      <div>
                        <span className="text-zinc-500 text-xs mr-2">#{f.id}</span>
                        <span className="text-zinc-700 dark:text-zinc-300 text-sm">{f.description}</span>
                      </div>
                      <Badge score={f.final_score} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 mb-6 text-center text-xs text-zinc-700">
          AgentForge &middot; Ralphthon SF 2026 &middot; Built autonomously by a Ralph Loop with quality backpressure
        </footer>
      </div>
    </main>
  );
}
