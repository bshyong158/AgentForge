# AgentForge — Build Mode

You are building a self-referential metrics dashboard. Build exactly ONE feature, then EXIT.

## Step 1: Check for Revision Feedback

Read `.ralph-logs/feedback.md`. If it contains feedback:
- Fix ONLY the issues described (build errors or evaluator feedback)
- Do NOT start the feature over
- Skip to Step 3

## Step 2: Pick Your Feature

Read `feature_list.json`. Find the first item where `"passes": false` AND `"skipped"` is not `true`. This is your ONE task.

Quickly check what exists: `ls src/app/ src/components/ src/hooks/ 2>/dev/null` and `git log --oneline -5`.

## Step 3: Build It

Tech stack: Next.js 15, TypeScript strict, Tailwind CSS v4, recharts for charts, `'use client'` only when needed.

Data source: `public/metrics.json` — fetch via `useMetrics()` hook in `src/hooks/useMetrics.ts` (create it if it doesn't exist).

Rules:
- ONE feature only. Do not touch unrelated code.
- Write COMPLETE code. No TODOs, no stubs, no placeholders.
- Handle empty metrics data gracefully (show a message, not an error).
- If you create a component, make sure all imports exist before finishing.
- If you modify layout.tsx, make sure every imported component file exists.

## Step 4: Verify Build

Run `npm run build`. If it fails, FIX IT before exiting. Do not leave broken code.

Common fixes:
- Missing import? Create the file or remove the import.
- Type error? Fix the type, don't use `any` unless absolutely necessary.
- recharts type issues? Use `any` for recharts callback props (their types are messy).

## Step 5: Exit

You are done. Do NOT:
- Update feature_list.json (harness does this)
- Run git commit or git push (harness does this)
- Implement additional features

ONE feature. Build it. Verify it compiles. Exit.
