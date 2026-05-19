#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="dist"
NAME="bichon-thunderbird-archiver"
VERSION=$(python3 - <<'PY'
import json
print(json.load(open("manifest.json"))["version"])
PY
)

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR/$NAME-$VERSION.zip"

zip -r "$OUT_DIR/$NAME-$VERSION.zip" \
  manifest.json \
  background.js \
  popup.html popup.css popup.js \
  options.html options.css options.js \
  icons \
  README.md LICENSE

echo "Created: $OUT_DIR/$NAME-$VERSION.zip"
