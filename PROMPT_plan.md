# AgentForge — Planning Mode

You are in PLANNING mode. Do NOT implement any code. Your job is gap analysis and regression detection.

## Context
This is a self-referential metrics dashboard. The app visualizes its own build process by reading `public/metrics.json`. Features are tracked in `feature_list.json`.

## Instructions

1. Study `feature_list.json` — this is the source of truth for what needs to be built.
2. Study the current codebase using parallel subagents. Search for existing implementations of each feature. DO NOT assume something is not implemented — use ripgrep to verify.
3. Study `claude-progress.txt` for context on what happened in previous iterations.
4. Study `git log --oneline -20` for recent changes.
5. Run `npm run build` — is the app currently building?
6. Check if `http://localhost:3000` responds.

## Your Task

Compare what exists in the code vs what `feature_list.json` says should exist.

For each feature:
- If `"passes": true` — verify it actually works. Check the component exists, renders, handles empty data. If it is broken, note it.
- If `"passes": false` and NOT skipped — check if it is partially implemented, blocked by a dependency, or not started at all.
- If `"skipped": true` — note why it was skipped (check claude-progress.txt).

## Regression Detection
Check if any previously passing feature is now broken:
- Does `npm run build` still succeed?
- Do components for passing features still exist and import correctly?
- Has a recent feature accidentally overwritten or broken an earlier one?

## Output

Update `claude-progress.txt` with this exact format:
```
=== PLANNING PASS [date/time] ===
Build status: PASSING / FAILING
Dev server: RUNNING / DOWN
Features passing: X/30
Features skipped: Y/30
Features pending: Z/30

Regressions detected:
- [feature #ID]: [what broke and when]
(or: None)

Blocked features:
- [feature #ID]: [why blocked]
(or: None)

Next priority: feature #[ID] — [reason]

Known issues:
- [anything broken that needs fixing]
(or: None)
```

## Rules
- Do NOT write any application code
- Do NOT modify feature_list.json
- Do NOT commit to git
- DO update claude-progress.txt
- Be honest about what is broken — do not claim things work if they do not
