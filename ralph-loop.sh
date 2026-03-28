#!/bin/bash
# AgentForge Ralph Loop — Two-prompt pattern with stagnation detection
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

LOG_DIR="$PROJECT_DIR/.ralph-logs"
mkdir -p "$LOG_DIR"

ITERATION=0
PREV_FEATURE=""
STALL_COUNT=0
MAX_STALL=3
PLAN_INTERVAL=5  # Run planning pass every N iterations

echo "=== AgentForge Ralph Loop Starting ==="
echo "=== $(date) ==="
echo ""

while true; do
  ITERATION=$((ITERATION + 1))
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

  echo "============================================"
  echo "=== Iteration $ITERATION — $TIMESTAMP ==="
  echo "============================================"

  # --- Stagnation Detection ---
  # Check which feature is next (first "passes": false)
  CURRENT_FEATURE=$(python3 -c "
import json
with open('feature_list.json') as f:
    features = json.load(f)
incomplete = [f for f in features if not f['passes']]
print(incomplete[0]['id'] if incomplete else 'DONE')
" 2>/dev/null || echo "ERROR")

  if [ "$CURRENT_FEATURE" = "DONE" ]; then
    echo "ALL FEATURES PASSING. AgentForge complete."
    break
  fi

  if [ "$CURRENT_FEATURE" = "ERROR" ]; then
    echo "ERROR reading feature_list.json. Skipping iteration."
    sleep 5
    continue
  fi

  # Check if we're stuck on the same feature
  if [ "$CURRENT_FEATURE" = "$PREV_FEATURE" ]; then
    STALL_COUNT=$((STALL_COUNT + 1))
    echo "WARNING: Still on feature #$CURRENT_FEATURE (stall count: $STALL_COUNT/$MAX_STALL)"
  else
    STALL_COUNT=0
  fi

  # If stalled too long, skip the feature
  if [ "$STALL_COUNT" -ge "$MAX_STALL" ]; then
    echo "STAGNATION DETECTED: Skipping feature #$CURRENT_FEATURE after $MAX_STALL attempts"

    # Mark as skipped in progress file
    echo "" >> claude-progress.txt
    echo "=== SKIPPED feature #$CURRENT_FEATURE at $TIMESTAMP (stalled $MAX_STALL iterations) ===" >> claude-progress.txt

    # Skip this feature by marking it with a special value
    # (We can't mark "passes": true for broken features, so we note it and the next
    #  planning pass will handle reprioritization)
    python3 -c "
import json
with open('feature_list.json') as f:
    features = json.load(f)
for f in features:
    if f['id'] == $CURRENT_FEATURE and not f['passes']:
        f['skipped'] = True
        break
with open('feature_list.json', 'w') as f:
    json.dump(features, f, indent=2)
"
    STALL_COUNT=0
    PREV_FEATURE=""
    continue
  fi

  PREV_FEATURE="$CURRENT_FEATURE"

  # --- Choose Mode: Planning or Building ---
  if (( ITERATION % PLAN_INTERVAL == 0 )); then
    echo "MODE: Planning (gap analysis)"

    codex exec "$(cat PROMPT_plan.md)" \
      --full-auto \
      2>&1 | tee "$LOG_DIR/iteration-${ITERATION}-plan.log"
  else
    echo "MODE: Building feature #$CURRENT_FEATURE"

    # Count passing features for progress display
    PASSING=$(python3 -c "
import json
with open('feature_list.json') as f:
    features = json.load(f)
print(sum(1 for f in features if f['passes']))
")
    echo "Progress: $PASSING/30 features passing"

    # --- Build Phase: Coding Agent ---
    codex exec "$(cat PROMPT_build.md)" \
      --full-auto \
      2>&1 | tee "$LOG_DIR/iteration-${ITERATION}-build.log"

    # --- Evaluator Phase: Quality Gate (cheap model) ---
    # Get the diff of what was just built
    DIFF=$(git diff HEAD~1 HEAD 2>/dev/null || echo "no diff")
    if [ "$DIFF" != "no diff" ] && [ -n "$DIFF" ]; then
      EVAL_PROMPT="$(cat EVALUATOR.md)

## Feature Being Evaluated
$(python3 -c "
import json
with open('feature_list.json') as f:
    features = json.load(f)
current = [f for f in features if f['id'] == $CURRENT_FEATURE]
if current: print(json.dumps(current[0], indent=2))
")

## Code Diff
\`\`\`
$DIFF
\`\`\`"

      echo "EVALUATOR: Scoring feature #$CURRENT_FEATURE..."
      # Use cheaper model for evaluation (saves 30-50% tokens per OMC winner pattern)
      EVAL_RESULT=$(codex exec "$EVAL_PROMPT" -m gpt-4o-mini --full-auto 2>/dev/null | tail -20)
      echo "EVAL: $EVAL_RESULT" | tee -a "$LOG_DIR/iteration-${ITERATION}-eval.log"
    fi
  fi

  # --- Post-Iteration Stats ---
  PASSING_NOW=$(python3 -c "
import json
with open('feature_list.json') as f:
    features = json.load(f)
print(sum(1 for f in features if f['passes']))
")
  COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "0")

  echo ""
  echo "--- Iteration $ITERATION complete ---"
  echo "Features passing: $PASSING_NOW/30"
  echo "Total commits: $COMMITS"
  echo "Next feature: $(python3 -c "
import json
with open('feature_list.json') as f:
    features = json.load(f)
incomplete = [f for f in features if not f['passes'] and not f.get('skipped')]
print(f\"#{incomplete[0]['id']}: {incomplete[0]['description'][:60]}...\" if incomplete else 'ALL DONE')
")"
  echo ""

  # Brief pause to avoid rate limits
  sleep 3
done

echo ""
echo "=== AgentForge Ralph Loop Complete ==="
echo "=== $(date) ==="
echo "=== Final: $PASSING_NOW/30 features passing, $COMMITS commits ==="
