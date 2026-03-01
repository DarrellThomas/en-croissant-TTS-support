#!/bin/bash
# Install en-parlant locally
# Usage: sudo ./install.sh
#
# Binary goes to /usr/bin/
# Resources (docs, sound) go to /usr/lib/en-parlant/
# (Tauri resolveResource looks in /usr/lib/<productName>/ on Linux)

set -e

RELEASE_DIR="src-tauri/target/release"
RES_DIR="/usr/lib/en-parlant"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo ./install.sh"
  exit 1
fi

if [ ! -f "$RELEASE_DIR/en-parlant" ]; then
  echo "Binary not found. Run 'pnpm tauri build --no-bundle' first."
  exit 1
fi

# Clean previous install (both old and new names)
rm -f /usr/bin/en-croissant-TTS
rm -f /usr/bin/en-parlant
rm -rf /usr/lib/en-croissant-TTS
rm -rf "$RES_DIR"
rm -rf /opt/en-croissant-TTS

# Binary
cp "$RELEASE_DIR/en-parlant" /usr/bin/en-parlant
chmod 755 /usr/bin/en-parlant

# Resources (copy from source — --no-bundle doesn't copy resources to release dir)
mkdir -p "$RES_DIR"
cp -r docs/  "$RES_DIR/docs"
cp -r sound/ "$RES_DIR/sound"
cp -r scripts/ "$RES_DIR/scripts"

# Set up KittenTTS venv if it exists in source
if [ -d "scripts/.venv" ]; then
  cp -r scripts/.venv "$RES_DIR/scripts/.venv"
fi

# Icons (install into hicolor theme so desktop environments pick them up)
for size in 32 128 256; do
  dest="/usr/share/icons/hicolor/${size}x${size}/apps"
  mkdir -p "$dest"
  rm -f "$dest/en-croissant.png"
  if [ "$size" = "256" ]; then
    cp "src-tauri/icons/128x128@2x.png" "$dest/en-parlant.png"
  elif [ "$size" = "128" ]; then
    cp "src-tauri/icons/128x128.png" "$dest/en-parlant.png"
  elif [ "$size" = "32" ]; then
    cp "src-tauri/icons/32x32.png" "$dest/en-parlant.png"
  fi
done
# Also install a scalable-size icon
mkdir -p /usr/share/icons/hicolor/512x512/apps
cp "src-tauri/icons/icon.png" /usr/share/icons/hicolor/512x512/apps/en-parlant.png
# Update icon cache
gtk-update-icon-cache /usr/share/icons/hicolor/ 2>/dev/null || true

# Desktop entry (remove old, install new)
rm -f /usr/share/applications/en-croissant-TTS.desktop
cat > /usr/share/applications/en-parlant.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=En Parlant~
Exec=en-parlant %f
Icon=en-parlant
StartupWMClass=en-parlant
Comment=Chess Database with TTS
Categories=Game;BoardGame;
Terminal=false
MimeType=application/x-chess-pgn;
EOF

echo "Installed en-parlant"
echo "  Binary:    /usr/bin/en-parlant"
echo "  Resources: $RES_DIR/"
echo "  Desktop:   /usr/share/applications/en-parlant.desktop"
