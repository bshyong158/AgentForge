# AgentForge — Build Mode

You are building a self-referential metrics dashboard. This dashboard visualizes the autonomous build process that is creating it. The data source is `public/metrics.json` which grows as features are completed by the harness.

You are in BUILD mode. Implement exactly ONE feature per session. Then EXIT.

## Phase -1: Revision Mode (check first)

Check if `.ralph-logs/feedback.md` exists and is non-empty.
If YES — you are revising a previous attempt that the evaluator rejected.
- Study the feedback carefully
- Fix ONLY the issues described
- Do NOT start the feature over from scratch
- Do NOT implement a different feature
- Skip directly to Phase 2 after reading feedback

## Phase 0: Orient

Before writing ANY code, complete these steps in order:

0a. Run `pwd` to confirm you are in the project directory.
0b. Study `claude-progress.txt` to understand what has been built so far and any known issues.
0c. Study `feature_list.json` — find the first item where `"passes": false` AND `"skipped"` is not `true`. This is your ONE task.
0d. Run `git log --oneline -10` to see recent changes.
0e. Run `npm run build` — if it FAILS, you MUST fix the build before doing anything else (Rule 9998).
0f. Study `public/metrics.json` to understand what data currently exists. Your feature should render gracefully with this data (including empty data).
0g. Study `AGENTS.md` for project conventions and tech stack details.

## Phase 1: Investigate

Before writing any code, search the codebase for existing related implementations.
- Use ripgrep to search. DO NOT assume something is not implemented.
- Study how existing components are structured so your work is consistent.
- Use parallel subagents for codebase searches. Use only 1 subagent for builds and tests.

## Phase 2: Implement

Build the feature described in the feature_list.json item you selected.

### Context: What You Are Building

A Next.js 15 dashboard with these characteristics:
- **Data source**: `public/metrics.json` — fetched via the `useMetrics()` hook in `src/hooks/useMetrics.ts`
- **Charts**: Use `recharts` library for ALL visualizations (LineChart, BarChart, AreaChart, PieChart, ScatterChart, etc.)
- **Styling**: Tailwind CSS v4 with dark mode support (class strategy)
- **Components**: One component per file in `src/components/`
- **Pages**: App Router pages in `src/app/` — each nav section gets its own page
- **Empty states**: Every component must handle empty/missing metrics data gracefully (show a message, not an error)

### Rules (numbered by criticality — higher number = more important)

1. Implement ONLY the one feature you selected in Phase 0. Do not touch unrelated code.
2. Write real, complete implementations. NO placeholder code. NO TODO comments. NO stub functions.
3. Follow existing patterns in the codebase. Match the style of what is already there.
4. If the feature requires a new dependency, install it via npm and update package.json.
5. After implementing, run the project feedback loops:
   - `npm run build` — must compile without TypeScript errors
   - `npm run lint` — no new lint warnings
6. If any feedback loop fails, fix the issue before finishing. Do NOT leave broken code.
7. Every chart component must handle the case where `metrics.json` has zero features (empty array).
8. Use `'use client'` directive only on components that need interactivity (charts, toggles, search inputs).
9. Server components by default. Only add `'use client'` when React hooks or event handlers are needed.

995. SKIP features with `"skipped": true` in the JSON. Pick the next non-skipped, non-passing feature.
996. NO AI SLOP: No overly verbose comments explaining obvious code. No unnecessary abstractions for single-use logic. No redundant console.log statements. No "// This function does X" comments when the function name already says X. Write code like a senior engineer, not a tutorial.
997. Do NOT mark a feature as passing. The harness decides pass/fail, not you.
998. If `npm run build` fails BEFORE you start your feature, fix the existing breakage FIRST. Do not implement a new feature on a broken codebase.
999. NEVER modify feature descriptions, ids, categories, or verify fields in feature_list.json. You may NOT change the `passes` field either — the harness owns that.
9999. Do NOT refactor or improve previously completed features. Do NOT reorganize existing code. Implement ONLY the current feature.

## Phase 3: Verify

After implementation:
1. Run `npm run build` — must succeed
2. Run `npm run lint` — must pass
3. Visually confirm your feature works at http://localhost:3000 if possible

## Phase 4: Exit

You are DONE. Exit cleanly. Do not do any of the following:
- Do NOT update feature_list.json (the harness does this)
- Do NOT run git commit (the harness does this)
- Do NOT run git push (the harness does this)
- Do NOT try to implement additional features

ONE feature per session. Build it, verify it compiles, exit.
