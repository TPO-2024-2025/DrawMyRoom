#!/bin/bash

# Exit on error
set -e

# 1. Run npm build
echo "🛠️  Building the project..."
npm run build:drawing

# 2. Define paths
SOURCE_FILE="./dist/drawing-card.js"
TARGET_DIR="../homeassistant/code/"

# 3. Wait for file to be created (max 10 seconds)
echo "⏳ Waiting for file to be generated..."
WAIT_TIME=0
MAX_WAIT=10

while [ ! -f "$SOURCE_FILE" ] && [ $WAIT_TIME -lt $MAX_WAIT ]; do
  sleep 1
  WAIT_TIME=$((WAIT_TIME + 1))
done

if [ ! -f "$SOURCE_FILE" ]; then
  echo "❌ Error: '$SOURCE_FILE' was not generated after $MAX_WAIT seconds!"
  exit 1
fi

# 4. Copy file
echo "📦 Copying file to Home Assistant directory..."
cp -v "$SOURCE_FILE" "$TARGET_DIR"

echo "✅ Successfully deployed to $TARGET_DIR!"