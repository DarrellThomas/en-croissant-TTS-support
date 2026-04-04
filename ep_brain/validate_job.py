#!/usr/bin/env python3
"""Validate an En Parlant~ job spec against the schema.

Usage:
    python validate_job.py jobs/EP-001.json
    python validate_job.py jobs/*.json          # validate all
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

SCHEMA_PATH = Path(__file__).parent / "job_schema.json"


def load_json(path: Path) -> dict:
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise SystemExit(f"ERROR: file not found: {path}")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"ERROR: invalid JSON in {path}: {exc}")


def validate_one(job_path: Path, schema: dict) -> list[str]:
    """Return list of error strings, empty if valid."""
    from jsonschema import Draft202012Validator

    job = load_json(job_path)
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(job), key=lambda e: list(e.path))

    msgs = []
    for err in errors:
        path = ".".join(str(p) for p in err.path) or "<root>"
        msgs.append(f"  [{path}] {err.message}")

    # Semantic checks beyond JSON schema
    if not errors:
        if not job.get("acceptance_gates"):
            msgs.append("  [acceptance_gates] must have at least one gate")
        if not job.get("done_criteria"):
            msgs.append("  [done_criteria] must have at least one criterion")
        tests = job.get("test_plan", {}).get("automated", [])
        if not tests:
            msgs.append("  [test_plan.automated] should have at least one automated test")

    return msgs


def main() -> int:
    if len(sys.argv) < 2:
        # Auto-discover all jobs
        jobs_dir = Path(__file__).parent / "jobs"
        paths = sorted(jobs_dir.glob("EP-*.json"))
        if not paths:
            print("No job specs found in ep_brain/jobs/")
            return 0
    else:
        paths = [Path(a) for a in sys.argv[1:]]

    try:
        from jsonschema import Draft202012Validator  # noqa: F401
    except ImportError:
        raise SystemExit(
            "ERROR: missing 'jsonschema'. Install with: pip install jsonschema"
        )

    schema = load_json(SCHEMA_PATH)
    total = 0
    failed = 0

    for path in paths:
        total += 1
        errs = validate_one(path, schema)
        if errs:
            failed += 1
            print(f"FAIL  {path.name}")
            for e in errs:
                print(e)
        else:
            job = load_json(path)
            print(f"OK    {path.name}  [{job['state']}]  {job['title']}")

    print(f"\n{total} specs checked, {total - failed} valid, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
