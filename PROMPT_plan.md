# AgentForge — Planning Mode

You are in PLANNING mode. Do NOT implement any code. Your job is gap analysis only.

## Instructions

1. Study `feature_list.json` — this is the source of truth for what needs to be built.
2. Study the current codebase using parallel subagents. Search for existing implementations. DO NOT assume something is not implemented — use ripgrep to verify.
3. Study `claude-progress.txt` for context on what happened in previous iterations.
4. Study the git log (`git log --oneline -20`) for recent changes.

## Your Task

Compare what exists in the code vs what `feature_list.json` says should exist. For each feature:
- If `"passes": true` — verify it actually works. If it's broken, note it.
- If `"passes": false` — check if it's partially implemented, blocked, or not started.

## Output

Update `claude-progress.txt` with:
```
=== PLANNING PASS [date/time] ===
Features passing: X/30
Features in progress: [list IDs]
Features blocked: [list IDs + why]
Features not started: [list IDs]
Next priority: feature #[ID] — [reason it's next]
Known issues: [anything broken that needs fixing]
```

## Rules
- Do NOT write any application code
- Do NOT modify feature_list.json
- Do NOT commit to git (planning passes don't produce commits)
- DO update claude-progress.txt
- Be honest about what's broken — don't claim things work if they don't
