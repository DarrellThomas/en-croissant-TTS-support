#!/usr/bin/env bash
# En Parlant~ quality gate — run before every commit/push
# Usage: ./scripts/check.sh [--quick]
#   --quick  skips Rust compilation (frontend + lint only)

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
SKIP=0

run_check() {
    local name="$1"
    shift
    printf "  %-40s" "$name"
    if output=$("$@" 2>&1); then
        echo -e "${GREEN}PASS${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}FAIL${NC}"
        echo "$output" | head -20 | sed 's/^/    /'
        FAIL=$((FAIL + 1))
    fi
}

skip_check() {
    local name="$1"
    printf "  %-40s" "$name"
    echo -e "${YELLOW}SKIP${NC}"
    SKIP=$((SKIP + 1))
}

echo "═══════════════════════════════════════════"
echo "  En Parlant~ Quality Gate"
echo "═══════════════════════════════════════════"
echo ""

# ── Frontend checks ──────────────────────────
echo "Frontend:"
run_check "format (oxfmt)" pnpm format
run_check "lint (biome)" pnpm lint:fix

# ── Rust checks ──────────────────────────────
echo ""
echo "Backend:"
if [[ "${1:-}" == "--quick" ]]; then
    skip_check "cargo test"
    skip_check "cargo clippy"
else
    run_check "cargo test" bash -c "cd src-tauri && cargo test 2>&1"
    if command -v cargo-clippy &>/dev/null; then
        run_check "cargo clippy" bash -c "cd src-tauri && cargo clippy -- -D warnings 2>&1"
    else
        skip_check "cargo clippy (not installed)"
    fi
fi

# ── Job spec validation ──────────────────────
echo ""
echo "Specs:"
if ls ep_brain/jobs/EP-*.json &>/dev/null 2>&1; then
    run_check "job specs valid" python3 ep_brain/validate_job.py
else
    skip_check "job specs (none found)"
fi

# ── Summary ──────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
TOTAL=$((PASS + FAIL + SKIP))
echo -e "  ${GREEN}${PASS} passed${NC}  ${RED}${FAIL} failed${NC}  ${YELLOW}${SKIP} skipped${NC}  (${TOTAL} total)"
echo "═══════════════════════════════════════════"

exit $FAIL
