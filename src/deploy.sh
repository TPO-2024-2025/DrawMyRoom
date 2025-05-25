#!/usr/bin/env bash
# Script to update Home Assistant external_url and build Vite cards
# Prompts the user for their domain name (e.g., kuscarcek.si)

set -euo pipefail
read -rp "Enter your domain name (e.g. kuscarcek.si): " DOMAIN
HA_CONFIG_DIR="homeassistant/config"
HA_CONFIG_FILE="$HA_CONFIG_DIR/configuration.yaml"
VITE_DIR="vite-builder-cards"
HA_CODE_DIR="homeassistant/code"

if [[ ! -f "$HA_CONFIG_FILE" ]]; then
  echo "Error: Home Assistant configuration file not found at $HA_CONFIG_FILE"
  exit 1
fi

cp "$HA_CONFIG_FILE" "${HA_CONFIG_FILE}.bak"
echo "Backup of configuration.yaml saved as configuration.yaml.bak"

sed -i -E 's|^(\s*external_url:\s*).*$|\1"https://'"$DOMAIN"'"|' "$HA_CONFIG_FILE"
echo "Updated external_url to https://$DOMAIN in $HA_CONFIG_FILE"

if [[ ! -d "$VITE_DIR" ]]; then
  echo "Error: Vite directory not found at $VITE_DIR"
  exit 1
fi

pushd "$VITE_DIR" >/dev/null
npm install
npm run build
popd >/dev/null

echo "Vite cards built successfully"

if [[ ! -d "$HA_CODE_DIR" ]]; then
  mkdir -p "$HA_CODE_DIR"
fi
cp -v "$VITE_DIR/dist/"* "$HA_CODE_DIR/"
echo "Copied dist files to $HA_CODE_DIR"
echo "All tasks completed successfully."
