#!/usr/bin/env bash
# setup-tts.sh — Install dependencies for KittenTTS and/or OpenTTS
# Usage: ./setup-tts.sh [--kittentts | --opentts | --all | --check]
# Idempotent — safe to run multiple times. Does NOT use sudo.

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"

ok()   { echo -e "  ${GREEN}[OK]${NC}   $1"; }
fail() { echo -e "  ${RED}[FAIL]${NC} $1"; }
warn() { echo -e "  ${YELLOW}[WARN]${NC} $1"; }
info() { echo -e "  ${BLUE}[INFO]${NC} $1"; }

# --- Check functions ---

check_python() {
    if command -v python3 &>/dev/null; then
        ok "Python 3: $(python3 --version 2>&1)"
        return 0
    else
        fail "Python 3 not found"
        echo -e "       ${YELLOW}Fix: sudo apt install python3 python3-venv${NC}"
        return 1
    fi
}

check_venv() {
    if [ -d "$VENV_DIR" ] && [ -f "$VENV_DIR/bin/python" ]; then
        ok "Virtual environment: $VENV_DIR"
        return 0
    else
        fail "Virtual environment not found at $VENV_DIR"
        return 1
    fi
}

check_packages() {
    if [ ! -f "$VENV_DIR/bin/python" ]; then
        fail "Cannot check packages — no venv"
        return 1
    fi

    if "$VENV_DIR/bin/python" -c "import kittentts; import flask; import soundfile; import numpy" 2>/dev/null; then
        ok "Python packages: kittentts, flask, soundfile, numpy"
        return 0
    else
        fail "Missing Python packages"
        return 1
    fi
}

check_script() {
    if [ -f "$SCRIPT_DIR/kittentts-server.py" ]; then
        ok "Server script: $SCRIPT_DIR/kittentts-server.py"
        return 0
    else
        fail "Server script not found: $SCRIPT_DIR/kittentts-server.py"
        return 1
    fi
}

check_docker() {
    if command -v docker &>/dev/null; then
        ok "Docker: $(docker --version 2>&1)"
        return 0
    else
        fail "Docker not installed"
        echo -e "       ${YELLOW}Fix: sudo apt install docker.io && sudo usermod -aG docker \$USER${NC}"
        return 1
    fi
}

check_docker_running() {
    if docker info &>/dev/null; then
        ok "Docker daemon is running"
        return 0
    else
        fail "Docker daemon is not running"
        echo -e "       ${YELLOW}Fix: sudo systemctl start docker${NC}"
        return 1
    fi
}

check_opentts_image() {
    local image_id
    image_id=$(docker images -q synesthesiam/opentts:en 2>/dev/null || true)
    if [ -n "$image_id" ]; then
        ok "OpenTTS image: synesthesiam/opentts:en ($image_id)"
        return 0
    else
        fail "OpenTTS image not pulled"
        return 1
    fi
}

# --- Setup functions ---

setup_kittentts() {
    echo -e "\n${BOLD}Setting up KittenTTS...${NC}\n"

    if ! check_python; then
        echo -e "\n${RED}Cannot proceed without Python 3. Install it first.${NC}"
        exit 1
    fi

    # Create venv
    if [ ! -d "$VENV_DIR" ]; then
        info "Creating virtual environment at $VENV_DIR..."
        python3 -m venv "$VENV_DIR"
        ok "Virtual environment created"
    else
        ok "Virtual environment already exists"
    fi

    # Install packages
    info "Installing Python packages..."
    "$VENV_DIR/bin/pip" install --upgrade pip 2>&1 | tail -1
    "$VENV_DIR/bin/pip" install kittentts flask soundfile numpy 2>&1 | tail -1
    ok "Packages installed"

    check_script

    echo -e "\n${GREEN}${BOLD}KittenTTS setup complete!${NC}"
    echo -e "Start the server with: ${BLUE}$VENV_DIR/bin/python $SCRIPT_DIR/kittentts-server.py${NC}"
}

setup_opentts() {
    echo -e "\n${BOLD}Setting up OpenTTS...${NC}\n"

    if ! check_docker; then
        echo -e "\n${RED}Cannot proceed without Docker. Install it first.${NC}"
        exit 1
    fi

    if ! check_docker_running; then
        echo -e "\n${RED}Cannot proceed — Docker daemon is not running.${NC}"
        exit 1
    fi

    # Pull image
    local image_id
    image_id=$(docker images -q synesthesiam/opentts:en 2>/dev/null || true)
    if [ -n "$image_id" ]; then
        ok "OpenTTS image already pulled"
    else
        info "Pulling OpenTTS image (~1.5 GB)..."
        docker pull synesthesiam/opentts:en
        ok "Image pulled"
    fi

    echo -e "\n${GREEN}${BOLD}OpenTTS setup complete!${NC}"
    echo -e "Start with: ${BLUE}docker run -d --name opentts -p 5500:5500 synesthesiam/opentts:en${NC}"
}

run_check() {
    echo -e "\n${BOLD}=== KittenTTS Dependencies ===${NC}\n"
    local kitten_ok=true
    check_python     || kitten_ok=false
    check_venv       || kitten_ok=false
    check_packages   || kitten_ok=false
    check_script     || kitten_ok=false

    echo -e "\n${BOLD}=== OpenTTS Dependencies ===${NC}\n"
    local opentts_ok=true
    check_docker         || opentts_ok=false
    check_docker_running || opentts_ok=false
    check_opentts_image  || opentts_ok=false

    echo ""
    if $kitten_ok; then
        echo -e "${GREEN}${BOLD}KittenTTS: Ready${NC}"
    else
        echo -e "${YELLOW}${BOLD}KittenTTS: Missing dependencies${NC} — run: $0 --kittentts"
    fi

    if $opentts_ok; then
        echo -e "${GREEN}${BOLD}OpenTTS:   Ready${NC}"
    else
        echo -e "${YELLOW}${BOLD}OpenTTS:   Missing dependencies${NC} — run: $0 --opentts"
    fi
    echo ""
}

# --- Main ---

usage() {
    echo "Usage: $0 [--kittentts | --opentts | --all | --check]"
    echo ""
    echo "  --check      Show status of all dependencies"
    echo "  --kittentts  Create venv and install KittenTTS packages"
    echo "  --opentts    Pull the OpenTTS Docker image"
    echo "  --all        Set up both KittenTTS and OpenTTS"
    echo ""
    echo "No sudo required. If Docker/Python is not installed,"
    echo "the script will print instructions and exit."
}

if [ $# -eq 0 ]; then
    usage
    exit 0
fi

case "${1:-}" in
    --check)
        run_check
        ;;
    --kittentts)
        setup_kittentts
        ;;
    --opentts)
        setup_opentts
        ;;
    --all)
        setup_kittentts
        setup_opentts
        ;;
    -h|--help)
        usage
        ;;
    *)
        echo "Unknown option: $1"
        usage
        exit 1
        ;;
esac
