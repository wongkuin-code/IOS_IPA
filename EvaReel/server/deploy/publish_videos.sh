#!/bin/bash
# 上传视频 + 清单到香港服务器 (默认 43.129.30.172)，并在服务器端转码为 H.264 + faststart。
#
# 跳板机(ProxyJump)访问: 设置环境变量 BASTION 后运行, 例如:
#   BASTION="zqg405405@hins-m6hupbwh" SERVER="root@10.0.0.5" bash publish_videos.sh 1 out.mp4 1
# 若 BASTION 为空则直连 SERVER。
#
# 用法:
#   上传并转码单集: bash publish_videos.sh <dramaId> <local.mp4> <episode>
#   仅上传不转码:   SKIP_TRANSCODE=1 bash publish_videos.sh <dramaId> <local.mp4> <episode>
#   上传清单:       bash publish_videos.sh --catalog <local_catalog.json>
#
# 转码: 服务器端 ffmpeg 将视频转为 H.264 + AAC + faststart(moov 前置)，
#       以最大化 iOS 兼容与伪流式拖动。服务器若无 ffmpeg 会自动跳过并警告。
set -euo pipefail

SERVER="${SERVER:-root@43.129.30.172}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/evareel-videos}"
BASTION="${BASTION:-}"
SKIP_TRANSCODE="${SKIP_TRANSCODE:-}"

SSH=(ssh)
SCP=(scp)
if [ -n "$BASTION" ]; then
  SSH=(ssh -J "$BASTION")
  SCP=(scp -o "ProxyJump=$BASTION")
fi

[ "$#" -ge 1 ] || { echo "用法见脚本注释"; exit 1; }

if [ "${1:-}" = "--catalog" ]; then
  [ -n "${2:-}" ] || { echo "请提供 catalog.json 路径"; exit 1; }
  "${SCP[@]}" "$2" "$SERVER:$REMOTE_DIR/catalog.json"
  echo "✅ catalog.json 已上传到 $REMOTE_DIR/"
  exit 0
fi

DRAMA_ID="${1:?dramaId}"
LOCAL="${2:?本地 mp4 路径}"
EP="${3:?集数}"
REMOTE_PATH="$REMOTE_DIR/$DRAMA_ID/$EP.mp4"

"${SSH[@]}" "$SERVER" "mkdir -p '$REMOTE_DIR/$DRAMA_ID'"
"${SCP[@]}" "$LOCAL" "$SERVER:$REMOTE_PATH"
echo "✅ 上传 $LOCAL -> $REMOTE_PATH"

if [ -n "$SKIP_TRANSCODE" ]; then
  echo "⏭️  已跳过服务器端转码 (SKIP_TRANSCODE=1)"
  exit 0
fi

echo "🔄 服务器端转码为 H.264 + faststart ..."
"${SSH[@]}" "$SERVER" bash -s "$REMOTE_PATH" <<'REMOTE'
set -e
SRC="$1"
TMP="${SRC%.*}.transcoded.mp4"
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "⚠️  服务器未安装 ffmpeg，跳过转码（原文件保留，可能为 HEVC/无 faststart）"
  exit 0
fi
ffmpeg -y -i "$SRC" -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart "$TMP"
mv -f "$TMP" "$SRC"
echo "✅ 转码完成: $SRC (H.264 + faststart)"
REMOTE
