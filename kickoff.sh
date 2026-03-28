#!/bin/bash
# AgentForge Kickoff — Clean slate + start Ralph loop
# Run this at 12:30 PM to begin the demo run
set -euo pipefail

cd ~/AgentForge

echo "=== AgentForge Kickoff ==="
echo "Time: $(date)"
echo ""

# --- Step 1: Stop any running dev servers ---
echo "[1/6] Killing any running dev servers..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*3001" 2>/dev/null || true

# --- Step 2: Preserve harness config files ---
echo "[2/6] Preserving harness config files..."
TEMP_DIR=$(mktemp -d)
for f in ralph-loop.sh init.sh evaluate.py json_guard.py metrics_writer.py \
         feature_list.json AGENTS.md EVALUATOR.md PROMPT_build.md PROMPT_plan.md \
         CLAUDE.md .vercel .gitignore; do
    if [ -e "$f" ]; then
        cp -r "$f" "$TEMP_DIR/"
    fi
done

# --- Step 3: Clean main branch ---
echo "[3/6] Cleaning main branch..."
git checkout main 2>/dev/null || git checkout -b main
rm -rf src/ public/ node_modules/ .ralph-logs/ test/ .next/
rm -f package.json package-lock.json tsconfig.json tailwind.config.* \
     next.config.* postcss.config.* README.md claude-progress.txt \
     metrics.json .ralph-state.json

# --- Step 4: Restore harness configs with fresh state ---
echo "[4/6] Restoring harness config files..."
cp -r "$TEMP_DIR"/* . 2>/dev/null || true
rm -rf "$TEMP_DIR"

# Reset feature_list.json — all passes back to false
python3 -c "
import json
with open('feature_list.json', 'r') as f:
    features = json.load(f)
for feat in features:
    feat['passes'] = False
with open('feature_list.json', 'w') as f:
    json.dump(features, f, indent=2)
print(f'Reset {len(features)} features to passes: false')
"

# Reset progress file
echo "# AgentForge Progress — Demo Run $(date '+%Y-%m-%d %H:%M')" > claude-progress.txt

# --- Step 5: Commit clean slate + push ---
echo "[5/6] Committing clean slate..."
git add -A
git commit -m "clean slate: demo run $(date '+%H:%M')"
git push origin main --force

echo ""
echo "=== Clean slate pushed. Vercel will deploy the empty state. ==="
echo ""

# --- Step 6: Prevent sleep + start Ralph loop ---
echo "[6/6] Starting Ralph loop..."
caffeinate -s &
echo "caffeinate PID: $!"
echo ""
echo "========================================="
echo "  RALPH LOOP STARTING — WALK AWAY"
echo "  Monitor: W&B dashboard on phone"
echo "  Reattach: tmux attach -t ralph"
echo "========================================="
echo ""

./ralph-loop.sh
