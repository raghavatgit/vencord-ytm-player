#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  YouTube Music Player for Vencord — Linux/macOS Installer"
echo "=========================================================="

CANDIDATES=(
    "$HOME/Documents/Vencord"
    "$HOME/.config/Vencord"
    "$HOME/Vencord"
    "$(pwd)/Vencord"
)

VENCORD_PATH=""
for path in "${CANDIDATES[@]}"; do
    if [ -f "$path/package.json" ] && [ -d "$path/src" ]; then
        VENCORD_PATH="$path"
        break
    fi
done

if [ -z "$VENCORD_PATH" ]; then
    echo "Could not automatically detect your Vencord directory."
    read -rp "Please enter the full path to your cloned Vencord repository: " VENCORD_PATH
    if [ ! -f "$VENCORD_PATH/package.json" ] || [ ! -d "$VENCORD_PATH/src" ]; then
        echo "Error: Invalid Vencord directory."
        exit 1
    fi
fi

echo "[+] Found Vencord at: $VENCORD_PATH"

USERPLUGINS_DIR="$VENCORD_PATH/src/userplugins"
mkdir -p "$USERPLUGINS_DIR"

TARGET_DIR="$USERPLUGINS_DIR/youtubeMusicPlayer"
REPO_URL="https://github.com/raghavatgit/vencord-ytm-player.git"

if [ -d "$TARGET_DIR/.git" ]; then
    echo "[*] Updating existing plugin..."
    git -C "$TARGET_DIR" pull --rebase
else
    echo "[*] Cloning plugin into $TARGET_DIR..."
    git clone "$REPO_URL" "$TARGET_DIR"
fi

echo "[✓] Plugin installed successfully!"
echo ""
read -rp "Would you like to build Vencord now? (Y/n): " BUILD
if [ "$BUILD" != "n" ] && [ "$BUILD" != "N" ]; then
    echo "[*] Building Vencord with pnpm..."
    cd "$VENCORD_PATH"
    pnpm build
    echo "[✓] Build complete! Restart Discord to see the player."
else
    echo "Remember to run 'pnpm build' inside $VENCORD_PATH and restart Discord."
fi
