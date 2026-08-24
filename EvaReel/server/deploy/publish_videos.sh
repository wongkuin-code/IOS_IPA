#!/bin/bash
# 上传视频 + 清单到香港服务器 (默认 43.129.30.172)
#
# 跳板机(ProxyJump)访问: 设置环境变量 BASTION 后运行, 例如:
#   BASTION="zqg405405@hins-m6hupbwh" SERVER="root@10.0.0.5" bash publish_videos.sh 1 out.mp4 1
# 若 BASTION 为空则直连 SERVER。
#
# 用法:
#   上传单集:   bash publish_videos.sh <dramaId> <local.mp4> <episode>
#   上传清单:   bash publish_videos.sh --catalog <local_catalog.json>
set -euo pipefail

SERVER="${SERVER:-root@43.129.30.172}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/evareel-videos}"
BASTION="${BASTION:-}"

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
"${SSH[@]}" "$SERVER" "mkdir -p '$REMOTE_DIR/$DRAMA_ID'"
"${SCP[@]}" "$LOCAL" "$SERVER:$REMOTE_DIR/$DRAMA_ID/$EP.mp4"
echo "✅ 上传 $LOCAL -> $REMOTE_DIR/$DRAMA_ID/$EP.mp4"
