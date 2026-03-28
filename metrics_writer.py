#!/usr/bin/env python3
"""AgentForge Metrics Writer — appends feature entries to public/metrics.json.

Usage:
  python3 metrics_writer.py --add '<json string>'
  python3 metrics_writer.py --set-started
  python3 metrics_writer.py --summary

The --add flag expects a JSON string with this schema:
{
  "id": 1,
  "description": "...",
  "category": "scaffold",
  "status": "passed" | "skipped",
  "attempts": [
    {"iteration": 1, "score": 7, "feedback": "...", "tokens_coder": 12000, "tokens_evaluator": 800, "duration_sec": 120}
  ],
  "final_score": 7,
  "started_at": "2026-03-28T12:31:00-07:00",
  "completed_at": "2026-03-28T12:34:22-07:00",
  "lines_added": 87,
  "commit_sha": "abc1234"
}
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone

METRICS_FILE = "public/metrics.json"


def load_metrics():
    try:
        with open(METRICS_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            "project": "AgentForge",
            "started_at": None,
            "features": [],
            "totals": {
                "tokens_coder": 0,
                "tokens_evaluator": 0,
                "cost_usd": 0.0,
                "elapsed_sec": 0
            }
        }


def save_metrics(metrics):
    with open(METRICS_FILE, "w") as f:
        json.dump(metrics, f, indent=2)
        f.write("\n")


def add_feature(feature_json_str):
    """Append a feature entry and update totals."""
    try:
        entry = json.loads(feature_json_str)
    except json.JSONDecodeError as e:
        print(json.dumps({"ok": False, "error": "Invalid JSON: %s" % str(e)}))
        sys.exit(1)

    metrics = load_metrics()

    # Don't add duplicates
    existing_ids = set(f.get("id") for f in metrics["features"])
    if entry.get("id") in existing_ids:
        # Update existing entry instead
        metrics["features"] = [f for f in metrics["features"] if f.get("id") != entry["id"]]

    metrics["features"].append(entry)

    # Update totals from all features
    total_tc = 0
    total_te = 0
    for feat in metrics["features"]:
        for attempt in feat.get("attempts", []):
            total_tc += attempt.get("tokens_coder", 0)
            total_te += attempt.get("tokens_evaluator", 0)

    metrics["totals"]["tokens_coder"] = total_tc
    metrics["totals"]["tokens_evaluator"] = total_te
    # Rough cost estimate: codex ~$0.01/1K tokens, evaluator ~$0.003/1K tokens
    metrics["totals"]["cost_usd"] = round(total_tc * 0.00001 + total_te * 0.000003, 4)

    # Calculate elapsed
    if metrics["started_at"] and metrics["features"]:
        completed_times = [f.get("completed_at", "") for f in metrics["features"] if f.get("completed_at")]
        if completed_times:
            metrics["totals"]["elapsed_sec"] = int(time.time() - _parse_iso(metrics["started_at"]))

    save_metrics(metrics)

    passing = sum(1 for f in metrics["features"] if f.get("status") == "passed")
    print(json.dumps({
        "ok": True,
        "feature_id": entry.get("id"),
        "total_features": len(metrics["features"]),
        "passing": passing,
        "cost_usd": metrics["totals"]["cost_usd"]
    }))


def set_started():
    """Set the started_at timestamp to now."""
    metrics = load_metrics()
    metrics["started_at"] = datetime.now(timezone.utc).isoformat()
    save_metrics(metrics)
    print(json.dumps({"ok": True, "started_at": metrics["started_at"]}))


def summary():
    """Print a summary of current metrics."""
    metrics = load_metrics()
    passing = sum(1 for f in metrics["features"] if f.get("status") == "passed")
    skipped = sum(1 for f in metrics["features"] if f.get("status") == "skipped")
    print(json.dumps({
        "project": metrics["project"],
        "started_at": metrics["started_at"],
        "features_recorded": len(metrics["features"]),
        "passing": passing,
        "skipped": skipped,
        "totals": metrics["totals"]
    }, indent=2))


def _parse_iso(iso_str):
    """Parse ISO timestamp to epoch seconds. Python 3.9 compatible."""
    try:
        # Try with timezone
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return dt.timestamp()
    except Exception:
        return time.time()


def main():
    parser = argparse.ArgumentParser(description="AgentForge Metrics Writer")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--add", type=str, metavar="JSON",
                       help="Add a feature entry (JSON string)")
    group.add_argument("--set-started", action="store_true",
                       help="Set started_at to current time")
    group.add_argument("--summary", action="store_true",
                       help="Print metrics summary")

    args = parser.parse_args()

    if args.add:
        add_feature(args.add)
    elif args.set_started:
        set_started()
    elif args.summary:
        summary()


if __name__ == "__main__":
    main()
