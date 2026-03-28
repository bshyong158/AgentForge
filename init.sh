#!/bin/bash
# AgentForge — Environment Setup
# Run this once at the start of the hackathon to bootstrap the project
set -euo pipefail

echo "=== AgentForge Init ==="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js required. Install with: brew install node"; exit 1; }
command -v codex >/dev/null 2>&1 || { echo "Codex CLI required. Install with: npm install -g @openai/codex"; exit 1; }

# Verify API keys
if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "WARNING: OPENAI_API_KEY not set. Export it before running the loop."
fi

# Initialize git if not already
if [ ! -d .git ]; then
  git init
  git add feature_list.json PROMPT_build.md PROMPT_plan.md EVALUATOR.md AGENTS.md init.sh ralph-loop.sh claude-progress.txt .gitignore
  git commit -m "init: AgentForge harness config"
fi

# Create Next.js app if not exists
if [ ! -f package.json ]; then
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --yes
  npm install recharts
  npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
fi

# Add test script to package.json if missing
if ! grep -q '"test"' package.json 2>/dev/null; then
  npx json -I -f package.json -e 'this.scripts.test = "vitest run"'
fi

# Start dev server in background (for agent to verify against)
echo "Starting dev server..."
npm run dev &
DEV_PID=$!
echo "Dev server PID: $DEV_PID"
echo $DEV_PID > .dev-pid

# Verify it's running
sleep 5
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "Dev server running at http://localhost:3000"
else
  echo "WARNING: Dev server may not be ready yet. Give it a moment."
fi

echo ""
echo "=== Init complete ==="
echo "Run: chmod +x ralph-loop.sh && ./ralph-loop.sh"
