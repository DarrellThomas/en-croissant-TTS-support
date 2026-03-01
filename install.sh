#!/bin/bash
# Install en-croissant-TTS locally
# Usage: sudo ./install.sh
#
# Binary goes to /usr/bin/
# Resources (docs, sound) go to /usr/lib/en-croissant-TTS/
# (Tauri resolveResource looks in /usr/lib/<productName>/ on Linux)

set -e

RELEASE_DIR="src-tauri/target/release"
RES_DIR="/usr/lib/en-croissant-TTS"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo ./install.sh"
  exit 1
fi

if [ ! -f "$RELEASE_DIR/en-croissant-TTS" ]; then
  echo "Binary not found. Run 'pnpm tauri build --no-bundle' first."
  exit 1
fi

# Clean previous install
rm -f /usr/bin/en-croissant-TTS
rm -rf "$RES_DIR"
rm -rf /opt/en-croissant-TTS

# Binary
cp "$RELEASE_DIR/en-croissant-TTS" /usr/bin/en-croissant-TTS
chmod 755 /usr/bin/en-croissant-TTS

# Resources (copy from source — --no-bundle doesn't copy resources to release dir)
mkdir -p "$RES_DIR"
cp -r docs/  "$RES_DIR/docs"
cp -r sound/ "$RES_DIR/sound"
cp -r scripts/ "$RES_DIR/scripts"

# Set up KittenTTS venv if it exists in source
if [ -d "scripts/.venv" ]; then
  cp -r scripts/.venv "$RES_DIR/scripts/.venv"
fi

# Desktop entry
cat > /usr/share/applications/en-croissant-TTS.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=En Croissant-TTS
Exec=en-croissant-TTS %f
Comment=Chess Database with TTS
Categories=Game;BoardGame;
Terminal=false
MimeType=application/x-chess-pgn;
EOF

echo "Installed en-croissant-TTS"
echo "  Binary:    /usr/bin/en-croissant-TTS"
echo "  Resources: $RES_DIR/"
echo "  Desktop:   /usr/share/applications/en-croissant-TTS.desktop"
