#!/usr/bin/env bash
# deploy-api.sh — Upload API JSON files to R2 bucket
# Usage: ./scripts/deploy-api.sh [--dry-run]
#
# Uploads api/*.json (excluding upstream-sources.json) to the R2 api/ prefix.
# Run after editing any JSON and committing.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
API_DIR="$REPO_DIR/api"
R2_REMOTE="r2:enparlant"
DRY_RUN=false

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}[OK]${NC}   $1"; }
info() { echo -e "  ${BLUE}[INFO]${NC} $1"; }
skip() { echo -e "  ${YELLOW}[SKIP]${NC} $1"; }
fail() { echo -e "  ${RED}[FAIL]${NC} $1"; }

if [ "${1:-}" = "--dry-run" ]; then
    DRY_RUN=true
fi

if ! command -v rclone &>/dev/null; then
    fail "rclone is required but not installed"
    exit 1
fi

echo -e "\n${BOLD}Deploying API JSON files to R2...${NC}\n"

for json_file in "$API_DIR"/*.json; do
    filename=$(basename "$json_file")

    # Skip upstream-sources.json — it's not served publicly
    if [ "$filename" = "upstream-sources.json" ]; then
        skip "$filename (internal only)"
        continue
    fi

    if $DRY_RUN; then
        skip "[dry-run] $filename -> $R2_REMOTE/api/$filename"
        continue
    fi

    info "Uploading $filename..."
    if rclone copyto "$json_file" "$R2_REMOTE/api/$filename" \
        --header-upload "Content-Type: application/json" \
        --header-upload "Cache-Control: public, max-age=300"; then
        ok "$filename deployed"
    else
        fail "Failed to deploy $filename"
    fi
done

echo -e "\n${GREEN}${BOLD}Done!${NC}"
