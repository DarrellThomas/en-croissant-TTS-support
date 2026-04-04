"""ep_jobs — Durable JSON job specs for En Parlant~

Job specs live in ep_brain/jobs/ as validated JSON files.
Lifecycle: spec → planning → in_progress → testing → review → done
"""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR  = Path(__file__).parent.resolve()
REPO_ROOT   = SCRIPT_DIR.parent
JOBS_DIR    = SCRIPT_DIR / "jobs"
SCHEMA_PATH = SCRIPT_DIR / "job_schema.json"

VALID_STATES = ["spec", "planning", "in_progress", "testing", "review", "done", "blocked", "discarded"]

STATE_ICONS = {
    "spec": "📋", "planning": "🔍", "in_progress": "🔨",
    "testing": "🧪", "review": "👀", "done": "✅",
    "blocked": "🚫", "discarded": "🗑️",
}

# ──────────────────────────────────────────────────────────────────────────────
# File helpers
# ──────────────────────────────────────────────────────────────────────────────

def next_job_id() -> str:
    """Find the next EP-NNN id by scanning existing files."""
    existing = sorted(JOBS_DIR.glob("EP-*.json"))
    if not existing:
        return "EP-001"
    last = existing[-1].stem
    num = int(last.split("-")[1]) + 1
    return f"EP-{num:03d}"


def load_schema() -> dict:
    with SCHEMA_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_job(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_job(path: Path, job: dict):
    with path.open("w", encoding="utf-8") as f:
        json.dump(job, f, indent=2, ensure_ascii=False)
        f.write("\n")


def job_path(job_id: str) -> Path:
    return JOBS_DIR / f"{job_id}.json"


def validate_job(job: dict, schema: dict) -> list[str]:
    """Return list of error strings. Empty = valid."""
    try:
        from jsonschema import Draft202012Validator
    except ImportError:
        return ["jsonschema not installed — run: pip install jsonschema"]
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(job), key=lambda e: list(e.path))
    return [f"[{'.'.join(str(p) for p in e.path) or '<root>'}] {e.message}" for e in errors]


def list_jobs(state_filter: str | None = None) -> list[dict]:
    """Return summary list of all jobs."""
    JOBS_DIR.mkdir(exist_ok=True)
    jobs = []
    for p in sorted(JOBS_DIR.glob("EP-*.json")):
        try:
            j = load_job(p)
            if state_filter and j.get("state") != state_filter:
                continue
            jobs.append({
                "job_id": j["job_id"], "title": j["title"],
                "state": j["state"], "type": j["type"],
                "priority": j["priority"],
            })
        except Exception:
            pass
    return jobs


# ──────────────────────────────────────────────────────────────────────────────
# CLI commands
# ──────────────────────────────────────────────────────────────────────────────

def cmd_jobs_new(conn, args):
    """Scaffold a new job spec from a template."""
    JOBS_DIR.mkdir(exist_ok=True)
    job_id = next_job_id()
    job_type = args.type or "cherry_pick"
    priority = args.priority or 2

    job = {
        "schema_version": "1.0",
        "job_id": job_id,
        "title": args.title,
        "state": "spec",
        "type": job_type,
        "priority": priority,
        "source": {},
        "description": args.title,
        "scope": {
            "in_scope": ["TODO: define what this job covers"],
            "out_of_scope": ["TODO: define what is excluded"],
        },
        "contracts": {
            "correctness": {
                "requirements": ["TODO: define correctness requirements"],
            },
            "performance": {"no_regression": True},
            "compatibility": {"backward_compatible": True, "migration_needed": False},
        },
        "acceptance_gates": [
            "All automated tests pass",
            "pnpm format && pnpm lint:fix clean",
            "TODO: add job-specific gates",
        ],
        "test_plan": {
            "automated": [
                {"name": "cargo test", "command": "cd src-tauri && cargo test"},
                {"name": "lint", "command": "pnpm lint:fix"},
            ],
            "manual": ["TODO: define manual verification steps"],
        },
        "primary_files": ["TODO: list files to be modified"],
        "done_criteria": ["TODO: define when this job is complete"],
    }

    path = job_path(job_id)
    save_job(path, job)
    print(f"Created {path.name}  [{job_type}]  {args.title}")
    print(f"  Edit: {path}")


def cmd_jobs_from_pr(conn, args):
    """Create a job spec from an upstream GitHub PR."""
    JOBS_DIR.mkdir(exist_ok=True)
    pr_num = args.pr_number

    try:
        r = subprocess.run(
            ["gh", "pr", "view", str(pr_num),
             "--repo", "franciscoBSalgueiro/en-croissant",
             "--json", "title,body,files,state,mergedAt,labels"],
            capture_output=True, text=True, timeout=15,
        )
        if r.returncode != 0:
            print(f"ERROR: gh pr view failed: {r.stderr.strip()}")
            return
        pr = json.loads(r.stdout)
    except FileNotFoundError:
        print("ERROR: gh CLI not found")
        return
    except Exception as e:
        print(f"ERROR: {e}")
        return

    job_id = next_job_id()
    files = [f["path"] for f in pr.get("files", [])]
    labels = [l["name"] for l in pr.get("labels", [])]

    job = {
        "schema_version": "1.0",
        "job_id": job_id,
        "title": f"Cherry-pick PR #{pr_num}: {pr['title']}",
        "state": "spec",
        "type": "cherry_pick",
        "priority": args.priority or 2,
        "source": {
            "upstream_pr": pr_num,
            "url": f"https://github.com/franciscoBSalgueiro/en-croissant/pull/{pr_num}",
            "notes": f"Merged {pr.get('mergedAt', 'unknown')}",
        },
        "description": (pr.get("body") or pr["title"])[:500],
        "notes": [
            f"Upstream files: {', '.join(files[:10])}",
            f"Labels: {', '.join(labels) or 'none'}",
        ],
        "scope": {
            "in_scope": [
                f"Port upstream PR #{pr_num} changes to our fork",
                "Resolve any merge conflicts with our modifications",
                "Verify the fix works in our build",
            ],
            "out_of_scope": [
                "Unrelated changes to the same files",
                "Upstream features we haven't adopted",
            ],
        },
        "contracts": {
            "correctness": {
                "requirements": [
                    f"The bug/feature from PR #{pr_num} works correctly",
                    "No regressions in existing functionality",
                ],
                "edge_cases": ["TODO: identify edge cases"],
            },
            "performance": {"no_regression": True},
            "compatibility": {"backward_compatible": True, "migration_needed": False},
        },
        "acceptance_gates": [
            "cargo test passes",
            "pnpm format && pnpm lint:fix clean",
            f"PR #{pr_num} behavior verified in running app",
        ],
        "test_plan": {
            "automated": [
                {"name": "cargo test", "command": "cd src-tauri && cargo test"},
                {"name": "lint", "command": "pnpm lint:fix"},
            ],
            "manual": [
                f"Verify PR #{pr_num} fix in running app",
                "TODO: specific verification steps",
            ],
        },
        "primary_files": files,
        "done_criteria": [
            f"PR #{pr_num} changes successfully ported",
            "All tests pass",
            "Verified in running app",
            "Committed and pushed",
        ],
    }

    path = job_path(job_id)
    save_job(path, job)
    print(f"Created {path.name}  [cherry_pick]  {job['title']}")
    print(f"  Source: PR #{pr_num} — {pr['title']}")
    print(f"  Files:  {len(files)} upstream files")
    print(f"  Edit:   {path}")


def cmd_jobs_list(conn, args):
    """List all job specs with status."""
    state_filter = args.state if hasattr(args, "state") and args.state else None
    jobs = list_jobs(state_filter)
    if not jobs:
        print("No job specs found. Create one with: ep_brain jobs new --title '...'")
        return
    for j in jobs:
        icon = STATE_ICONS.get(j["state"], "❓")
        print(f"  {icon}  {j['job_id']}  P{j['priority']}  [{j['type']:12s}]  [{j['state']:11s}]  {j['title']}")


def cmd_jobs_show(conn, args):
    """Show full details of a job spec."""
    path = job_path(args.job_id)
    if not path.exists():
        print(f"Not found: {path}")
        return
    job = load_job(path)
    print(json.dumps(job, indent=2, ensure_ascii=False))


def cmd_jobs_validate(conn, args):
    """Validate job specs against schema."""
    JOBS_DIR.mkdir(exist_ok=True)
    if args.job_id:
        paths = [job_path(args.job_id)]
    else:
        paths = sorted(JOBS_DIR.glob("EP-*.json"))

    if not paths:
        print("No specs to validate.")
        return

    schema = load_schema()
    ok = fail = 0
    for path in paths:
        if not path.exists():
            print(f"  MISS  {path.name}")
            fail += 1
            continue
        job = load_job(path)
        errs = validate_job(job, schema)
        if errs:
            print(f"  FAIL  {path.name}")
            for e in errs:
                print(f"        {e}")
            fail += 1
        else:
            print(f"  OK    {path.name}  [{job['state']}]  {job['title']}")
            ok += 1
    print(f"\n  {ok + fail} checked, {ok} valid, {fail} failed")


def cmd_jobs_state(conn, args):
    """Transition a job to a new state."""
    path = job_path(args.job_id)
    if not path.exists():
        print(f"Not found: {path}")
        return
    job = load_job(path)
    old = job["state"]
    job["state"] = args.new_state
    save_job(path, job)
    print(f"  {job['job_id']}  {old} → {args.new_state}  {job['title']}")


def _now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def cmd_jobs_log(conn, args):
    """Append an iteration log entry to a job."""
    path = job_path(args.job_id)
    if not path.exists():
        print(f"Not found: {path}")
        return
    job = load_job(path)
    if "iteration_log" not in job:
        job["iteration_log"] = []
    entry = {
        "timestamp": _now_utc(),
        "action": args.action,
        "result": args.result,
        "keep_or_discard": args.keep or "keep",
    }
    if args.notes:
        entry["notes"] = args.notes
    job["iteration_log"].append(entry)
    save_job(path, job)
    print(f"  Logged iteration #{len(job['iteration_log'])} on {job['job_id']}")


def cmd_jobs_run_tests(conn, args):
    """Run the automated test plan for a job."""
    path = job_path(args.job_id)
    if not path.exists():
        print(f"Not found: {path}")
        return
    job = load_job(path)
    tests = job.get("test_plan", {}).get("automated", [])
    if not tests:
        print("  No automated tests defined in this job spec.")
        return

    passed = failed = 0
    for t in tests:
        name = t["name"]
        cmd = t["command"]
        print(f"  Running: {name}")
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True,
                           cwd=str(REPO_ROOT), timeout=300)
        if r.returncode == 0:
            print("    ✅ PASS")
            passed += 1
        else:
            print("    ❌ FAIL")
            print(r.stderr[-500:] if r.stderr else r.stdout[-500:])
            failed += 1

    print(f"\n  {passed + failed} tests: {passed} passed, {failed} failed")
    return failed == 0


# ──────────────────────────────────────────────────────────────────────────────
# Argparse wiring (called from ep_brain.py main)
# ──────────────────────────────────────────────────────────────────────────────

def register_argparse(sub):
    """Register the 'jobs' subcommand on the given argparse subparsers object."""
    pj = sub.add_parser("jobs", help="Manage durable job specs")
    pj_sub = pj.add_subparsers(dest="jobs_cmd", metavar="SUBCOMMAND")

    jn = pj_sub.add_parser("new", help="Scaffold a new job spec")
    jn.add_argument("--title", required=True)
    jn.add_argument("--type", choices=["cherry_pick", "bugfix", "feature", "refactor", "infra", "test"])
    jn.add_argument("--priority", type=int)

    jfp = pj_sub.add_parser("from-pr", help="Create spec from upstream GitHub PR")
    jfp.add_argument("pr_number", type=int)
    jfp.add_argument("--priority", type=int)

    jl = pj_sub.add_parser("list", help="List all job specs")
    jl.add_argument("--state")

    jsh = pj_sub.add_parser("show", help="Show job details")
    jsh.add_argument("job_id")

    jv = pj_sub.add_parser("validate", help="Validate spec(s) against schema")
    jv.add_argument("job_id", nargs="?")

    jst = pj_sub.add_parser("state", help="Transition job state")
    jst.add_argument("job_id")
    jst.add_argument("new_state", choices=VALID_STATES)

    jlog = pj_sub.add_parser("log", help="Append iteration log entry")
    jlog.add_argument("job_id")
    jlog.add_argument("--action", required=True)
    jlog.add_argument("--result", required=True)
    jlog.add_argument("--keep", choices=["keep", "discard", "partial"])
    jlog.add_argument("--notes")

    jrt = pj_sub.add_parser("test", help="Run automated tests from job spec")
    jrt.add_argument("job_id")

    return pj


DISPATCH = {
    "new":      cmd_jobs_new,
    "from-pr":  cmd_jobs_from_pr,
    "list":     cmd_jobs_list,
    "show":     cmd_jobs_show,
    "validate": cmd_jobs_validate,
    "state":    cmd_jobs_state,
    "log":      cmd_jobs_log,
    "test":     cmd_jobs_run_tests,
}
