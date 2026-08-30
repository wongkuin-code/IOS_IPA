#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────────────
# EvaReel content publish pipeline  (run ON the HK server, OpenCloudOS 9)
#
# What it does, per manifest entry:
#   1. Transcode the raw mp4 -> H.264 + AAC + faststart, vertical 720x1280
#   2. Copy to /var/www/evareel-videos/<id>/<id>.mp4  (nginx static path)
#   3. Extract the first frame as poster.jpg
#   4. Regenerate /var/www/evareel-videos/catalog.json (all entries)
#   5. Print the seed() lines you paste into mytool/src/data/mockDramas.js
#
# Prereqs: ffmpeg 7.x (/usr/local/bin/ffmpeg), jq
# Usage:
#   1. Drop raw mp4s into server/_incoming/
#   2. Copy content_manifest.example.json -> server/content_manifest.json
#      and fill in EVERY video (including the existing id 1 "Enjoy Nature")
#   3. sudo -u evareel bash /opt/evareel-verify-v2/deploy/publish_content.sh
#      (or just: bash server/deploy/publish_content.sh)
# ───────────────────────────────────────────────────────────────────────────
set -euo pipefail

FFMPEG=/usr/local/bin/ffmpeg
WWW=/var/www/evareel-videos
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INCOMING_DIR="$SCRIPT_DIR/../_incoming"
MANIFEST="$SCRIPT_DIR/../content_manifest.json"
BASE_URL="https://api.haoweimedia.cn/evareel/videos"

[ -f "$MANIFEST" ] || { echo "ERROR: missing $MANIFEST"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "ERROR: jq is required"; exit 1; }
command -v "$FFMPEG" >/dev/null 2>&1 || { echo "ERROR: ffmpeg not at $FFMPEG"; exit 1; }

mkdir -p "$WWW"
count=$(jq 'length' "$MANIFEST")
echo "==> Publishing $count videos to $WWW"

catalog_dramas=$(jq -n '{}')
snippet=""

for i in $(seq 0 $((count - 1))); do
  id=$(jq -r ".[$i].id" "$MANIFEST")
  file=$(jq -r ".[$i].file" "$MANIFEST")
  title=$(jq -r ".[$i].title" "$MANIFEST")
  subtitle=$(jq -r ".[$i].subtitle // \"\"" "$MANIFEST")
  category=$(jq -r ".[$i].category // [] | join(\",\")" "$MANIFEST")
  premium=$(jq -r ".[$i].premium // false" "$MANIFEST")
  src="$INCOMING_DIR/$file"

  [ -f "$src" ] || { echo "ERROR: missing source $src"; exit 1; }

  dest_dir="$WWW/$id"
  mkdir -p "$dest_dir"
  out="$dest_dir/$id.mp4"

  echo "==> [$id] $title  ($file)"
  "$FFMPEG" -y -i "$src" \
    -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,format=yuv420p" \
    -c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p \
    -preset slow -crf 23 -movflags +faststart \
    -c:a aac -b:a 128k -ar 44100 -ac 2 \
    "$out"
  "$FFMPEG" -y -i "$out" -frames:v 1 -q:v 3 "$dest_dir/poster.jpg"

  catalog_dramas=$(echo "$catalog_dramas" | jq --arg id "$id" --arg url "/$id/$id.mp4" \
    '. + {($id): {title: $title, urls: {"1": $url}}}')

  snippet+="seed($id, '$title', '$subtitle', 1, 8.5, ['${category}'], $premium, true),"
  snippet+=$'\n'
done

cat > "$WWW/catalog.json" <<JSON
{
  "baseUrl": "$BASE_URL",
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "dramas": $catalog_dramas
}
JSON

echo "==> Wrote $WWW/catalog.json"
echo ""
echo "──────────────────────────────────────────────────────────────────────"
echo "Paste these into mytool/src/data/mockDramas.js (replace the dramas array):"
echo "──────────────────────────────────────────────────────────────────────"
printf "%s" "$snippet"
echo "──────────────────────────────────────────────────────────────────────"
echo "Done. No nginx reload needed (static files). Rebuild the app and resubmit."
