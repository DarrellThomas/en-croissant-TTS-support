#!/usr/bin/env python3
"""ep_brain — En Parlant~ Project Brain

SQLite-backed CLI for tracking upstream issues, project tasks, and upstream PRs.
The markdown files (UPSTREAM_STATUS.md, UPSTREAM_TASKS.md) are generated exports
from this database — edit via CLI, not directly.
"""

import argparse
import json
import os
import re
import sqlite3
import subprocess
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

# ──────────────────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = Path(__file__).parent.resolve()
REPO_ROOT    = SCRIPT_DIR.parent
DB_PATH      = SCRIPT_DIR / "ep_brain.db"

# Export destinations (written by ep_brain)
UPSTREAM_STATUS_MD  = SCRIPT_DIR / "UPSTREAM_STATUS.md"
UPSTREAM_TASKS_MD   = SCRIPT_DIR / "UPSTREAM_TASKS.md"

# Import sources (existing files in .claude/)
CLAUDE_DIR                = REPO_ROOT / ".claude"
IMPORT_UPSTREAM_STATUS_MD = CLAUDE_DIR / "UPSTREAM_STATUS.md"
IMPORT_UPSTREAM_ISSUES_MD = CLAUDE_DIR / "UPSTREAM_ISSUES.md"   # symlink → Obsidian vault
IMPORT_MEMORY_TASKS_MD = Path.home() / ".claude/projects/-data-src-en-parlant/memory/tasks.md"
IMPORT_CONFIG_TASKS_MD = Path("/data/src/claude-code-config/projects/en-parlant/claude/TASKS.md")

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────

BATCH_NAMES = {
    1:  "BATCH 1: Easy Bug Fixes",
    2:  "BATCH 2: Moderate Bug Fixes",
    3:  "BATCH 3: Hard Bug Fixes",
    4:  "BATCH 4: Easy Enhancements",
    5:  "BATCH 5: Moderate Enhancements",
    6:  "BATCH 6: Large Enhancements",
    7:  "BATCH 7: Upstream Cherry-Picks (v0.15.0+)",
    8:  "BATCH 8: Cherry-Picks (Unfiled Bugs)",
    9:  "BATCH 9: Cherry-Picks (Tier 2)",
    99: "WISHLIST",
}

BATCH_CATEGORIES = {
    1: "bug_easy", 2: "bug_moderate", 3: "bug_hard",
    4: "enh_easy", 5: "enh_moderate", 6: "enh_large",
    7: "cherry_pick", 8: "cherry_unfiled", 9: "cherry_tier2",
    99: "wishlist",
}

# ──────────────────────────────────────────────────────────────────────────────
# DB helpers
# ──────────────────────────────────────────────────────────────────────────────

def get_db(path=None) -> sqlite3.Connection:
    conn = sqlite3.connect(str(path or DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_db(conn):
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS issues (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            ref          TEXT NOT NULL,
            title        TEXT NOT NULL,
            batch        INTEGER NOT NULL,
            category     TEXT NOT NULL DEFAULT '',
            subcategory  TEXT NOT NULL DEFAULT '',
            relevance    TEXT NOT NULL DEFAULT '',
            priority     TEXT NOT NULL DEFAULT '',
            status       TEXT NOT NULL DEFAULT 'open',
            status_label TEXT NOT NULL DEFAULT '',
            our_commit   TEXT NOT NULL DEFAULT '',
            description  TEXT NOT NULL DEFAULT '',
            notes        TEXT NOT NULL DEFAULT '',
            sort_order   INTEGER NOT NULL DEFAULT 0,
            added_at     TEXT NOT NULL,
            updated_at   TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_issues_batch  ON issues(batch);
        CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
        CREATE INDEX IF NOT EXISTS idx_issues_ref    ON issues(ref);

        CREATE TABLE IF NOT EXISTS tasks (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            title        TEXT NOT NULL,
            notes        TEXT NOT NULL DEFAULT '',
            status       TEXT NOT NULL DEFAULT 'pending',
            our_commit   TEXT NOT NULL DEFAULT '',
            sort_order   INTEGER NOT NULL DEFAULT 0,
            added_at     TEXT NOT NULL,
            updated_at   TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS upstream_prs (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            pr_number    INTEGER NOT NULL UNIQUE,
            title        TEXT NOT NULL,
            state        TEXT NOT NULL DEFAULT 'Open',
            notes        TEXT NOT NULL DEFAULT '',
            added_at     TEXT NOT NULL,
            updated_at   TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name   TEXT NOT NULL,
            row_id       INTEGER NOT NULL,
            field        TEXT NOT NULL,
            old_value    TEXT NOT NULL DEFAULT '',
            new_value    TEXT NOT NULL DEFAULT '',
            commit_hash  TEXT NOT NULL DEFAULT '',
            changed_by   TEXT NOT NULL DEFAULT 'darrell',
            changed_at   TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS meta (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        INSERT OR IGNORE INTO meta VALUES ('schema_version', '1');
        INSERT OR IGNORE INTO meta VALUES ('last_export', '');
    """)
    conn.commit()


def now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def git_head() -> str:
    try:
        r = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, cwd=REPO_ROOT, timeout=3
        )
        return r.stdout.strip() if r.returncode == 0 else ""
    except Exception:
        return ""


def audit(conn, table_name, row_id, field, old_val, new_val, commit_hash=""):
    conn.execute(
        "INSERT INTO audit_log "
        "(table_name, row_id, field, old_value, new_value, commit_hash, changed_at) "
        "VALUES (?,?,?,?,?,?,?)",
        (table_name, row_id, field, old_val, new_val, commit_hash, now_utc())
    )

# ──────────────────────────────────────────────────────────────────────────────
# Parsing helpers
# ──────────────────────────────────────────────────────────────────────────────

_HEADER_CELLS = {
    "#", "upstream", "id", "issue", "pr", "metric", "batch", "total",
    "upstream commit", "title", "status", "commit", "relevance", "priority",
    "category", "count", "notes", "size", "files",
}

def parse_table_cells(line: str):
    """Split a markdown table row into a list of stripped cell strings, or None if not a row."""
    s = line.strip()
    if not s.startswith("|"):
        return None
    # Separator row
    if re.match(r"^\|[\s\-|]+\|$", s):
        return None
    cells = [c.strip() for c in s.split("|")]
    cells = [c for c in cells if c != ""]  # remove empty from leading/trailing |
    return cells if cells else None


def is_header_row(cells) -> bool:
    """True if this looks like a column header row rather than a data row."""
    if not cells:
        return True
    first = cells[0].strip("`*# ").lower()
    return first in _HEADER_CELLS or first == ""


def normalize_status(cell: str):
    """Return (status, status_label) from a markdown status cell."""
    c = cell.strip()
    lower = c.lower()
    if "n/a" in lower:
        return "skipped", "N/A"
    if "addressed" in lower:
        return "done", "Addressed"
    if "✅" in c or lower in ("fixed", "done", "merged", "complete", "completed"):
        return "done", "Fixed"
    if "⬜" in c or lower == "open":
        return "open", ""
    if "⏭" in c or lower == "skipped":
        return "skipped", ""
    return "open", ""


def clean_ref(ref: str) -> str:
    """Trim whitespace from a ref cell. Preserve backticks (used for commit hash refs)."""
    return ref.strip()


def extract_commits(text: str) -> str:
    """Find all 7–40 char hex hashes in text; return space-joined unique list."""
    found = re.findall(r'\b([0-9a-f]{7,40})\b', text.lower())
    return " ".join(dict.fromkeys(found))

# ──────────────────────────────────────────────────────────────────────────────
# Import: UPSTREAM_STATUS.md  (primary — 7 batches + wishlist)
# ──────────────────────────────────────────────────────────────────────────────

def import_upstream_status(conn, path=None):
    src = Path(path) if path else IMPORT_UPSTREAM_STATUS_MD
    if not src.exists():
        print(f"  [skip] Not found: {src}", file=sys.stderr)
        return 0, 0

    lines = src.read_text(encoding="utf-8").splitlines()
    ts = now_utc()
    inserted = skipped = 0
    current_batch = None
    current_subcat = ""
    sort_idx = 0

    for line in lines:
        # Batch header  e.g. "## BATCH 1: Easy Bug Fixes — ..."
        m = re.match(r"^## BATCH (\d+):", line)
        if m:
            current_batch = int(m.group(1))
            current_subcat = ""
            sort_idx = 0
            continue

        # Wishlist header
        if re.match(r"^## WISHLIST", line):
            current_batch = 99
            current_subcat = ""
            sort_idx = 0
            continue

        # Stop at summary / next major section
        if re.match(r"^## (Summary|WISHLIST$)", line) and current_batch not in (None, 99):
            # We hit Summary — no more issue tables
            if line.startswith("## Summary"):
                current_batch = None
            continue

        # Batch 7 sub-section  e.g. "### Bug Fixes"
        if current_batch == 7 and line.startswith("### "):
            sub = line[4:].strip().lower()
            if "bug" in sub:       current_subcat = "bugfix"
            elif "feature" in sub: current_subcat = "feature"
            elif "ui" in sub:      current_subcat = "uiux"
            elif "infra" in sub:   current_subcat = "infra"
            else:                  current_subcat = sub.replace(" ", "_")
            sort_idx = 0
            continue

        if current_batch is None:
            continue

        cells = parse_table_cells(line)
        if cells is None or is_header_row(cells):
            continue

        ref = clean_ref(cells[0])
        if not ref:
            continue
        title   = cells[1].strip() if len(cells) > 1 else ""
        category = BATCH_CATEGORIES.get(current_batch, "unknown")

        status = "open"; status_label = ""; our_commit = ""; relevance = ""; priority = ""; notes = ""

        if current_batch in (1, 2):
            # | ref | title | status | commit |
            status, status_label = normalize_status(cells[2] if len(cells) > 2 else "")
            our_commit = extract_commits(cells[3] if len(cells) > 3 else "")

        elif current_batch == 3:
            # | ref | title | status | notes (may contain commits) |
            status, status_label = normalize_status(cells[2] if len(cells) > 2 else "")
            raw = cells[3] if len(cells) > 3 else ""
            our_commit = extract_commits(raw)
            notes = raw

        elif current_batch in (4, 5, 6):
            # | ref | title | relevance | status [| notes] |
            relevance = cells[2] if len(cells) > 2 else ""
            status, status_label = normalize_status(cells[3] if len(cells) > 3 else "")
            notes = cells[4] if len(cells) > 4 else ""

        elif current_batch == 7:
            # | upstream_ref | title | priority | status [| commit] |
            priority = cells[2] if len(cells) > 2 else ""
            status, status_label = normalize_status(cells[3] if len(cells) > 3 else "")
            our_commit = extract_commits(cells[4] if len(cells) > 4 else "")

        elif current_batch == 99:
            # | ID | title | notes |
            notes = cells[2] if len(cells) > 2 else ""
            status = "open"

        exists = conn.execute(
            "SELECT id FROM issues WHERE ref=? AND batch=?", (ref, current_batch)
        ).fetchone()

        if exists is None:
            conn.execute(
                """INSERT INTO issues
                   (ref, title, batch, category, subcategory, relevance, priority,
                    status, status_label, our_commit, notes, sort_order, added_at, updated_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (ref, title, current_batch, category, current_subcat,
                 relevance, priority, status, status_label, our_commit, notes,
                 sort_idx, ts, ts)
            )
            inserted += 1
        else:
            skipped += 1

        sort_idx += 1

    conn.commit()
    return inserted, skipped

# ──────────────────────────────────────────────────────────────────────────────
# Import: UPSTREAM_ISSUES.md  (enrichment — descriptions, skip list, PRs, old batches)
# ──────────────────────────────────────────────────────────────────────────────

def import_upstream_issues(conn, path=None):
    src = Path(path) if path else IMPORT_UPSTREAM_ISSUES_MD
    if not src.exists():
        print(f"  [skip] Not found: {src}", file=sys.stderr)
        return 0, 0, 0

    text = src.read_text(encoding="utf-8")
    lines = text.splitlines()
    ts = now_utc()
    desc_updated = skip_inserted = prs_inserted = 0

    # ── Pass 1: collect descriptions from <details> blocks ──────────────────
    descriptions = {}   # (ref, batch) → description text

    current_batch = None
    current_ref   = None
    in_details    = False
    buf           = []

    for line in lines:
        m = re.match(r"^## BATCH (\d+):", line)
        if m:
            # save any pending description
            if current_ref and current_batch and buf:
                descriptions[(current_ref, current_batch)] = "\n".join(buf).strip()
            current_batch = int(m.group(1)); current_ref = None; in_details = False; buf = []
            continue

        if line.startswith("## "):
            if current_ref and current_batch and buf:
                descriptions[(current_ref, current_batch)] = "\n".join(buf).strip()
            current_batch = None; current_ref = None; in_details = False; buf = []
            continue

        if not current_batch:
            continue

        # Heading inside a <details> block
        dm = re.match(r"^### (#\S+|UP-\d+|W-\d+)\s+[—–-]\s+(.+)", line)
        if dm:
            if current_ref and buf:
                descriptions[(current_ref, current_batch)] = "\n".join(buf).strip()
            current_ref = dm.group(1)
            in_details = True
            buf = []
            continue

        if in_details:
            if line.strip().startswith("</details>"):
                if current_ref and buf:
                    descriptions[(current_ref, current_batch)] = "\n".join(buf).strip()
                current_ref = None; in_details = False; buf = []
            elif not line.strip().startswith("<"):
                buf.append(line)

    # Update descriptions for existing issues (only where blank)
    for (ref, batch), desc in descriptions.items():
        if not desc:
            continue
        conn.execute(
            "UPDATE issues SET description=?, updated_at=? "
            "WHERE ref=? AND batch=? AND description=''",
            (desc, ts, ref, batch)
        )
        desc_updated += conn.execute("SELECT changes()").fetchone()[0]

    # ── Pass 2: skip list, upstream PRs, old batch 7/8 cherry-picks ─────────
    current_section = None
    current_batch   = None

    for line in lines:
        m = re.match(r"^## BATCH (\d+):", line)
        if m:
            current_batch = int(m.group(1))
            current_section = f"batch_{current_batch}"
            continue

        if re.match(r"^## (SKIP LIST|SKIP)", line):
            current_section = "skip_list"; current_batch = None; continue

        if re.match(r"^## Upstream PR Status", line):
            current_section = "upstream_prs"; current_batch = None; continue

        if line.startswith("## "):
            current_section = "other"; continue

        cells = parse_table_cells(line)
        if cells is None or is_header_row(cells):
            continue

        if current_section == "skip_list":
            ref   = clean_ref(cells[0])
            title = cells[1].strip() if len(cells) > 1 else ""
            reason = cells[2].strip() if len(cells) > 2 else ""
            if ref and title:
                exists = conn.execute("SELECT id FROM issues WHERE ref=?", (ref,)).fetchone()
                if not exists:
                    conn.execute(
                        """INSERT OR IGNORE INTO issues
                           (ref, title, batch, category, status, notes, sort_order, added_at, updated_at)
                           VALUES (?,?,?,?,?,?,?,?,?)""",
                        (ref, title, 99, "skip_list", "skipped", reason, 0, ts, ts)
                    )
                    skip_inserted += 1

        elif current_section == "upstream_prs":
            # | PR # | Title | State | Notes |
            pr_raw = cells[0].strip("# `PR ")
            title  = cells[1].strip() if len(cells) > 1 else ""
            state  = cells[2].strip() if len(cells) > 2 else "Open"
            notes  = cells[3].strip() if len(cells) > 3 else ""
            pr_m   = re.search(r"(\d+)", pr_raw)
            if pr_m and title:
                pr_num = int(pr_m.group(1))
                conn.execute(
                    "INSERT OR IGNORE INTO upstream_prs "
                    "(pr_number, title, state, notes, added_at, updated_at) VALUES (?,?,?,?,?,?)",
                    (pr_num, title, state, notes, ts, ts)
                )
                prs_inserted += 1

        elif current_section == "batch_7" and current_batch == 7:
            # UP-001..UP-004 unfiled bugs → store as internal batch 8
            ref = cells[0].strip()
            if re.match(r"UP-\d+", ref):
                title      = cells[1].strip() if len(cells) > 1 else ""
                status_raw = cells[3].strip() if len(cells) > 3 else ""
                commit_raw = cells[4].strip() if len(cells) > 4 else ""
                status, sl = normalize_status(status_raw)
                our_commit = extract_commits(commit_raw)
                conn.execute(
                    """INSERT OR IGNORE INTO issues
                       (ref, title, batch, category, status, status_label, our_commit, sort_order, added_at, updated_at)
                       VALUES (?,?,?,?,?,?,?,?,?,?)""",
                    (ref, title, 8, "cherry_unfiled", status, sl, our_commit, 0, ts, ts)
                )

        elif current_section == "batch_8" and current_batch == 8:
            # UP-005..UP-011 tier 2 → store as internal batch 9
            ref = cells[0].strip()
            if re.match(r"UP-\d+", ref):
                title      = cells[1].strip() if len(cells) > 1 else ""
                status_raw = cells[4].strip() if len(cells) > 4 else ""
                notes      = cells[5].strip() if len(cells) > 5 else ""
                status, sl = normalize_status(status_raw)
                conn.execute(
                    """INSERT OR IGNORE INTO issues
                       (ref, title, batch, category, status, status_label, notes, sort_order, added_at, updated_at)
                       VALUES (?,?,?,?,?,?,?,?,?,?)""",
                    (ref, title, 9, "cherry_tier2", status, sl, notes, 0, ts, ts)
                )

    conn.commit()
    return desc_updated, skip_inserted, prs_inserted

# ──────────────────────────────────────────────────────────────────────────────
# Import: Tasks
# ──────────────────────────────────────────────────────────────────────────────

def import_tasks(conn):
    ts = now_utc()
    inserted = 0
    sort_idx = conn.execute("SELECT COALESCE(MAX(sort_order),0)+1 FROM tasks").fetchone()[0]

    for src_path in [IMPORT_MEMORY_TASKS_MD, IMPORT_CONFIG_TASKS_MD]:
        if not Path(src_path).exists():
            continue
        text = Path(src_path).read_text(encoding="utf-8")
        section = None

        for line in text.splitlines():
            stripped = line.strip()
            if stripped == "## Pending":    section = "pending"; continue
            if stripped == "## Completed":  section = "done";    continue
            if stripped.startswith("## "):  section = None;      continue
            if section is None:             continue

            # Match:  - [x] **Title** — notes
            m = re.match(r"^-\s+\[([x~\s])\]\s+(?:\*\*(.+?)\*\*|(.+?))(?:\s+[—–-]\s+(.*))?$", stripped)
            if not m:
                continue

            check  = m.group(1)
            title  = (m.group(2) or m.group(3) or "").strip()
            notes  = (m.group(4) or "").strip()
            if not title:
                continue

            if check == "x" or section == "done":
                status = "done"
            elif check == "~":
                status = "in_progress"
            else:
                status = "pending"

            commit = extract_commits(notes)
            exists = conn.execute("SELECT id FROM tasks WHERE title=?", (title,)).fetchone()
            if exists is None:
                conn.execute(
                    "INSERT INTO tasks (title, notes, status, our_commit, sort_order, added_at, updated_at) "
                    "VALUES (?,?,?,?,?,?,?)",
                    (title, notes, status, commit, sort_idx, ts, ts)
                )
                inserted += 1
                sort_idx += 1

    conn.commit()
    return inserted

# ──────────────────────────────────────────────────────────────────────────────
# Export: UPSTREAM_STATUS.md
# ──────────────────────────────────────────────────────────────────────────────

def _next_items(conn, n=5):
    rows = conn.execute("""
        SELECT ref, title, batch, priority, relevance FROM issues
        WHERE status='open' AND batch BETWEEN 1 AND 7
        ORDER BY
            CASE priority  WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END,
            CASE relevance WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END,
            batch, sort_order
        LIMIT ?
    """, (n,)).fetchall()
    return [dict(r) for r in rows]


def export_upstream_status(conn, output_path=None):
    out   = Path(output_path) if output_path else UPSTREAM_STATUS_MD
    today = datetime.now().strftime("%Y-%m-%d")
    L     = []

    L += [
        "<!-- Generated by ep_brain.py — edit via CLI, not directly -->",
        "# Upstream Issues Status",
        "",
        "Quick-reference tracking for upstream en-croissant issues and cherry-picks.",
        f"Last updated: {today}",
        "",
        "---",
        "",
    ]

    for batch in range(1, 8):
        rows = conn.execute(
            "SELECT * FROM issues WHERE batch=? AND category NOT IN ('skip_list')"
            " ORDER BY sort_order, id",
            (batch,)
        ).fetchall()
        if not rows:
            continue

        done  = sum(1 for r in rows if r["status"] == "done")
        total = len(rows)
        name  = BATCH_NAMES.get(batch, f"BATCH {batch}")

        if   done == total: suffix = f"✅ ALL DONE ({done}/{total})"
        elif done == 0:     suffix = f"⬜ ALL OPEN (0/{total})"
        else:               suffix = f"✅ MOSTLY DONE ({done}/{total})"

        L.append(f"## {name} — {suffix}")
        L.append("")

        def status_str(r):
            if r["status"] == "done":
                lbl = r["status_label"] or "Fixed"
                return f"✅ {lbl}"
            return "⬜ Open"

        if batch in (1, 2):
            L += ["| # | Title | Status | Commit |", "|---|---|---|---|"]
            for r in rows:
                L.append(f"| {r['ref']} | {r['title']} | {status_str(r)} | {r['our_commit']} |")

        elif batch == 3:
            L += ["| # | Title | Status | Notes |", "|---|---|---|---|"]
            for r in rows:
                note = r["notes"] or r["our_commit"] or ""
                L.append(f"| {r['ref']} | {r['title']} | {status_str(r)} | {note} |")

        elif batch in (4, 5, 6):
            L += ["| # | Title | Relevance | Status |", "|---|---|---|---|"]
            for r in rows:
                ss = status_str(r)
                rel = r["relevance"] or ""
                if r["notes"] and r["status"] == "done":
                    L.append(f"| {r['ref']} | {r['title']} | {rel} | {ss} | {r['notes']} |")
                else:
                    L.append(f"| {r['ref']} | {r['title']} | {rel} | {ss} |")

        elif batch == 7:
            subcats = [
                ("bugfix",  "Bug Fixes"),
                ("feature", "Features"),
                ("uiux",    "UI/UX Improvements"),
                ("infra",   "Infrastructure"),
            ]
            first_sub = True
            for key, label in subcats:
                sub_rows = [r for r in rows if r["subcategory"] == key]
                if not sub_rows:
                    continue
                if not first_sub:
                    L.append("")
                first_sub = False
                L += [f"### {label}", "", "| Upstream | Title | Priority | Status |", "|---|---|---|---|"]
                for r in sub_rows:
                    ss  = status_str(r)
                    pri = r["priority"] or ""
                    if r["status"] == "done" and r["our_commit"]:
                        L.append(f"| {r['ref']} | {r['title']} | {pri} | {ss} | {r['our_commit']} |")
                    else:
                        L.append(f"| {r['ref']} | {r['title']} | {pri} | {ss} |")

        L += ["", "---", ""]

    # Summary table
    L += ["## Summary", "", "| Batch | Total | Done | Open |", "|---|---|---|---|"]
    total_all = done_all = 0
    for batch in range(1, 8):
        rows = conn.execute(
            "SELECT status FROM issues WHERE batch=? AND category NOT IN ('skip_list')",
            (batch,)
        ).fetchall()
        if not rows: continue
        total = len(rows); done = sum(1 for r in rows if r["status"] == "done")
        open_ = total - done
        total_all += total; done_all += done
        name = BATCH_NAMES.get(batch, f"Batch {batch}")
        d_str = f"**{done}** ✅" if done > 0 else "0"
        o_str = f"**{open_}**"   if open_ > 0 else "0"
        L.append(f"| {name} | {total} | {d_str} | {o_str} |")

    open_all = total_all - done_all
    L.append(f"| **TOTAL** | **{total_all}** | **{done_all}** | **{open_all}** |")
    L += ["", f"**{done_all} issues resolved. {open_all} remaining.**", ""]

    # Next targets
    nxt = _next_items(conn, 4)
    if nxt:
        L.append("Next highest-impact targets:")
        for i, item in enumerate(nxt, 1):
            L.append(f"{i}. **{item['ref']}** — {item['title']}")
        L.append("")

    L += ["---", ""]

    # Wishlist
    wl = conn.execute(
        "SELECT * FROM issues WHERE batch=99 AND category='wishlist' ORDER BY sort_order, id"
    ).fetchall()
    if wl:
        L += ["## WISHLIST — en-parlant Original Ideas", "", "| ID | Title | Notes |", "|---|---|---|"]
        for r in wl:
            L.append(f"| {r['ref']} | {r['title']} | {r['notes']} |")
        L.append("")

    out.write_text("\n".join(L) + "\n", encoding="utf-8")
    conn.execute("UPDATE meta SET value=? WHERE key='last_export'", (now_utc(),))
    conn.commit()
    return str(out)

# ──────────────────────────────────────────────────────────────────────────────
# Export: UPSTREAM_TASKS.md
# ──────────────────────────────────────────────────────────────────────────────

def export_tasks_md(conn, output_path=None):
    out   = Path(output_path) if output_path else UPSTREAM_TASKS_MD
    today = datetime.now().strftime("%Y-%m-%d")
    L     = [
        "<!-- Generated by ep_brain.py — edit via CLI, not directly -->",
        "# En Parlant~ Task List",
        "",
        f"Last updated: {today}",
        "",
    ]

    pending = conn.execute(
        "SELECT * FROM tasks WHERE status IN ('pending','in_progress') ORDER BY sort_order, id"
    ).fetchall()
    done = conn.execute(
        "SELECT * FROM tasks WHERE status='done' ORDER BY sort_order DESC, id DESC"
    ).fetchall()

    L.append("## Pending")
    L.append("")
    if pending:
        for r in pending:
            chk  = "~" if r["status"] == "in_progress" else " "
            note = f" — {r['notes']}" if r["notes"] else ""
            L.append(f"- [{chk}] **{r['title']}**{note}")
    else:
        L.append("_(none)_")
    L.append("")

    L.append("## Completed")
    L.append("")
    if done:
        for r in done:
            note = f" — {r['notes']}" if r["notes"] else ""
            L.append(f"- [x] **{r['title']}**{note}")
    else:
        L.append("_(none)_")
    L.append("")

    out.write_text("\n".join(L) + "\n", encoding="utf-8")
    return str(out)

# ──────────────────────────────────────────────────────────────────────────────
# Issue commands
# ──────────────────────────────────────────────────────────────────────────────

def _find_issue(conn, ref, batch=None):
    if batch is not None:
        return conn.execute("SELECT * FROM issues WHERE ref=? AND batch=?", (ref, batch)).fetchall()
    return conn.execute("SELECT * FROM issues WHERE ref=?", (ref,)).fetchall()


def _require_one(conn, ref, batch=None):
    rows = _find_issue(conn, ref, batch)
    if not rows:
        print(f"Error: No issue with ref='{ref}'" + (f" batch={batch}" if batch else ""))
        sys.exit(1)
    if len(rows) > 1:
        batches = ", ".join(str(r["batch"]) for r in rows)
        print(f"Error: Ambiguous ref '{ref}' found in batches {batches}. Add --batch N.")
        sys.exit(1)
    return rows[0]


def cmd_issues_list(conn, args):
    q = "SELECT * FROM issues WHERE 1=1"
    p = []
    if getattr(args, "done",    False): q += " AND status='done'"
    elif getattr(args, "skipped",False): q += " AND status='skipped'"
    elif getattr(args, "all",   False):  pass
    else:                                q += " AND status='open'"   # default

    if getattr(args, "batch",    None): q += " AND batch=?";    p.append(args.batch)
    if getattr(args, "priority", None): q += " AND priority=?"; p.append(args.priority.capitalize())
    if getattr(args, "relevance",None): q += " AND relevance=?";p.append(args.relevance.capitalize())
    if getattr(args, "ref",      None): q += " AND ref LIKE ?"; p.append(f"%{args.ref}%")

    q += " ORDER BY batch, sort_order, id"
    rows = conn.execute(q, p).fetchall()

    if not rows:
        print("No issues found."); return

    if getattr(args, "json", False):
        print(json.dumps([dict(r) for r in rows], indent=2)); return

    cur_batch = None
    for r in rows:
        if r["batch"] != cur_batch:
            cur_batch = r["batch"]
            print(f"\n  {BATCH_NAMES.get(cur_batch, f'Batch {cur_batch}')}")
        icon   = "✅" if r["status"] == "done" else ("⏭" if r["status"] == "skipped" else "⬜")
        pri    = r["priority"] or r["relevance"] or ""
        commit = f"  {r['our_commit'][:8]}" if r["our_commit"] else ""
        print(f"    {icon}  {r['ref']:<22}  {pri:<8}  {r['title']}{commit}")
    print()


def cmd_issues_show(conn, args):
    r = _require_one(conn, args.ref, getattr(args, "batch", None))
    print(f"\nref:      {r['ref']}")
    print(f"title:    {r['title']}")
    print(f"batch:    {r['batch']} — {BATCH_NAMES.get(r['batch'], '?')}")
    print(f"status:   {r['status']}" + (f" ({r['status_label']})" if r["status_label"] else ""))
    print(f"commit:   {r['our_commit'] or '—'}")
    pri = r["priority"] or r["relevance"]
    if pri: print(f"priority: {pri}")
    if r["notes"]:       print(f"notes:    {r['notes']}")
    if r["description"]: print(f"\n{r['description']}")
    print(f"\nadded:   {r['added_at']}")
    print(f"updated: {r['updated_at']}")

    log = conn.execute(
        "SELECT * FROM audit_log WHERE table_name='issues' AND row_id=? ORDER BY changed_at",
        (r["id"],)
    ).fetchall()
    if log:
        print("\nAudit history:")
        for e in log:
            chash = f"  [{e['commit_hash']}]" if e["commit_hash"] else ""
            print(f"  {e['changed_at']}  {e['field']}: {e['old_value']!r} → {e['new_value']!r}{chash}")
    print()


def cmd_issues_done(conn, args):
    r      = _require_one(conn, args.ref, getattr(args, "batch", None))
    commit = getattr(args, "commit", None) or git_head()
    ts     = now_utc()
    conn.execute(
        "UPDATE issues SET status='done', status_label='Fixed', our_commit=?, updated_at=? WHERE id=?",
        (commit, ts, r["id"])
    )
    if getattr(args, "notes", None):
        conn.execute("UPDATE issues SET notes=? WHERE id=?", (args.notes, r["id"]))
    audit(conn, "issues", r["id"], "status",     r["status"],     "done",   commit)
    audit(conn, "issues", r["id"], "our_commit", r["our_commit"],  commit,   commit)
    conn.commit()
    print(f"✅ {r['ref']}  {r['title']}  →  done  ({commit})")


def cmd_issues_reopen(conn, args):
    r  = _require_one(conn, args.ref, getattr(args, "batch", None))
    ts = now_utc()
    conn.execute("UPDATE issues SET status='open', updated_at=? WHERE id=?", (ts, r["id"]))
    if getattr(args, "notes", None):
        conn.execute("UPDATE issues SET notes=? WHERE id=?", (args.notes, r["id"]))
    audit(conn, "issues", r["id"], "status", r["status"], "open")
    conn.commit()
    print(f"⬜ {r['ref']}  {r['title']}  →  reopened")


def cmd_issues_skip(conn, args):
    r  = _require_one(conn, args.ref, getattr(args, "batch", None))
    ts = now_utc()
    conn.execute("UPDATE issues SET status='skipped', updated_at=? WHERE id=?", (ts, r["id"]))
    if getattr(args, "notes", None):
        conn.execute("UPDATE issues SET notes=? WHERE id=?", (args.notes, r["id"]))
    audit(conn, "issues", r["id"], "status", r["status"], "skipped")
    conn.commit()
    print(f"⏭ {r['ref']}  {r['title']}  →  skipped")


def cmd_issues_note(conn, args):
    r       = _require_one(conn, args.ref, getattr(args, "batch", None))
    old     = r["notes"]
    new     = (old + " | " + args.text) if old else args.text
    ts      = now_utc()
    conn.execute("UPDATE issues SET notes=?, updated_at=? WHERE id=?", (new, ts, r["id"]))
    audit(conn, "issues", r["id"], "notes", old, new)
    conn.commit()
    print(f"Note added to {r['ref']}.")


def cmd_issues_add(conn, args):
    ts       = now_utc()
    category = getattr(args, "category", None) or BATCH_CATEGORIES.get(args.batch, "unknown")
    max_ord  = conn.execute(
        "SELECT COALESCE(MAX(sort_order),0) FROM issues WHERE batch=?", (args.batch,)
    ).fetchone()[0]
    conn.execute(
        """INSERT INTO issues
           (ref, title, batch, category, priority, relevance, notes, sort_order, added_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (args.ref, args.title, args.batch, category,
         getattr(args, "priority", "") or "",
         getattr(args, "relevance", "") or "",
         getattr(args, "notes", "") or "",
         max_ord + 1, ts, ts)
    )
    conn.commit()
    print(f"Added: {args.ref} — {args.title}  (batch {args.batch})")


def cmd_issues_stats(conn, args):
    print(f"\n  {'Batch':<47}  {'Total':>5}  {'Done':>6}  {'Open':>5}")
    print("  " + "─" * 68)
    total_all = done_all = 0
    for batch in range(1, 10):
        rows = conn.execute("SELECT status FROM issues WHERE batch=?", (batch,)).fetchall()
        if not rows: continue
        total = len(rows)
        done  = sum(1 for r in rows if r["status"] == "done")
        open_ = total - done
        total_all += total; done_all += done
        name   = BATCH_NAMES.get(batch, f"Batch {batch}")
        d_str  = f"{done} ✅" if done == total else str(done)
        print(f"  {name:<47}  {total:>5}  {d_str:>6}  {open_:>5}")
    wl = conn.execute("SELECT COUNT(*) FROM issues WHERE batch=99").fetchone()[0]
    if wl:
        print(f"  {'Wishlist':<47}  {wl:>5}  {'—':>6}  {'—':>5}")
    print("  " + "─" * 68)
    open_all = total_all - done_all
    print(f"  {'TOTAL':<47}  {total_all:>5}  {done_all:>6}  {open_all:>5}")
    print(f"\n  {done_all} resolved. {open_all} remaining.\n")


def cmd_issues_next(conn, args):
    n    = getattr(args, "n", 5)
    items = _next_items(conn, n)
    if not items:
        print("No open issues."); return
    print(f"\nNext {len(items)} highest-impact open items:")
    for i, item in enumerate(items, 1):
        pri = item["priority"] or item["relevance"] or ""
        print(f"  {i}. [{pri:<6}] {item['ref']:<22}  {item['title']}")
    print()

# ──────────────────────────────────────────────────────────────────────────────
# Task commands
# ──────────────────────────────────────────────────────────────────────────────

def cmd_tasks_list(conn, args):
    q = "SELECT * FROM tasks WHERE 1=1"
    if getattr(args, "done",    False): q += " AND status='done'"
    elif getattr(args, "all",   False):  pass
    else:                                q += " AND status IN ('pending','in_progress')"
    q += " ORDER BY sort_order, id"
    rows = conn.execute(q).fetchall()
    if not rows:
        print("No tasks."); return
    for r in rows:
        icon = "✅" if r["status"] == "done" else ("→" if r["status"] == "in_progress" else "⬜")
        note = f"  — {r['notes'][:70]}" if r["notes"] else ""
        print(f"  {icon}  [{r['id']:>3}]  {r['title']}{note}")
    print()


def cmd_tasks_show(conn, args):
    r = conn.execute("SELECT * FROM tasks WHERE id=?", (args.id,)).fetchone()
    if not r:
        print(f"No task id={args.id}"); sys.exit(1)
    print(f"\nid:     {r['id']}")
    print(f"title:  {r['title']}")
    print(f"status: {r['status']}")
    if r["our_commit"]: print(f"commit: {r['our_commit']}")
    if r["notes"]:  print(f"notes:  {r['notes']}")
    print(f"added:  {r['added_at']}")
    log = conn.execute(
        "SELECT * FROM audit_log WHERE table_name='tasks' AND row_id=? ORDER BY changed_at",
        (r["id"],)
    ).fetchall()
    if log:
        print("\nAudit:")
        for e in log:
            print(f"  {e['changed_at']}  {e['field']}: {e['old_value']!r} → {e['new_value']!r}")
    print()


def cmd_tasks_done(conn, args):
    r = conn.execute("SELECT * FROM tasks WHERE id=?", (args.id,)).fetchone()
    if not r:
        print(f"No task id={args.id}"); sys.exit(1)
    commit = getattr(args, "commit", None) or git_head()
    ts = now_utc()
    conn.execute("UPDATE tasks SET status='done', our_commit=?, updated_at=? WHERE id=?", (commit, ts, args.id))
    if getattr(args, "notes", None):
        conn.execute("UPDATE tasks SET notes=? WHERE id=?", (args.notes, args.id))
    audit(conn, "tasks", args.id, "status", r["status"], "done", commit)
    conn.commit()
    print(f"✅ Task {args.id}: {r['title']}  →  done")


def cmd_tasks_add(conn, args):
    ts      = now_utc()
    max_ord = conn.execute("SELECT COALESCE(MAX(sort_order),0) FROM tasks").fetchone()[0]
    conn.execute(
        "INSERT INTO tasks (title, notes, status, sort_order, added_at, updated_at) VALUES (?,?,?,?,?,?)",
        (args.title, getattr(args, "notes", "") or "", "pending", max_ord + 1, ts, ts)
    )
    conn.commit()
    new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    print(f"Added task [{new_id}]: {args.title}")


def cmd_tasks_note(conn, args):
    r = conn.execute("SELECT * FROM tasks WHERE id=?", (args.id,)).fetchone()
    if not r:
        print(f"No task id={args.id}"); sys.exit(1)
    old = r["notes"]
    new = (old + " | " + args.text) if old else args.text
    ts  = now_utc()
    conn.execute("UPDATE tasks SET notes=?, updated_at=? WHERE id=?", (new, ts, args.id))
    audit(conn, "tasks", args.id, "notes", old, new)
    conn.commit()
    print(f"Note added to task {args.id}.")

# ──────────────────────────────────────────────────────────────────────────────
# PR commands
# ──────────────────────────────────────────────────────────────────────────────

def cmd_prs_list(conn, args):
    state = getattr(args, "state", "all")
    q     = "SELECT * FROM upstream_prs"
    p     = []
    if state and state.lower() != "all":
        q += " WHERE LOWER(state)=?"; p.append(state.lower())
    q += " ORDER BY pr_number DESC"
    rows = conn.execute(q, p).fetchall()
    if not rows:
        print("No PRs found."); return
    for r in rows:
        sl = r["state"].lower()
        icon = "✅" if sl == "merged" else ("❌" if sl == "closed" else "🔄")
        note = f"  — {r['notes']}" if r["notes"] else ""
        print(f"  {icon}  PR #{r['pr_number']:<6}  [{r['state']:<8}]  {r['title']}{note}")
    print()


def cmd_prs_update(conn, args):
    r = conn.execute("SELECT * FROM upstream_prs WHERE pr_number=?", (args.pr_number,)).fetchone()
    if not r:
        print(f"No PR #{args.pr_number}"); sys.exit(1)
    ts = now_utc()
    old_state = r["state"]
    conn.execute("UPDATE upstream_prs SET state=?, updated_at=? WHERE pr_number=?",
                 (args.state, ts, args.pr_number))
    if getattr(args, "notes", None):
        conn.execute("UPDATE upstream_prs SET notes=? WHERE pr_number=?", (args.notes, args.pr_number))
    audit(conn, "upstream_prs", r["id"], "state", old_state, args.state)
    conn.commit()
    print(f"PR #{args.pr_number}: {old_state} → {args.state}")

# ──────────────────────────────────────────────────────────────────────────────
# Global stats
# ──────────────────────────────────────────────────────────────────────────────

def cmd_stats(conn, args):
    i_total   = conn.execute("SELECT COUNT(*) FROM issues WHERE batch != 99").fetchone()[0]
    i_done    = conn.execute("SELECT COUNT(*) FROM issues WHERE status='done' AND batch != 99").fetchone()[0]
    i_open    = conn.execute("SELECT COUNT(*) FROM issues WHERE status='open' AND batch != 99").fetchone()[0]
    t_total   = conn.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
    t_pending = conn.execute("SELECT COUNT(*) FROM tasks WHERE status='pending'").fetchone()[0]
    t_done    = conn.execute("SELECT COUNT(*) FROM tasks WHERE status='done'").fetchone()[0]
    pr_open   = conn.execute("SELECT COUNT(*) FROM upstream_prs WHERE LOWER(state)='open'").fetchone()[0]
    pr_merged = conn.execute("SELECT COUNT(*) FROM upstream_prs WHERE LOWER(state)='merged'").fetchone()[0]
    print(f"\n  Issues:  {i_done}/{i_total} done  ({i_open} open)")
    print(f"  Tasks:   {t_done}/{t_total} done  ({t_pending} pending)")
    print(f"  PRs:     {pr_merged} merged, {pr_open} open\n")

# ──────────────────────────────────────────────────────────────────────────────
# HTTP serve (optional)
# ──────────────────────────────────────────────────────────────────────────────

def cmd_serve(conn, args):
    port = getattr(args, "port", 8743)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a): pass

        def send_json(self, data, code=200):
            body = json.dumps(data, indent=2).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", len(body))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            parsed = urlparse(self.path)
            qs     = parse_qs(parsed.query)

            if parsed.path == "/api/stats":
                self.send_json({
                    "issues": {
                        "done":  conn.execute("SELECT COUNT(*) FROM issues WHERE status='done'").fetchone()[0],
                        "total": conn.execute("SELECT COUNT(*) FROM issues").fetchone()[0],
                    },
                    "tasks": {
                        "done":  conn.execute("SELECT COUNT(*) FROM tasks WHERE status='done'").fetchone()[0],
                        "total": conn.execute("SELECT COUNT(*) FROM tasks").fetchone()[0],
                    },
                })

            elif parsed.path == "/api/issues":
                status = qs.get("status", ["open"])[0]
                batch  = qs.get("batch",  [None])[0]
                q, p   = "SELECT * FROM issues WHERE 1=1", []
                if status != "all": q += " AND status=?"; p.append(status)
                if batch:           q += " AND batch=?";  p.append(int(batch))
                q += " ORDER BY batch, sort_order"
                self.send_json([dict(r) for r in conn.execute(q, p).fetchall()])

            elif parsed.path == "/api/tasks":
                status = qs.get("status", ["pending"])[0]
                q = "SELECT * FROM tasks" + ("" if status == "all" else f" WHERE status='{status}'")
                self.send_json([dict(r) for r in conn.execute(q + " ORDER BY sort_order").fetchall()])

            else:
                self.send_json({"error": "not found"}, 404)

        def do_POST(self):
            length = int(self.headers.get("Content-Length", 0))
            body   = json.loads(self.rfile.read(length) or b"{}")
            path   = urlparse(self.path).path

            if m := re.match(r"^/api/issues/(.+)/done$", path):
                ref  = m.group(1)
                rows = conn.execute("SELECT * FROM issues WHERE ref=?", (ref,)).fetchall()
                if not rows:         self.send_json({"error": "not found"}, 404); return
                if len(rows) > 1:    self.send_json({"error": "ambiguous", "batches": [r["batch"] for r in rows]}, 400); return
                r      = rows[0]
                commit = body.get("commit", git_head())
                ts     = now_utc()
                conn.execute("UPDATE issues SET status='done', status_label='Fixed', our_commit=?, updated_at=? WHERE id=?", (commit, ts, r["id"]))
                audit(conn, "issues", r["id"], "status", r["status"], "done", commit)
                conn.commit()
                self.send_json({"ok": True, "commit": commit})

            elif m := re.match(r"^/api/tasks/(\d+)/done$", path):
                tid = int(m.group(1))
                r   = conn.execute("SELECT * FROM tasks WHERE id=?", (tid,)).fetchone()
                if not r: self.send_json({"error": "not found"}, 404); return
                commit = body.get("commit", git_head()); ts = now_utc()
                conn.execute("UPDATE tasks SET status='done', our_commit=?, updated_at=? WHERE id=?", (commit, ts, tid))
                audit(conn, "tasks", tid, "status", r["status"], "done", commit)
                conn.commit()
                self.send_json({"ok": True})

            elif path == "/api/export":
                p1 = export_upstream_status(conn)
                p2 = export_tasks_md(conn)
                self.send_json({"ok": True, "files": [p1, p2]})

            else:
                self.send_json({"error": "not found"}, 404)

    print(f"ep_brain serving on http://localhost:{port}  (Ctrl-C to stop)")
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()

# ──────────────────────────────────────────────────────────────────────────────
# Jobs subsystem — durable JSON specs in ep_brain/jobs/
# ──────────────────────────────────────────────────────────────────────────────

JOBS_DIR    = SCRIPT_DIR / "jobs"
SCHEMA_PATH = SCRIPT_DIR / "job_schema.json"

def _next_job_id() -> str:
    """Find the next EP-NNN id by scanning existing files."""
    existing = sorted(JOBS_DIR.glob("EP-*.json"))
    if not existing:
        return "EP-001"
    last = existing[-1].stem  # e.g. "EP-003"
    num = int(last.split("-")[1]) + 1
    return f"EP-{num:03d}"


def _load_schema() -> dict:
    with SCHEMA_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def _load_job(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save_job(path: Path, job: dict):
    with path.open("w", encoding="utf-8") as f:
        json.dump(job, f, indent=2, ensure_ascii=False)
        f.write("\n")


def _validate_job(job: dict, schema: dict) -> list[str]:
    """Return list of error strings. Empty = valid."""
    try:
        from jsonschema import Draft202012Validator
    except ImportError:
        return ["jsonschema not installed — run: pip install jsonschema"]
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(job), key=lambda e: list(e.path))
    return [f"[{'.'.join(str(p) for p in e.path) or '<root>'}] {e.message}" for e in errors]


def cmd_jobs_new(conn, args):
    """Scaffold a new job spec from a template or from a GitHub PR."""
    JOBS_DIR.mkdir(exist_ok=True)
    job_id = _next_job_id()
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
            "performance": {
                "no_regression": True,
            },
            "compatibility": {
                "backward_compatible": True,
                "migration_needed": False,
            },
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
        "done_criteria": [
            "TODO: define when this job is complete",
        ],
    }

    path = JOBS_DIR / f"{job_id}.json"
    _save_job(path, job)
    print(f"Created {path.name}  [{job_type}]  {args.title}")
    print(f"  Edit: {path}")


def cmd_jobs_from_pr(conn, args):
    """Create a job spec from an upstream GitHub PR."""
    JOBS_DIR.mkdir(exist_ok=True)
    pr_num = args.pr_number

    # Fetch PR info from GitHub
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

    job_id = _next_job_id()
    files = [f["path"] for f in pr.get("files", [])]
    labels = [l["name"] for l in pr.get("labels", [])]
    is_bug = any("bug" in l for l in labels)

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
            "compatibility": {
                "backward_compatible": True,
                "migration_needed": False,
            },
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

    path = JOBS_DIR / f"{job_id}.json"
    _save_job(path, job)
    print(f"Created {path.name}  [cherry_pick]  {job['title']}")
    print(f"  Source: PR #{pr_num} — {pr['title']}")
    print(f"  Files:  {len(files)} upstream files")
    print(f"  Edit:   {path}")


def cmd_jobs_list(conn, args):
    """List all job specs with status."""
    JOBS_DIR.mkdir(exist_ok=True)
    paths = sorted(JOBS_DIR.glob("EP-*.json"))
    if not paths:
        print("No job specs found. Create one with: ep_brain jobs new --title '...'")
        return

    state_filter = args.state if hasattr(args, "state") and args.state else None

    for path in paths:
        try:
            job = _load_job(path)
        except Exception as e:
            print(f"  ERROR  {path.name}  {e}")
            continue
        state = job.get("state", "?")
        if state_filter and state != state_filter:
            continue
        icon = {"spec": "📋", "planning": "🔍", "in_progress": "🔨",
                "testing": "🧪", "review": "👀", "done": "✅",
                "blocked": "🚫", "discarded": "🗑️"}.get(state, "❓")
        prio = job.get("priority", "?")
        jtype = job.get("type", "?")
        print(f"  {icon}  {job['job_id']}  P{prio}  [{jtype:12s}]  [{state:11s}]  {job['title']}")


def cmd_jobs_show(conn, args):
    """Show full details of a job spec."""
    path = JOBS_DIR / f"{args.job_id}.json"
    if not path.exists():
        print(f"Not found: {path}")
        return
    job = _load_job(path)
    print(json.dumps(job, indent=2, ensure_ascii=False))


def cmd_jobs_validate(conn, args):
    """Validate job specs against schema."""
    JOBS_DIR.mkdir(exist_ok=True)
    if args.job_id:
        paths = [JOBS_DIR / f"{args.job_id}.json"]
    else:
        paths = sorted(JOBS_DIR.glob("EP-*.json"))

    if not paths:
        print("No specs to validate.")
        return

    schema = _load_schema()
    ok = fail = 0
    for path in paths:
        if not path.exists():
            print(f"  MISS  {path.name}")
            fail += 1
            continue
        job = _load_job(path)
        errs = _validate_job(job, schema)
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
    path = JOBS_DIR / f"{args.job_id}.json"
    if not path.exists():
        print(f"Not found: {path}")
        return
    job = _load_job(path)
    old = job["state"]
    job["state"] = args.new_state
    _save_job(path, job)
    print(f"  {job['job_id']}  {old} → {args.new_state}  {job['title']}")


def cmd_jobs_log(conn, args):
    """Append an iteration log entry to a job."""
    path = JOBS_DIR / f"{args.job_id}.json"
    if not path.exists():
        print(f"Not found: {path}")
        return
    job = _load_job(path)
    if "iteration_log" not in job:
        job["iteration_log"] = []
    entry = {
        "timestamp": now_utc(),
        "action": args.action,
        "result": args.result,
        "keep_or_discard": args.keep or "keep",
    }
    if args.notes:
        entry["notes"] = args.notes
    job["iteration_log"].append(entry)
    _save_job(path, job)
    print(f"  Logged iteration #{len(job['iteration_log'])} on {job['job_id']}")


def cmd_jobs_run_tests(conn, args):
    """Run the automated test plan for a job."""
    path = JOBS_DIR / f"{args.job_id}.json"
    if not path.exists():
        print(f"Not found: {path}")
        return
    job = _load_job(path)
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
            print(f"    ✅ PASS")
            passed += 1
        else:
            print(f"    ❌ FAIL")
            print(r.stderr[-500:] if r.stderr else r.stdout[-500:])
            failed += 1

    print(f"\n  {passed + failed} tests: {passed} passed, {failed} failed")
    return failed == 0


# ──────────────────────────────────────────────────────────────────────────────
# Main / argparse
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        prog="ep_brain",
        description="En Parlant~ Project Brain — upstream issues, tasks, PRs"
    )
    parser.add_argument("--db", default=str(DB_PATH), metavar="PATH", help="DB path")
    sub = parser.add_subparsers(dest="command", metavar="COMMAND")

    # ── import ────────────────────────────────────────────────────────────────
    p_imp = sub.add_parser("import", help="Seed DB from markdown files")
    p_imp.add_argument(
        "--source",
        choices=["upstream_status", "upstream_issues", "tasks", "all"],
        default="all",
    )

    # ── export ────────────────────────────────────────────────────────────────
    p_exp = sub.add_parser("export", help="Regenerate markdown exports")
    p_exp.add_argument("--target", choices=["status", "tasks", "all"], default="all")
    p_exp.add_argument("--output", metavar="PATH", help="Override output path")

    # ── issues ────────────────────────────────────────────────────────────────
    pi = sub.add_parser("issues", help="Manage upstream issues")
    pi_sub = pi.add_subparsers(dest="issues_cmd", metavar="SUBCOMMAND")

    def _batch_arg(p): p.add_argument("--batch", type=int, metavar="N")

    l = pi_sub.add_parser("list");     _batch_arg(l)
    l.add_argument("--open",    action="store_true")
    l.add_argument("--done",    action="store_true")
    l.add_argument("--skipped", action="store_true")
    l.add_argument("--all",     action="store_true")
    l.add_argument("--priority",  metavar="H/M/L")
    l.add_argument("--relevance", metavar="H/M/L")
    l.add_argument("--ref",       metavar="PATTERN")
    l.add_argument("--json",      action="store_true")

    sh = pi_sub.add_parser("show");  sh.add_argument("ref"); _batch_arg(sh)
    do = pi_sub.add_parser("done");  do.add_argument("ref"); _batch_arg(do)
    do.add_argument("--commit"); do.add_argument("--notes")
    ro = pi_sub.add_parser("reopen"); ro.add_argument("ref"); _batch_arg(ro)
    ro.add_argument("--notes")
    sk = pi_sub.add_parser("skip");  sk.add_argument("ref"); _batch_arg(sk)
    sk.add_argument("--notes")
    no = pi_sub.add_parser("note");  no.add_argument("ref"); no.add_argument("text"); _batch_arg(no)
    ad = pi_sub.add_parser("add")
    ad.add_argument("--ref",       required=True)
    ad.add_argument("--title",     required=True)
    ad.add_argument("--batch",     type=int, required=True)
    ad.add_argument("--category"); ad.add_argument("--priority")
    ad.add_argument("--relevance");ad.add_argument("--notes")
    pi_sub.add_parser("stats")
    nx = pi_sub.add_parser("next");  nx.add_argument("--n", type=int, default=5)

    # ── tasks ─────────────────────────────────────────────────────────────────
    pt = sub.add_parser("tasks", help="Manage project tasks")
    pt_sub = pt.add_subparsers(dest="tasks_cmd", metavar="SUBCOMMAND")

    tl = pt_sub.add_parser("list")
    tl.add_argument("--pending", action="store_true")
    tl.add_argument("--done",    action="store_true")
    tl.add_argument("--all",     action="store_true")
    ts_ = pt_sub.add_parser("show");  ts_.add_argument("id", type=int)
    td  = pt_sub.add_parser("done");  td.add_argument("id", type=int)
    td.add_argument("--commit"); td.add_argument("--notes")
    ta  = pt_sub.add_parser("add");   ta.add_argument("title"); ta.add_argument("--notes")
    tn  = pt_sub.add_parser("note");  tn.add_argument("id", type=int); tn.add_argument("text")

    # ── prs ───────────────────────────────────────────────────────────────────
    pp = sub.add_parser("prs", help="Manage upstream PRs")
    pp_sub = pp.add_subparsers(dest="prs_cmd", metavar="SUBCOMMAND")

    pl = pp_sub.add_parser("list");  pl.add_argument("--state", default="all")
    pu = pp_sub.add_parser("update")
    pu.add_argument("pr_number", type=int); pu.add_argument("--state", required=True)
    pu.add_argument("--notes")

    # ── jobs ───────────────────────────────────────────────────────────────────
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
    jst.add_argument("new_state", choices=["spec", "planning", "in_progress", "testing", "review", "done", "blocked", "discarded"])

    jlog = pj_sub.add_parser("log", help="Append iteration log entry")
    jlog.add_argument("job_id")
    jlog.add_argument("--action", required=True)
    jlog.add_argument("--result", required=True)
    jlog.add_argument("--keep", choices=["keep", "discard", "partial"])
    jlog.add_argument("--notes")

    jrt = pj_sub.add_parser("test", help="Run automated tests from job spec")
    jrt.add_argument("job_id")

    # ── stats / serve ─────────────────────────────────────────────────────────
    sub.add_parser("stats", help="Summary across all tables")
    sv = sub.add_parser("serve", help="Start HTTP API (optional)")
    sv.add_argument("--port", type=int, default=8743)

    args = parser.parse_args()
    conn = get_db(args.db)
    init_db(conn)

    if args.command == "import":
        src = args.source
        if src in ("upstream_status", "all"):
            ins, skp = import_upstream_status(conn)
            print(f"  upstream_status: {ins} inserted, {skp} already present")
        if src in ("upstream_issues", "all"):
            d, s, p = import_upstream_issues(conn)
            print(f"  upstream_issues: {d} descriptions updated, {s} skip-list added, {p} PRs added")
        if src in ("tasks", "all"):
            t = import_tasks(conn)
            print(f"  tasks: {t} inserted")

    elif args.command == "export":
        tgt = args.target
        if tgt in ("status", "all"):
            out = export_upstream_status(conn, args.output if tgt == "status" else None)
            print(f"  → {out}")
        if tgt in ("tasks", "all"):
            out = export_tasks_md(conn, args.output if tgt == "tasks" else None)
            print(f"  → {out}")

    elif args.command == "issues":
        dispatch = {
            "list":   cmd_issues_list,
            "show":   cmd_issues_show,
            "done":   cmd_issues_done,
            "reopen": cmd_issues_reopen,
            "skip":   cmd_issues_skip,
            "note":   cmd_issues_note,
            "add":    cmd_issues_add,
            "stats":  cmd_issues_stats,
            "next":   cmd_issues_next,
        }
        fn = dispatch.get(args.issues_cmd)
        if fn: fn(conn, args)
        else:  pi.print_help()

    elif args.command == "tasks":
        dispatch = {
            "list":  cmd_tasks_list,
            "show":  cmd_tasks_show,
            "done":  cmd_tasks_done,
            "add":   cmd_tasks_add,
            "note":  cmd_tasks_note,
        }
        fn = dispatch.get(args.tasks_cmd)
        if fn: fn(conn, args)
        else:  pt.print_help()

    elif args.command == "prs":
        dispatch = {"list": cmd_prs_list, "update": cmd_prs_update}
        fn = dispatch.get(args.prs_cmd)
        if fn: fn(conn, args)
        else:  pp.print_help()

    elif args.command == "jobs":
        dispatch = {
            "new":      cmd_jobs_new,
            "from-pr":  cmd_jobs_from_pr,
            "list":     cmd_jobs_list,
            "show":     cmd_jobs_show,
            "validate": cmd_jobs_validate,
            "state":    cmd_jobs_state,
            "log":      cmd_jobs_log,
            "test":     cmd_jobs_run_tests,
        }
        fn = dispatch.get(args.jobs_cmd)
        if fn: fn(conn, args)
        else:  pj.print_help()

    elif args.command == "stats":
        cmd_stats(conn, args)

    elif args.command == "serve":
        cmd_serve(conn, args)

    else:
        parser.print_help()

    conn.close()


if __name__ == "__main__":
    main()
