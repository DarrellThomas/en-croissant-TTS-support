#!/usr/bin/env bash
# mirror-assets-to-r2.sh — Download upstream assets and upload to R2 bucket
# Usage: ./scripts/mirror-assets-to-r2.sh [--engines|--databases|--puzzles|--docker|--all] [--dry-run]
#
# Requires: curl, jq, rclone (configured with remote "r2" pointing to enparlant.redshed.ai bucket)
# Docker assets additionally require: docker

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCES="$REPO_DIR/api/upstream-sources.json"
MIRROR_DIR="/tmp/enparlant-mirror"
R2_REMOTE="r2:enparlant"
DRY_RUN=false

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}[OK]${NC}   $1"; }
fail() { echo -e "  ${RED}[FAIL]${NC} $1"; }
info() { echo -e "  ${BLUE}[INFO]${NC} $1"; }
skip() { echo -e "  ${YELLOW}[SKIP]${NC} $1"; }

check_deps() {
    local missing=()
    for cmd in curl jq rclone; do
        command -v "$cmd" &>/dev/null || missing+=("$cmd")
    done
    if [ ${#missing[@]} -gt 0 ]; then
        fail "Missing required tools: ${missing[*]}"
        exit 1
    fi
}

download_and_upload() {
    local category="$1"  # engines, databases, puzzles
    local r2_prefix="$2" # R2 path prefix

    echo -e "\n${BOLD}=== Mirroring $category ===${NC}\n"

    local keys
    keys=$(jq -r ".$category | keys[]" "$SOURCES")

    for key in $keys; do
        local upstream
        upstream=$(jq -r ".$category[\"$key\"]" "$SOURCES")
        local dest="$MIRROR_DIR/$r2_prefix/$key"
        local dest_dir
        dest_dir=$(dirname "$dest")

        if $DRY_RUN; then
            skip "[dry-run] $upstream -> $R2_REMOTE/$r2_prefix/$key"
            continue
        fi

        mkdir -p "$dest_dir"

        if [ -f "$dest" ]; then
            skip "Already downloaded: $key"
        else
            info "Downloading $key from $upstream..."
            if curl -fSL --progress-bar -o "$dest" "$upstream"; then
                ok "Downloaded $key ($(du -h "$dest" | cut -f1))"
            else
                fail "Failed to download $key"
                continue
            fi
        fi

        info "Uploading $key to $R2_REMOTE/$r2_prefix/$key..."
        if rclone copyto "$dest" "$R2_REMOTE/$r2_prefix/$key" --progress; then
            ok "Uploaded $key"
        else
            fail "Failed to upload $key"
        fi
    done
}

mirror_docker() {
    echo -e "\n${BOLD}=== Mirroring Docker images ===${NC}\n"

    local dest="$MIRROR_DIR/docker/opentts-en.tar.gz"

    if $DRY_RUN; then
        skip "[dry-run] docker pull synesthesiam/opentts:en -> $R2_REMOTE/docker/opentts-en.tar.gz"
        return
    fi

    if ! command -v docker &>/dev/null; then
        fail "Docker is required for --docker flag"
        return 1
    fi

    mkdir -p "$MIRROR_DIR/docker"

    if [ -f "$dest" ]; then
        skip "Already saved: opentts-en.tar.gz"
    else
        info "Pulling synesthesiam/opentts:en..."
        docker pull synesthesiam/opentts:en

        info "Saving Docker image to tarball..."
        docker save synesthesiam/opentts:en | gzip > "$dest"
        ok "Saved opentts-en.tar.gz ($(du -h "$dest" | cut -f1))"
    fi

    info "Uploading opentts-en.tar.gz to R2..."
    if rclone copyto "$dest" "$R2_REMOTE/docker/opentts-en.tar.gz" --progress; then
        ok "Uploaded opentts-en.tar.gz"
    else
        fail "Failed to upload opentts-en.tar.gz"
    fi
}

usage() {
    echo "Usage: $0 [--engines|--databases|--puzzles|--docker|--all] [--dry-run]"
    echo ""
    echo "  --engines    Mirror chess engine binaries"
    echo "  --databases  Mirror game databases"
    echo "  --puzzles    Mirror puzzle databases"
    echo "  --docker     Mirror Docker images (requires docker)"
    echo "  --all        Mirror everything"
    echo "  --dry-run    Show what would be done without downloading/uploading"
    echo ""
    echo "Requires: curl, jq, rclone (configured with 'r2' remote)"
    echo "Mirror dir: $MIRROR_DIR"
}

# --- Main ---

if [ $# -eq 0 ]; then
    usage
    exit 0
fi

DO_ENGINES=false
DO_DATABASES=false
DO_PUZZLES=false
DO_DOCKER=false

for arg in "$@"; do
    case "$arg" in
        --engines)   DO_ENGINES=true ;;
        --databases) DO_DATABASES=true ;;
        --puzzles)   DO_PUZZLES=true ;;
        --docker)    DO_DOCKER=true ;;
        --all)       DO_ENGINES=true; DO_DATABASES=true; DO_PUZZLES=true; DO_DOCKER=true ;;
        --dry-run)   DRY_RUN=true ;;
        -h|--help)   usage; exit 0 ;;
        *)           echo "Unknown option: $arg"; usage; exit 1 ;;
    esac
done

check_deps

if ! [ -f "$SOURCES" ]; then
    fail "upstream-sources.json not found at $SOURCES"
    exit 1
fi

mkdir -p "$MIRROR_DIR"

$DO_ENGINES   && download_and_upload "engines" "engines"
$DO_DATABASES && download_and_upload "databases" "databases"
$DO_PUZZLES   && download_and_upload "puzzles" "puzzles"
$DO_DOCKER    && mirror_docker

echo -e "\n${GREEN}${BOLD}Done!${NC} Mirror dir: $MIRROR_DIR"
