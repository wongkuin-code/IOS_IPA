#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# 在 HK 服务器上把 EvaReel 与 EvaShort 隔离:
#   1) 新建独立系统用户 evareel (无登录 shell, 仅持有文件/运行服务)
#   2) 视频目录 /var/www/evareel-videos 归属 evareel
#   3) EvaReel 应用目录 /opt/evareel-verify-v2 归属 evareel
#   4) (可选) 将 EvaReel verify 服务以 evareel 身份重启 —— 设 RESTART_SVC=1 才执行
#
# 需 root 在服务器上执行 (经跳板机登录后)。EvaShort 保持独立, 互不可见。
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

EVAREEL_USER="${EVAREEL_USER:-evareel}"
VIDEO_DIR="${VIDEO_DIR:-/var/www/evareel-videos}"
APP_DIR="${APP_DIR:-/opt/evareel-verify-v2}"
PM2_NAME="${PM2_NAME:-evareel-verify-v2}"
RESTART_SVC="${RESTART_SVC:-0}"

[ "$(id -u)" -eq 0 ] || { echo "请用 root 运行"; exit 1; }

# 1) 创建专用用户
if id "$EVAREEL_USER" >/dev/null 2>&1; then
  echo "用户 $EVAREEL_USER 已存在, 跳过创建"
else
  useradd -r -s /usr/sbin/nologin -d "$APP_DIR" "$EVAREEL_USER"
  echo "✅ 已创建用户 $EVAREEL_USER"
fi

# 2) 视频目录归属 evareel
mkdir -p "$VIDEO_DIR"
chown -R "$EVAREEL_USER:$EVAREEL_USER" "$VIDEO_DIR"
chmod 755 "$VIDEO_DIR"
echo "✅ $VIDEO_DIR 已归属 $EVAREEL_USER (nginx 以 www-data 读, 755 足矣)"

# 3) 应用目录归属 evareel (与 EvaShort 的 /opt/evareel-server 等分开)
if [ -d "$APP_DIR" ]; then
  chown -R "$EVAREEL_USER:$EVAREEL_USER" "$APP_DIR"
  echo "✅ $APP_DIR 已归属 $EVAREEL_USER"
fi

# 4) (可选) 以 evareel 身份重启服务
# 注意: pm2 7 已移除 --uid/--gid (start 不再直接支持以其他用户运行 app),
# 因此用一个 wrapper 脚本显式透传所需环境变量, 再以 runuser 降权执行 node。
# server.js 默认 PORT=3000(会与 EvaShort :3000 冲突), 必须显式给 3001;
# BUNDLE_ID/APP_ENV/ALLOWED_PRODUCT_IDS 虽都有默认值, 一并写清以防万一。
if [ "$RESTART_SVC" = "1" ]; then
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "⚠️ 未找到 pm2, 跳过服务重启"
  elif ! command -v runuser >/dev/null 2>&1; then
    echo "⚠️ 未找到 runuser, 跳过服务重启"
  else
    # wrapper 放在应用目录之外, 避免重新部署覆盖应用目录时丢失
    WRAPPER="/usr/local/bin/run-evareel-v2.sh"
    cat > "$WRAPPER" <<WRAPEOF
#!/bin/bash
export PORT=3001
export BUNDLE_ID=com.mytool.booksreader
export APP_ENV=SANDBOX
export ALLOWED_PRODUCT_IDS=vip.unlock.video
exec runuser -u $EVAREEL_USER -- /usr/bin/node $APP_DIR/server.js
WRAPEOF
    chmod 755 "$WRAPPER"
    chown "$EVAREEL_USER:$EVAREEL_USER" "$WRAPPER"
    rm -f "$APP_DIR/run-as-evareel.sh"   # 清理旧位置残留
    echo "✅ 已生成 wrapper: $WRAPPER"

    if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
      pm2 delete "$PM2_NAME"
    fi
    pm2 start "$WRAPPER" --name "$PM2_NAME"
    pm2 save
    echo "✅ $PM2_NAME 已以 $EVAREEL_USER 身份重启"
  fi
else
  echo "ℹ️ 未设 RESTART_SVC=1, 跳过服务重启 (目录归属已生效, 服务仍以原用户运行无碍)"
fi

echo "--- EvaReel 隔离完成 ---"
echo "  EvaReel : 用户=$EVAREEL_USER  视频=$VIDEO_DIR  应用=$APP_DIR"
echo "  EvaShort: 保持独立 (各自端口/目录), 与 EvaReel 互不可见"
