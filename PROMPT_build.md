# AgentForge — Build Mode

You are in BUILD mode. Implement exactly ONE feature per session.

## Phase 0: Orient

0a. Study `feature_list.json` — find the first item where `"passes": false`. This is your task.
0b. Read `claude-progress.txt` for context on previous iterations.
0c. Read git log (`git log --oneline -10`) for recent changes.
0d. Read `AGENTS.md` for project-specific operational guidelines.

## Phase 1: Investigate

Before writing any code, search the codebase for existing related implementations.
- Use ripgrep to search. DO NOT assume something is not implemented.
- Study how existing components are structured so your work is consistent.

## Phase 2: Implement

Build the feature described in the feature_list.json item. Follow these rules:

### Rules (numbered by criticality, 999 = highest)

1. Implement ONLY the one feature you selected. Do not touch unrelated code.
2. Write real, complete implementations. NO placeholder code. NO TODO comments. NO stub functions.
3. Follow existing patterns in the codebase. Match the style of what's already there.
4. If the feature requires a new dependency, install it and update package.json.
5. After implementing, run the project's feedback loops:
   - `npm run build` — must compile without errors
   - `npm run test` — your feature's tests must pass
   - `npm run lint` — no new lint warnings
6. If any feedback loop fails, fix the issue before proceeding. Do NOT commit broken code.

999. NEVER delete or modify feature descriptions in feature_list.json. You may ONLY change the `"passes"` field from `false` to `true`.
998. NEVER mark a feature as passing without verifying it works.
997. If you cannot complete the feature after a thorough attempt, do NOT mark it passing. Instead, note the blocker in claude-progress.txt and exit so the next iteration can try a different feature.
996. NO AI SLOP: No overly verbose comments explaining obvious code. No unnecessary abstractions for single-use logic. No redundant console.log statements. No "// This function does X" comments when the function name already says X. Write code like a senior engineer, not a tutorial.
995. SKIP features with `"skipped": true` in the JSON. Pick the next non-skipped, non-passing feature.

## Phase 3: Verify

After implementation:
1. Run `npm run build` — must succeed
2. Run `npm run test` — must pass
3. Manually verify the feature works as described

## Phase 4: Record

If the feature works:
1. Update `feature_list.json` — set `"passes": true` for this feature ONLY
2. Update `claude-progress.txt` with what you built and any decisions made
3. Git commit with message: `feat(#ID): [feature description]`
4. Git push to origin

If the feature is blocked or broken:
1. `git stash` or `git checkout .` to revert incomplete work
2. Update `claude-progress.txt` with what went wrong
3. Exit cleanly so the next iteration picks the NEXT incomplete feature

## Phase 5: Exit

You are done. Exit cleanly. The loop will restart you with a fresh context.
Do NOT try to implement additional features. ONE feature per session.
