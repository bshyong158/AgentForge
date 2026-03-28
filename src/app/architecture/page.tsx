"use client";

export default function ArchitecturePage() {
  return (
    <section className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Architecture</h2>
        <p className="mt-1 text-sm text-zinc-400">
          How AgentForge autonomously built this dashboard from an empty repo in ~75 minutes.
        </p>
      </div>

      {/* Two-Loop Diagram */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Two-Loop Architecture</h3>
        <div className="font-mono text-sm text-zinc-300 leading-relaxed whitespace-pre overflow-x-auto">
{`RALPH LOOP (outer — iterates over 30 features)
│
├── Read state (feature_list.json + git log + progress)
├── Pick next feature (first "passes": false in JSON)
│
├── EVALUATOR LOOP (inner — up to 3 attempts per feature)
│   │
│   ├── Attempt 1: Codex builds the feature
│   ├── Gate: npm run build (must compile)
│   ├── Evaluator (Sonnet) scores on 3 dimensions
│   ├── Score < threshold? → feedback → retry
│   │
│   ├── Attempt 2: Codex revises based on feedback
│   ├── Gate + Evaluator re-scores
│   ├── Score >= threshold? → PASS
│   │
│   └── Attempt 3 (max): pass, accept-if-close, or skip
│
├── PASS → json_guard marks feature, git commit, write metrics
├── SKIP → revert, mark skipped, move on
│
└── [loop restarts → next feature]`}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Tech Stack</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <StackItem
            title="App Framework"
            tech="Next.js 16 + TypeScript (strict mode)"
            detail="App Router, server components by default, Turbopack"
          />
          <StackItem
            title="Styling"
            tech="Tailwind CSS v4"
            detail="Dark mode with class strategy, responsive breakpoints"
          />
          <StackItem
            title="Charts"
            tech="Recharts"
            detail="Line, Bar, Area, Pie, Scatter, Composed — all from one library"
          />
          <StackItem
            title="Testing"
            tech="Vitest"
            detail="Fast unit tests as build gate backpressure"
          />
          <StackItem
            title="Deploy"
            tech="Vercel (auto-deploy)"
            detail="Every git push triggers a production deployment"
          />
          <StackItem
            title="Data"
            tech="Single JSON file"
            detail="public/metrics.json — no database, no external services"
          />
        </div>
      </div>

      {/* Models */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">AI Models &amp; Roles</h3>
        <div className="space-y-4">
          <ModelCard
            name="GPT-5.3 Codex"
            provider="OpenAI"
            role="Builder (Generator)"
            description="Writes all application code — components, pages, hooks, charts, tests. Runs inside the Ralph Loop via Codex CLI in --full-auto mode. One feature per invocation, sandboxed to workspace writes."
            color="#22c55e"
          />
          <ModelCard
            name="Claude Sonnet 4"
            provider="Anthropic"
            role="Evaluator (Critic)"
            description="Scores each feature on 3 weighted dimensions: Completeness (40%), Visual Quality (30%), No Placeholders (30%). Provides specific, actionable feedback with file paths and fixes when score is below threshold. Separate context — cannot self-congratulate."
            color="#a855f7"
          />
        </div>
        <div className="mt-4 rounded-lg border border-amber-900/30 bg-amber-950/20 px-4 py-3">
          <p className="text-sm text-amber-200/80">
            <span className="font-semibold">Key insight:</span> Agents can&apos;t self-evaluate. They &ldquo;confidently praise their own work even when quality is obviously mediocre.&rdquo; Using a separate model with fresh context as the evaluator fixes this.
            <span className="block mt-1 text-xs text-amber-200/50">— Anthropic, &ldquo;Harness Design for Long-Running Application Development&rdquo; (March 2026)</span>
          </p>
        </div>
      </div>

      {/* Harness Components */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Harness Components</h3>
        <div className="space-y-3">
          <HarnessItem
            file="ralph-loop.sh"
            description="Outer loop orchestrator — picks features, runs Codex, gates builds, invokes evaluator, commits, pushes. The harness owns all authority."
          />
          <HarnessItem
            file="feature_list.json"
            description="30 features as structured JSON. Agent can only read it — json_guard.py rejects any mutation beyond flipping passes: false → true."
          />
          <HarnessItem
            file="evaluate.py"
            description="Evaluator bridge — sends diffs to Sonnet, parses structured scoring JSON, logs to W&B Weave."
          />
          <HarnessItem
            file="json_guard.py"
            description="Immutability enforcer — prevents the agent from editing feature descriptions, IDs, or marking its own work as passing."
          />
          <HarnessItem
            file="metrics_writer.py"
            description="Metrics accumulator — appends feature entries to public/metrics.json with token counts, timing, and scores."
          />
          <HarnessItem
            file="PROMPT_build.md"
            description="System prompt for Codex — 5 phases: check feedback, pick feature, build, verify build, exit. Strict rules against placeholders and scope creep."
          />
        </div>
      </div>

      {/* Key Design Decisions */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Key Design Decisions</h3>
        <div className="space-y-3">
          <Decision
            title="JSON over Markdown for feature specs"
            why="Models treat Markdown as prose and 'helpfully' rewrite, merge, or delete features. JSON is treated as data — schema constraints are respected."
          />
          <Decision
            title="Separate evaluator context"
            why="A coding agent asked to self-evaluate says 'looks great!' and moves on. A separate model with only the diff and spec catches real issues."
          />
          <Decision
            title="Don't revert on build failure"
            why="Earlier version ran git checkout on build errors, deleting the agent's work. Fixed to keep code and feed actual compiler errors to the next attempt."
          />
          <Decision
            title="One feature per loop iteration"
            why="Ralph Rule #1 — narrow scope prevents the agent from doing half of five things instead of all of one thing."
          />
          <Decision
            title="Git as recovery mechanism"
            why="Every passing feature is a clean commit. If the agent breaks something, git revert to the last known good state."
          />
        </div>
      </div>

      {/* Research Foundation */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Research Foundation</h3>
        <div className="space-y-3">
          <PaperRef
            title="Effective Harnesses for Long-Running Agents"
            authors="Justin Young et al., Anthropic"
            date="November 2025"
            patterns="JSON feature list, git-as-recovery, one-feature-per-iteration, browser verification"
          />
          <PaperRef
            title="Harness Design for Long-Running Application Development"
            authors="Prithvi Rajasekaran, Anthropic Labs"
            date="March 2026"
            patterns="GAN-inspired generator-evaluator separation, multi-dimension scoring, iterative quality improvement"
          />
          <PaperRef
            title="Autoresearch Loop (independent prior art)"
            authors="Ben Shyong"
            date="March 2026"
            patterns="Separate generator + evaluator models, bounded iteration with score tracking, measurable improvement (6.42 → 6.56)"
          />
        </div>
      </div>
    </section>
  );
}

function StackItem({ title, tech, detail }: { title: string; tech: string; detail: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
      <p className="mt-1 font-semibold text-zinc-100">{tech}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{detail}</p>
    </div>
  );
}

function ModelCard({ name, provider, role, description, color }: { name: string; provider: string; role: string; description: string; color: string }) {
  return (
    <div className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div>
        <div className="flex items-baseline gap-2">
          <p className="font-semibold text-zinc-100">{name}</p>
          <span className="text-xs text-zinc-600">{provider}</span>
        </div>
        <p className="text-sm font-medium" style={{ color }}>{role}</p>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

function HarnessItem({ file, description }: { file: string; description: string }) {
  return (
    <div className="flex gap-3">
      <code className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300">{file}</code>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  );
}

function Decision({ title, why }: { title: string; why: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3">
      <p className="font-medium text-zinc-200">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{why}</p>
    </div>
  );
}

function PaperRef({ title, authors, date, patterns }: { title: string; authors: string; date: string; patterns: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3">
      <p className="font-medium text-zinc-200">&ldquo;{title}&rdquo;</p>
      <p className="text-xs text-zinc-500">{authors} &middot; {date}</p>
      <p className="mt-1 text-sm text-zinc-400">Patterns used: {patterns}</p>
    </div>
  );
}
