#!/bin/bash
# 预处理 mp4：前置 moov 原子 (faststart)，起播更快、拖动更跟手。
# 用法: bash prep_video.sh input.mp4 [output.mp4]
set -euo pipefail
IN="${1:?用法: prep_video.sh input.mp4 [output.mp4]}"
OUT="${2:-${IN%.*}.faststart.mp4}"
ffmpeg -y -i "$IN" -c copy -movflags +faststart "$OUT"
echo "✅ faststart 完成: $OUT"
