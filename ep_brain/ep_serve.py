"""ep_serve — HTTP API for ep_brain

Exposes issues, tasks, and jobs over REST so remote clients
(e.g. blade Claude) can manage state without direct DB access.

Bind: 0.0.0.0 so LAN clients can reach it.
"""

from __future__ import annotations

import json
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

from ep_jobs import (
    JOBS_DIR, VALID_STATES,
    load_job, save_job, job_path, list_jobs,
)


def cmd_serve(conn, args, *, now_utc, git_head, audit, export_upstream_status, export_tasks_md):
    """Start the HTTP API server.

    Callback functions are injected from ep_brain.py to avoid circular imports.
    """
    port = getattr(args, "port", 8743)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def send_json(self, data, code=200):
            body = json.dumps(data, indent=2).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", len(body))
            self.end_headers()
            self.wfile.write(body)

        # ── GET ───────────────────────────────────────────────
        def do_GET(self):
            parsed = urlparse(self.path)
            qs = parse_qs(parsed.query)

            if parsed.path == "/api/stats":
                self.send_json({
                    "issues": {
                        "done": conn.execute("SELECT COUNT(*) FROM issues WHERE status='done'").fetchone()[0],
                        "total": conn.execute("SELECT COUNT(*) FROM issues").fetchone()[0],
                    },
                    "tasks": {
                        "done": conn.execute("SELECT COUNT(*) FROM tasks WHERE status='done'").fetchone()[0],
                        "total": conn.execute("SELECT COUNT(*) FROM tasks").fetchone()[0],
                    },
                    "jobs": {
                        "total": len(list_jobs()),
                        "done": len(list_jobs("done")),
                        "active": len([j for j in list_jobs() if j["state"] not in ("done", "discarded")]),
                    },
                })

            elif parsed.path == "/api/issues":
                status = qs.get("status", ["open"])[0]
                batch = qs.get("batch", [None])[0]
                q, p = "SELECT * FROM issues WHERE 1=1", []
                if status != "all":
                    q += " AND status=?"
                    p.append(status)
                if batch:
                    q += " AND batch=?"
                    p.append(int(batch))
                q += " ORDER BY batch, sort_order"
                self.send_json([dict(r) for r in conn.execute(q, p).fetchall()])

            elif parsed.path == "/api/tasks":
                status = qs.get("status", ["pending"])[0]
                q = "SELECT * FROM tasks" + ("" if status == "all" else f" WHERE status='{status}'")
                self.send_json([dict(r) for r in conn.execute(q + " ORDER BY sort_order").fetchall()])

            elif parsed.path == "/api/jobs":
                state_filter = qs.get("state", [None])[0]
                self.send_json(list_jobs(state_filter))

            elif m := re.match(r"^/api/jobs/(EP-\d+)$", parsed.path):
                jp = job_path(m.group(1))
                if not jp.exists():
                    self.send_json({"error": "not found"}, 404)
                    return
                self.send_json(load_job(jp))

            else:
                self.send_json({"error": "not found"}, 404)

        # ── POST ──────────────────────────────────────────────
        def do_POST(self):
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
            path = urlparse(self.path).path

            # Issues
            if m := re.match(r"^/api/issues/(.+)/done$", path):
                ref = m.group(1)
                rows = conn.execute("SELECT * FROM issues WHERE ref=?", (ref,)).fetchall()
                if not rows:
                    self.send_json({"error": "not found"}, 404)
                    return
                if len(rows) > 1:
                    self.send_json({"error": "ambiguous", "batches": [r["batch"] for r in rows]}, 400)
                    return
                r = rows[0]
                commit = body.get("commit", git_head())
                ts = now_utc()
                conn.execute(
                    "UPDATE issues SET status='done', status_label='Fixed', our_commit=?, updated_at=? WHERE id=?",
                    (commit, ts, r["id"]))
                audit(conn, "issues", r["id"], "status", r["status"], "done", commit)
                conn.commit()
                self.send_json({"ok": True, "commit": commit})

            # Tasks
            elif m := re.match(r"^/api/tasks/(\d+)/done$", path):
                tid = int(m.group(1))
                r = conn.execute("SELECT * FROM tasks WHERE id=?", (tid,)).fetchone()
                if not r:
                    self.send_json({"error": "not found"}, 404)
                    return
                commit = body.get("commit", git_head())
                ts = now_utc()
                conn.execute(
                    "UPDATE tasks SET status='done', our_commit=?, updated_at=? WHERE id=?",
                    (commit, ts, tid))
                audit(conn, "tasks", tid, "status", r["status"], "done", commit)
                conn.commit()
                self.send_json({"ok": True})

            # Export
            elif path == "/api/export":
                p1 = export_upstream_status(conn)
                p2 = export_tasks_md(conn)
                self.send_json({"ok": True, "files": [p1, p2]})

            # Jobs — state transition
            elif m := re.match(r"^/api/jobs/(EP-\d+)/state$", path):
                job_id = m.group(1)
                jp = job_path(job_id)
                if not jp.exists():
                    self.send_json({"error": "not found"}, 404)
                    return
                new_state = body.get("state")
                if new_state not in VALID_STATES:
                    self.send_json({"error": f"invalid state, must be one of {VALID_STATES}"}, 400)
                    return
                job = load_job(jp)
                old_state = job["state"]
                job["state"] = new_state
                save_job(jp, job)
                self.send_json({"ok": True, "job_id": job_id, "old_state": old_state, "new_state": new_state})

            # Jobs — iteration log
            elif m := re.match(r"^/api/jobs/(EP-\d+)/log$", path):
                job_id = m.group(1)
                jp = job_path(job_id)
                if not jp.exists():
                    self.send_json({"error": "not found"}, 404)
                    return
                job = load_job(jp)
                if "iteration_log" not in job:
                    job["iteration_log"] = []
                entry = {
                    "timestamp": now_utc(),
                    "action": body.get("action", ""),
                    "result": body.get("result", ""),
                    "keep_or_discard": body.get("keep_or_discard", "keep"),
                }
                if body.get("notes"):
                    entry["notes"] = body["notes"]
                if body.get("files_changed"):
                    entry["files_changed"] = body["files_changed"]
                job["iteration_log"].append(entry)
                save_job(jp, job)
                self.send_json({"ok": True, "job_id": job_id, "iteration": len(job["iteration_log"])})

            # Jobs — convenience done (state + issue + log in one call)
            elif m := re.match(r"^/api/jobs/(EP-\d+)/done$", path):
                job_id = m.group(1)
                jp = job_path(job_id)
                if not jp.exists():
                    self.send_json({"error": "not found"}, 404)
                    return
                job = load_job(jp)
                old_state = job["state"]
                job["state"] = "done"
                if "iteration_log" not in job:
                    job["iteration_log"] = []
                job["iteration_log"].append({
                    "timestamp": now_utc(),
                    "action": body.get("action", "Marked done via API"),
                    "result": body.get("result", "Complete"),
                    "keep_or_discard": "keep",
                    "notes": body.get("notes", ""),
                })
                save_job(jp, job)

                # Also mark the ep_brain issue done if there's a source PR
                issue_ref = None
                pr = job.get("source", {}).get("upstream_pr")
                if pr:
                    issue_ref = f"PR #{pr}"
                    commit = body.get("commit", git_head())
                    ts = now_utc()
                    rows = conn.execute("SELECT * FROM issues WHERE ref=?", (issue_ref,)).fetchall()
                    for r in rows:
                        if r["status"] != "done":
                            conn.execute(
                                "UPDATE issues SET status='done', status_label='Fixed', our_commit=?, updated_at=? WHERE id=?",
                                (commit, ts, r["id"]))
                            audit(conn, "issues", r["id"], "status", r["status"], "done", commit)
                    conn.commit()

                self.send_json({
                    "ok": True, "job_id": job_id,
                    "old_state": old_state, "new_state": "done",
                    "issue_closed": issue_ref,
                })

            else:
                self.send_json({"error": "not found"}, 404)

    print(f"ep_brain serving on http://0.0.0.0:{port}  (Ctrl-C to stop)")
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()
