#!/usr/bin/env python3
"""AgentForge JSON Guard — validates feature_list.json mutations.

Only allowed mutation: passes: false -> true on a single feature.
All other changes (description, id, category, verify, adding/removing features) are rejected.

Usage:
  python3 json_guard.py --mark-passing N    # Mark feature N as passing
  python3 json_guard.py --mark-skipped N    # Mark feature N as skipped
  python3 json_guard.py --validate          # Check integrity of feature_list.json
"""
from __future__ import annotations

import argparse
import json
import sys

FEATURE_LIST = "feature_list.json"


def load_features():
    with open(FEATURE_LIST, "r") as f:
        return json.load(f)


def save_features(features):
    with open(FEATURE_LIST, "w") as f:
        json.dump(features, f, indent=2)
        f.write("\n")


def mark_passing(feature_id):
    """Flip passes: false -> true for a single feature. Reject if already passing."""
    features = load_features()

    target = None
    for f in features:
        if f["id"] == feature_id:
            target = f
            break

    if target is None:
        print(json.dumps({"ok": False, "error": "Feature %d not found" % feature_id}))
        sys.exit(1)

    if target.get("passes", False):
        print(json.dumps({"ok": False, "error": "Feature %d already passing" % feature_id}))
        sys.exit(1)

    target["passes"] = True
    save_features(features)
    print(json.dumps({"ok": True, "feature_id": feature_id, "action": "marked_passing"}))


def mark_skipped(feature_id):
    """Add skipped: true to a feature."""
    features = load_features()

    target = None
    for f in features:
        if f["id"] == feature_id:
            target = f
            break

    if target is None:
        print(json.dumps({"ok": False, "error": "Feature %d not found" % feature_id}))
        sys.exit(1)

    target["skipped"] = True
    save_features(features)
    print(json.dumps({"ok": True, "feature_id": feature_id, "action": "marked_skipped"}))


def validate():
    """Check feature_list.json integrity."""
    features = load_features()
    errors = []

    if not isinstance(features, list):
        errors.append("Root is not an array")
        print(json.dumps({"ok": False, "errors": errors}))
        sys.exit(1)

    if len(features) != 30:
        errors.append("Expected 30 features, found %d" % len(features))

    ids_seen = set()
    for f in features:
        fid = f.get("id")
        if fid is None:
            errors.append("Feature missing id field")
            continue
        if fid in ids_seen:
            errors.append("Duplicate id: %d" % fid)
        ids_seen.add(fid)

        for required in ("category", "description", "verify", "passes"):
            if required not in f:
                errors.append("Feature %d missing field: %s" % (fid, required))

    passing = sum(1 for f in features if f.get("passes"))
    skipped = sum(1 for f in features if f.get("skipped"))
    pending = len(features) - passing - skipped

    result = {
        "ok": len(errors) == 0,
        "total": len(features),
        "passing": passing,
        "skipped": skipped,
        "pending": pending,
        "errors": errors
    }
    print(json.dumps(result))
    sys.exit(0 if result["ok"] else 1)


def main():
    parser = argparse.ArgumentParser(description="AgentForge JSON Guard")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--mark-passing", type=int, metavar="N",
                       help="Mark feature N as passing")
    group.add_argument("--mark-skipped", type=int, metavar="N",
                       help="Mark feature N as skipped")
    group.add_argument("--validate", action="store_true",
                       help="Validate feature_list.json integrity")

    args = parser.parse_args()

    if args.mark_passing is not None:
        mark_passing(args.mark_passing)
    elif args.mark_skipped is not None:
        mark_skipped(args.mark_skipped)
    elif args.validate:
        validate()


if __name__ == "__main__":
    main()
