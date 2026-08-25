#!/usr/bin/env bash
# 提取 test_video/videos_compressed 下每个视频的首帧为封面图(jpg)，命名：
#   test_video/videos_compressed/1.mp4 -> assets/covers/poster-1.jpg
# 新增真实视频后，重跑本脚本即可批量生成首帧封面（替换下载图）。
set -e
cd "$(dirname "$0")/.."
SRC=../../test_video/videos_compressed
for f in "$SRC"/*.mp4; do
  [ -e "$f" ] || continue
  name=$(basename "$f" .mp4)
  ffmpeg -y -ss 00:00:00 -i "$f" -frames:v 1 -q:v 2 "assets/covers/poster-${name}.jpg"
  echo "首帧: $f -> assets/covers/poster-${name}.jpg"
done
