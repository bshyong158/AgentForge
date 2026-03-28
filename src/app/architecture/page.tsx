"use client";

export default function ArchitecturePage() {
  return (
    <section className="space-y-8 pb-12">
      {/* Hero / Elevator Pitch */}
      <div className="rounded-xl border border-zinc-700 bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-950 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-3">Ralphthon SF 2026</p>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          An agent&apos;s self-portrait.
        </h2>
        <p className="mt-5 max-w-2xl text-zinc-300 leading-relaxed text-[15px]">
          This dashboard was built from scratch by an autonomous agent in 78 minutes — <span className="text-zinc-100 font-semibold">zero human code</span> — and every chart on screen is showing you that agent&apos;s own build process: its scores, its failures, its revisions, its cost.
        </p>
        <p className="mt-4 max-w-2xl text-zinc-300 leading-relaxed text-[15px]">
          The key feature is <span className="text-emerald-400 font-semibold">backpressure</span>. Before any line of code is allowed to commit, a completely separate evaluator agent scores it and rejects anything that isn&apos;t good enough. The builder can&apos;t grade its own homework.
        </p>
        <p className="mt-4 max-w-2xl text-zinc-300 leading-relaxed text-[15px]">
          Instead of one-shotting the whole app, we designed a harness that systematically works through each feature one at a time — build it, evaluate it, score it, feed back if it&apos;s not good enough. Only when it passes does the harness commit to GitHub and flip the feature to &ldquo;passed&rdquo; in the JSON. Then it moves to the next one.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Features Built" value="29 / 30" />
          <Stat label="Avg Score" value="9.5 / 10" />
          <Stat label="Total Build" value="78 min" />
          <Stat label="Human Code" value="0 lines" />
        </div>
        <p className="mt-6 text-sm text-zinc-500 italic">
          The app is the output. The harness is the innovation. And the dashboard is the agent watching itself learn.
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

      {/* Failure Recovery — What Went Wrong & How the Loop Handled It */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-1">Failure Recovery</h3>
        <p className="text-sm text-zinc-500 mb-4">Real failures that happened during this build and how the harness responded.</p>
        <div className="space-y-4">
          <FailureCase
            title="Feature #3: Dark Mode Toggle — SKIPPED after 3 attempts"
            status="skipped"
            timeline={[
              "Attempt 1: Codex wrote ThemeToggle component + added import to layout.tsx",
              "Build gate FAILED: TypeScript error — ThemeToggle import path wrong",
              "Original harness bug: git checkout . wiped ALL files including the component Codex just wrote",
              "Attempt 2: Codex rewrote from scratch, same import error — component deleted again on failure",
              "Attempt 3: Same pattern. Max attempts reached → SKIPPED",
            ]}
            rootCause="The harness ran git checkout . && git clean -fd on build failure, nuking the agent's work before the retry could fix it. The agent kept recreating the component, but the revert kept deleting it."
            fix="Removed the destructive revert. New behavior: keep the code on build failure, feed actual compiler errors into feedback.md so the next attempt can fix the specific issue instead of starting over."
          />
          <FailureCase
            title="Feature #1: Scaffold — scored 5/10 on first attempt"
            status="recovered"
            timeline={[
              "Attempt 1: Codex scaffolded Next.js app but missed dark background, no Tailwind classes applied",
              "Evaluator scored 5/10 — 'Homepage renders but missing dark background styling'",
              "Feedback written to .ralph-logs/feedback.md with specific fix",
              "Attempt 2: Codex read feedback, added bg-zinc-950 and Tailwind classes",
              "Evaluator scored 9/10 → PASSED",
            ]}
            rootCause="First attempt was functional but visually incomplete. The evaluator caught what a self-evaluating agent would have marked as 'done.'"
            fix="This is the system working as designed — evaluator backpressure caught a quality issue and the builder fixed it on retry."
          />
          <FailureCase
            title="Feature #28: Loading Skeletons — 3 attempts, 419 seconds"
            status="recovered"
            timeline={[
              "Attempt 1: Skeleton components exist but no pulse animation, wrong dimensions (4/10)",
              "Attempt 2: Animation works but skeleton heights don't match actual content sections (6/10)",
              "Attempt 3: All dimensions correct, pulse animation smooth, matches real content layout (9/10) → PASSED",
            ]}
            rootCause="Complex feature requiring pixel-level accuracy. Each evaluator pass caught progressively finer issues."
            fix="Inner loop did exactly what it should: iterated from broken → functional → polished. Three attempts, each building on the previous."
          />
          <FailureCase
            title="Feature #13: Dual-Axis Chart — scored 5/10 then 8/10"
            status="recovered"
            timeline={[
              "Attempt 1: Both score line and iteration bars rendered on the same Y-axis scale, making iterations invisible",
              "Evaluator: 'Dual y-axis not configured, both series on same scale'",
              "Attempt 2: Codex added right Y-axis for iterations, left for scores, legend distinguishes them",
              "Evaluator scored 8/10 → PASSED",
            ]}
            rootCause="Recharts dual-axis configuration is non-obvious. The evaluator caught a usability issue a human reviewer would also catch."
            fix="Specific feedback ('dual y-axis not configured') was actionable enough for the builder to fix in one revision."
          />
        </div>
        <div className="mt-5 rounded-lg border border-blue-900/30 bg-blue-950/20 px-4 py-3">
          <p className="text-sm text-blue-200/80">
            <span className="font-semibold">The pattern:</span> Volume without quality = 30 half-baked features. Quality without volume = 3 perfect features.
            The two-loop architecture gives you both: 29 features, average score 9.5/10, with real iteration on the hard ones.
          </p>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-3 py-2.5 text-center">
      <p className="text-lg font-bold tabular-nums text-zinc-100">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
    </div>
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

function FailureCase({ title, status, timeline, rootCause, fix }: { title: string; status: "skipped" | "recovered"; timeline: string[]; rootCause: string; fix: string }) {
  const statusColor = status === "skipped" ? "text-red-400 bg-red-500/10" : "text-green-400 bg-green-500/10";
  const statusLabel = status === "skipped" ? "SKIPPED" : "RECOVERED";
  const borderColor = status === "skipped" ? "border-red-900/40" : "border-green-900/40";
  return (
    <div className={`rounded-lg border ${borderColor} bg-zinc-950/50 p-4`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-zinc-200">{title}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
      </div>
      <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-zinc-700">
        {timeline.map((step, i) => (
          <p key={i} className="text-xs text-zinc-400">
            <span className="text-zinc-600">{i + 1}.</span> {step}
          </p>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded bg-zinc-800/40 px-3 py-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Root Cause</p>
          <p className="mt-0.5 text-xs text-zinc-400">{rootCause}</p>
        </div>
        <div className="rounded bg-zinc-800/40 px-3 py-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Resolution</p>
          <p className="mt-0.5 text-xs text-zinc-400">{fix}</p>
        </div>
      </div>
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
