#!/bin/bash
# AgentForge Ralph Loop — Two-loop architecture with quality backpressure
# Outer loop: one feature per iteration (Ralph pattern)
# Inner loop: up to 3 attempts with evaluator feedback (Autoresearch/GAN pattern)
#
# The harness owns ALL authority: commit, mark passes, push, skip.
# The coding agent (Codex) only builds code and exits.
# The evaluator (Sonnet via evaluate.py) scores and provides feedback.
set -uo pipefail
# Note: not using -e because we handle errors explicitly

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# --- Configuration ---
MAX_ATTEMPTS=3          # Inner loop: max attempts per feature
PLAN_INTERVAL=8         # Run planning pass every N outer iterations
PUSH_INTERVAL=5         # Git push every N completed features
CODEX_TIMEOUT=300       # 5 minutes max per codex exec call
CODEX_MODEL="gpt-5.3-codex"

# --- State ---
LOG_DIR="$PROJECT_DIR/.ralph-logs"
mkdir -p "$LOG_DIR"
ITERATION=0
FEATURES_COMPLETED=0
CONSECUTIVE_SKIPS=0
TOTAL_FEATURES=30

# --- Helpers ---
timestamp() { date '+%Y-%m-%dT%H:%M:%S%z'; }
log() { echo "[$(timestamp)] $*"; }
log_progress() { echo "" >> claude-progress.txt; echo "=== $* ===" >> claude-progress.txt; }

get_next_feature() {
    python3 -c "
import json
with open('feature_list.json') as f:
    features = json.load(f)
for feat in features:
    if not feat.get('passes') and not feat.get('skipped'):
        print(json.dumps(feat))
        break
else:
    print('DONE')
"
}

get_threshold() {
    local category="$1"
    case "$category" in
        scaffold) echo 5 ;;
        git|polish) echo 6 ;;
        *) echo 7 ;;
    esac
}

check_dev_server() {
    if ! curl -s --max-time 3 http://localhost:3001 > /dev/null 2>&1; then
        log "Dev server down. Restarting..."
        local pid_file=".dev-pid"
        if [ -f "$pid_file" ]; then
            kill "$(cat "$pid_file")" 2>/dev/null || true
        fi
        npm run dev > "$LOG_DIR/dev-server.log" 2>&1 &
        echo $! > "$pid_file"
        sleep 5
    fi
}

# --- Startup ---
log "=== AgentForge Ralph Loop Starting ==="
log "=== Model: $CODEX_MODEL | Max attempts: $MAX_ATTEMPTS | Timeout: ${CODEX_TIMEOUT}s ==="
python3 metrics_writer.py --set-started

# Ensure dev server is running
check_dev_server

# ============================================================
# OUTER LOOP — One feature per iteration
# ============================================================
while true; do
    ITERATION=$((ITERATION + 1))
    log "============================================"
    log "=== Outer Iteration $ITERATION ==="
    log "============================================"

    # --- Planning Pass (every PLAN_INTERVAL iterations) ---
    if [ "$ITERATION" -gt 1 ] && (( (ITERATION - 1) % PLAN_INTERVAL == 0 )); then
        log "MODE: Planning pass (gap analysis + regression detection)"
        gtimeout "$CODEX_TIMEOUT" codex exec "$(cat PROMPT_plan.md)" \
            --full-auto -m "$CODEX_MODEL" \
            2>&1 | tee "$LOG_DIR/iteration-${ITERATION}-plan.log" || true
        # Push after planning pass
        log "Pushing to origin (post-planning)..."
        git push origin main 2>&1 || log "WARNING: git push failed (network?)"
        continue
    fi

    # --- Pick Next Feature ---
    FEATURE_JSON=$(get_next_feature)

    if [ "$FEATURE_JSON" = "DONE" ]; then
        log "ALL FEATURES COMPLETE. AgentForge finished."
        break
    fi

    FEATURE_ID=$(echo "$FEATURE_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
    FEATURE_DESC=$(echo "$FEATURE_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['description'])")
    FEATURE_VERIFY=$(echo "$FEATURE_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['verify'])")
    FEATURE_CATEGORY=$(echo "$FEATURE_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['category'])")
    THRESHOLD=$(get_threshold "$FEATURE_CATEGORY")

    log "Feature #$FEATURE_ID [$FEATURE_CATEGORY]: ${FEATURE_DESC:0:80}..."
    log "Threshold: $THRESHOLD/10"

    # Track timing
    FEATURE_START=$(date +%s)
    BEST_SCORE=0
    BEST_COMMIT=""
    PREV_SCORE=-1
    ATTEMPT_DATA="[]"
    FINAL_STATUS="skipped"

    # Clear feedback file for fresh feature
    > "$LOG_DIR/feedback.md"

    # ============================================================
    # INNER LOOP — Up to MAX_ATTEMPTS per feature (Autoresearch)
    # ============================================================
    for ATTEMPT in $(seq 1 $MAX_ATTEMPTS); do
        ATTEMPT_START=$(date +%s)
        log "--- Attempt $ATTEMPT/$MAX_ATTEMPTS for feature #$FEATURE_ID ---"

        # --- Check dev server ---
        check_dev_server

        # --- Save current state for potential revert ---
        git stash --include-untracked -q 2>/dev/null || true
        git stash pop -q 2>/dev/null || true
        REVERT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "")

        # --- Run Codex (builder) ---
        log "CODEX: Building feature #$FEATURE_ID (attempt $ATTEMPT)..."
        CODEX_LOG="$LOG_DIR/iter-${ITERATION}-attempt-${ATTEMPT}-codex.log"

        gtimeout "$CODEX_TIMEOUT" codex exec "$(cat PROMPT_build.md)" \
            --full-auto -m "$CODEX_MODEL" \
            2>&1 | tee "$CODEX_LOG" || {
            log "WARNING: Codex timed out or failed"
        }

        # Estimate tokens from log size (rough: ~4 chars per token)
        CODEX_TOKENS=$(( $(wc -c < "$CODEX_LOG" 2>/dev/null || echo 0) / 4 ))

        # --- Mechanical Gate 1: Build ---
        log "GATE: npm run build..."
        if ! npm run build --silent > "$LOG_DIR/build.log" 2>&1; then
            log "GATE FAILED: Build broken. Score 0."
            SCORE=0
            FEEDBACK="Build failed. Fix compilation errors. See build log."
            echo "$FEEDBACK" > "$LOG_DIR/feedback.md"
            # Revert broken code
            git checkout . 2>/dev/null || true
            git clean -fd 2>/dev/null || true

            ATTEMPT_END=$(date +%s)
            ATTEMPT_DURATION=$((ATTEMPT_END - ATTEMPT_START))
            ATTEMPT_DATA=$(echo "$ATTEMPT_DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
data.append({'iteration': $ATTEMPT, 'score': 0, 'feedback': 'Build failed', 'tokens_coder': $CODEX_TOKENS, 'tokens_evaluator': 0, 'duration_sec': $ATTEMPT_DURATION})
print(json.dumps(data))
")
            PREV_SCORE=0
            continue
        fi
        log "GATE PASSED: Build OK"

        # --- Mechanical Gate 2: Localhost responds ---
        log "GATE: curl localhost:3000..."
        if ! curl -s --max-time 5 http://localhost:3001 | grep -q '<' 2>/dev/null; then
            log "GATE WARNING: localhost not responding (non-fatal, continuing)"
        else
            log "GATE PASSED: localhost OK"
        fi

        # --- Get diff for evaluator (exclude lock files to stay under token limit) ---
        git diff -- ':!package-lock.json' ':!*.svg' > "$LOG_DIR/diff.txt" 2>/dev/null
        # Also include untracked files
        git diff HEAD -- ':!package-lock.json' ':!*.svg' >> "$LOG_DIR/diff.txt" 2>/dev/null
        # If no diff, try against last commit
        if [ ! -s "$LOG_DIR/diff.txt" ]; then
            git diff HEAD~1 HEAD -- ':!package-lock.json' ':!*.svg' > "$LOG_DIR/diff.txt" 2>/dev/null || true
        fi

        # --- Evaluator (Sonnet via evaluate.py) ---
        log "EVALUATOR: Scoring feature #$FEATURE_ID (attempt $ATTEMPT)..."
        EVAL_JSON=$(python3 evaluate.py eval \
            --feature-id "$FEATURE_ID" \
            --description "$FEATURE_DESC" \
            --verify "$FEATURE_VERIFY" \
            --category "$FEATURE_CATEGORY" \
            --diff-file "$LOG_DIR/diff.txt" \
            --attempt "$ATTEMPT" 2>/dev/null) || EVAL_JSON='{"overall":0,"pass":false,"feedback":[],"summary":"Evaluator failed"}'

        SCORE=$(echo "$EVAL_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('overall', 0))" 2>/dev/null || echo 0)
        EVAL_PASS=$(echo "$EVAL_JSON" | python3 -c "import json,sys; print('true' if json.load(sys.stdin).get('pass') else 'false')" 2>/dev/null || echo "false")
        FEEDBACK=$(echo "$EVAL_JSON" | python3 -c "
import json, sys
d = json.load(sys.stdin)
fb = d.get('feedback', [])
if isinstance(fb, list):
    for item in fb:
        if isinstance(item, dict):
            print('- [%s] %s in %s: %s' % (item.get('dimension',''), item.get('issue',''), item.get('file',''), item.get('fix','')))
        else:
            print('- %s' % item)
elif fb:
    print(str(fb))
" 2>/dev/null || echo "")
        EVAL_TOKENS=$(echo "$EVAL_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tokens_evaluator', 0))" 2>/dev/null || echo 0)
        SUMMARY=$(echo "$EVAL_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('summary', ''))" 2>/dev/null || echo "")

        ATTEMPT_END=$(date +%s)
        ATTEMPT_DURATION=$((ATTEMPT_END - ATTEMPT_START))

        log "SCORE: $SCORE/10 (threshold: $THRESHOLD) — $SUMMARY"

        # Record attempt
        ATTEMPT_DATA=$(echo "$ATTEMPT_DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
data.append({
    'iteration': $ATTEMPT,
    'score': $SCORE,
    'feedback': '''$FEEDBACK''',
    'tokens_coder': $CODEX_TOKENS,
    'tokens_evaluator': $EVAL_TOKENS,
    'duration_sec': $ATTEMPT_DURATION
})
print(json.dumps(data))
")

        # --- Best Score Tracking ---
        if [ "$SCORE" -gt "$BEST_SCORE" ]; then
            BEST_SCORE=$SCORE
            # Stage current state as best
            git add -A 2>/dev/null || true
            BEST_COMMIT=$(git stash create 2>/dev/null || echo "")
        fi

        # --- Decision Logic ---

        # PASS: score meets threshold
        if [ "$SCORE" -ge "$THRESHOLD" ]; then
            log "DECISION: PASS (score $SCORE >= threshold $THRESHOLD)"
            FINAL_STATUS="passed"
            break
        fi

        # STAGNATION: same score as last attempt
        if [ "$SCORE" -eq "$PREV_SCORE" ] && [ "$PREV_SCORE" -ge 0 ]; then
            log "DECISION: STAGNATION (same score $SCORE twice)"
            if [ "$SCORE" -ge $((THRESHOLD - 1)) ]; then
                log "Close enough ($SCORE >= $(($THRESHOLD - 1))). Accepting."
                FINAL_STATUS="passed"
            fi
            break
        fi

        # DIMINISHING RETURNS: improved < 1 point
        if [ "$PREV_SCORE" -ge 0 ] && [ "$ATTEMPT" -gt 1 ]; then
            IMPROVEMENT=$((SCORE - PREV_SCORE))
            if [ "$IMPROVEMENT" -le 0 ]; then
                log "DECISION: DIMINISHING (score dropped or flat: $PREV_SCORE -> $SCORE)"
                # Revert to best version
                if [ -n "$BEST_COMMIT" ] && [ "$SCORE" -lt "$BEST_SCORE" ]; then
                    log "Reverting to best attempt (score $BEST_SCORE)"
                    git stash apply "$BEST_COMMIT" 2>/dev/null || true
                    SCORE=$BEST_SCORE
                fi
                if [ "$BEST_SCORE" -ge $((THRESHOLD - 1)) ]; then
                    FINAL_STATUS="passed"
                fi
                break
            fi
        fi

        PREV_SCORE=$SCORE

        # --- Write feedback for next attempt ---
        log "DECISION: RETRY (score $SCORE < threshold $THRESHOLD)"
        {
            echo "# Evaluator Feedback — Feature #$FEATURE_ID, Attempt $ATTEMPT"
            echo ""
            echo "Score: $SCORE/10 (need $THRESHOLD to pass)"
            echo ""
            echo "## Issues to fix:"
            echo "$FEEDBACK"
            echo ""
            echo "## Summary: $SUMMARY"
            echo ""
            echo "Fix ONLY the issues listed above. Do not start the feature over."
        } > "$LOG_DIR/feedback.md"

    done
    # ============================================================
    # END INNER LOOP
    # ============================================================

    FEATURE_END=$(date +%s)
    FEATURE_DURATION=$((FEATURE_END - FEATURE_START))
    LINES_ADDED=$(git diff --stat HEAD 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
    [ -z "$LINES_ADDED" ] && LINES_ADDED=0

    # --- Handle Result ---
    if [ "$FINAL_STATUS" = "passed" ]; then
        log "PASS: Feature #$FEATURE_ID scored $SCORE/10 in $ATTEMPT attempt(s)"

        # Mark passing via json_guard
        python3 json_guard.py --mark-passing "$FEATURE_ID" || log "WARNING: json_guard failed"

        # Git commit (harness authority)
        git add -A
        git commit -m "feat(#$FEATURE_ID): ${FEATURE_DESC:0:60} (score: $SCORE/10, $ATTEMPT attempts)" || log "WARNING: git commit failed"
        COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

        # Write metrics
        METRICS_ENTRY=$(python3 -c "
import json, time
from datetime import datetime, timezone
entry = {
    'id': $FEATURE_ID,
    'description': '''$FEATURE_DESC''',
    'category': '$FEATURE_CATEGORY',
    'status': 'passed',
    'attempts': $ATTEMPT_DATA,
    'final_score': $SCORE,
    'started_at': datetime.fromtimestamp($FEATURE_START, tz=timezone.utc).isoformat(),
    'completed_at': datetime.fromtimestamp($FEATURE_END, tz=timezone.utc).isoformat(),
    'lines_added': $LINES_ADDED,
    'commit_sha': '$COMMIT_SHA'
}
print(json.dumps(entry))
")
        python3 metrics_writer.py --add "$METRICS_ENTRY" || log "WARNING: metrics_writer failed"

        # Log to W&B
        python3 evaluate.py log \
            --feature-id "$FEATURE_ID" \
            --score "$SCORE" \
            --duration "$FEATURE_DURATION" \
            --tokens-coder "$CODEX_TOKENS" \
            --tokens-evaluator "$EVAL_TOKENS" \
            --status "passed" 2>/dev/null || true

        # Update progress
        log_progress "Feature #$FEATURE_ID PASSED (score: $SCORE/10, $ATTEMPT attempts, ${FEATURE_DURATION}s) — $(timestamp)"

        FEATURES_COMPLETED=$((FEATURES_COMPLETED + 1))
        CONSECUTIVE_SKIPS=0

        # Batch push
        if (( FEATURES_COMPLETED % PUSH_INTERVAL == 0 )); then
            log "Pushing to origin (batch, $FEATURES_COMPLETED features done)..."
            git push origin main 2>&1 || log "WARNING: git push failed (network?)"
        fi

    else
        log "SKIP: Feature #$FEATURE_ID best score $BEST_SCORE/10 after $ATTEMPT attempts"

        # Revert any uncommitted changes
        git checkout . 2>/dev/null || true
        git clean -fd 2>/dev/null || true

        # Mark skipped
        python3 json_guard.py --mark-skipped "$FEATURE_ID" || log "WARNING: json_guard failed"
        git add feature_list.json
        git commit -m "skip(#$FEATURE_ID): best score $BEST_SCORE/10 after $MAX_ATTEMPTS attempts" || true

        # Write skip metrics
        METRICS_ENTRY=$(python3 -c "
import json, time
from datetime import datetime, timezone
entry = {
    'id': $FEATURE_ID,
    'description': '''$FEATURE_DESC''',
    'category': '$FEATURE_CATEGORY',
    'status': 'skipped',
    'attempts': $ATTEMPT_DATA,
    'final_score': $BEST_SCORE,
    'started_at': datetime.fromtimestamp($FEATURE_START, tz=timezone.utc).isoformat(),
    'completed_at': datetime.fromtimestamp($(date +%s), tz=timezone.utc).isoformat(),
    'lines_added': 0,
    'commit_sha': ''
}
print(json.dumps(entry))
")
        python3 metrics_writer.py --add "$METRICS_ENTRY" || log "WARNING: metrics_writer failed"

        log_progress "Feature #$FEATURE_ID SKIPPED (best: $BEST_SCORE/10, $ATTEMPT attempts) — $(timestamp)"

        CONSECUTIVE_SKIPS=$((CONSECUTIVE_SKIPS + 1))

        # Stagnation warning
        if [ "$CONSECUTIVE_SKIPS" -ge 3 ]; then
            log "WARNING: 3 consecutive skips. Possible systemic issue."
            log_progress "STAGNATION WARNING: 3 consecutive features skipped at $(timestamp)"
            CONSECUTIVE_SKIPS=0
        fi
    fi

    # Clear feedback for next feature
    > "$LOG_DIR/feedback.md"

    # --- Status Summary ---
    PASSING_NOW=$(python3 -c "import json; print(sum(1 for f in json.load(open('feature_list.json')) if f.get('passes')))")
    SKIPPED_NOW=$(python3 -c "import json; print(sum(1 for f in json.load(open('feature_list.json')) if f.get('skipped')))")
    PENDING=$((TOTAL_FEATURES - PASSING_NOW - SKIPPED_NOW))

    log ""
    log "--- Status: $PASSING_NOW passed / $SKIPPED_NOW skipped / $PENDING pending ---"
    log ""

    # Brief pause
    sleep 2
done

# --- Final Push ---
log "Final push to origin..."
git push origin main 2>&1 || log "WARNING: final push failed"

log ""
log "=== AgentForge Ralph Loop Complete ==="
log "=== $(timestamp) ==="
log "=== Features: $FEATURES_COMPLETED completed ==="
python3 metrics_writer.py --summary
