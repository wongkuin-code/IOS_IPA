#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# EvaReel IAP 验证服务器 第二实例部署脚本（与 EvaShort 服务共存）
#
# 服务器: 43.129.30.172 (香港, OpenCloudOS 9, 需 root)
# 现状:   api.haoweimedia.cn 上的 /api/verify-iap → 127.0.0.1:3000 (EvaShort 服务)
# 新增:   /evareel/api/verify-iap → 127.0.0.1:3001 (EvaReel 服务, pm2 名 evareel-verify-v2)
#
# 使用方法: 在服务器上以 root 执行 bash deploy-evareel-v2.sh
# 说明: 本脚本在服务器本地运行(请经跳板机登录后再执行)。
#       本地 → 服务器的视频/清单传输请用 publish_videos.sh, 并设置
#       BASTION 环境变量走 ProxyJump 跳板机。
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

API_DOMAIN="api.haoweimedia.cn"
APP_DIR="/opt/evareel-verify-v2"
PM2_NAME="evareel-verify-v2"
PORT=3001

log() { echo -e "\033[1;36m[deploy]\033[0m $*"; }
die() { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "请用 root 运行: sudo bash deploy-evareel-v2.sh"

# ── 1. 拷贝 EvaReel server 代码 ────────────────────────────────────────────
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # 脚本位于 server/deploy/
[ -f "$SRC_DIR/server.js" ] || die "未找到 server.js,请把 EvaReel 的 server/ 目录连同脚本拷贝到服务器"
[ "$(grep -c 'evareel-iap-verify' "$SRC_DIR/server.js")" -ge 1 ] \
  || die "server.js 不是 EvaReel 版本(health 应返回 evareel-iap-verify),拒绝部署"

mkdir -p "$APP_DIR"
rsync -a --delete --exclude node_modules --exclude store.json "$SRC_DIR"/ "$APP_DIR"/ 2>/dev/null \
  || cp -r "$SRC_DIR"/. "$APP_DIR"/
cd "$APP_DIR"

log "安装 npm 依赖 (--omit=dev)..."
npm install --omit=dev

# ── 2. pm2 常驻 (端口 3001, 与 EvaShort 的 3000 分开) ──────────────────────
npm install -g pm2
export PORT=$PORT
export APP_ENV=SANDBOX
export BUNDLE_ID=com.mytool.booksreader
export ALLOWED_PRODUCT_IDS=vip.unlock.video
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start server.js --name "$PM2_NAME" --update-env
fi
pm2 save

# ── 3. nginx: 给 api.haoweimedia.cn 的 server 块插入 /evareel/api/ 路由 ─────
NGINX_CONF="$(grep -rl "server_name $API_DOMAIN" /etc/nginx/conf.d/ 2>/dev/null | head -n1)"
[ -n "$NGINX_CONF" ] || NGINX_CONF="/etc/nginx/conf.d/evareel.conf"
log "nginx 配置文件: $NGINX_CONF"

if grep -q "evareel-verify-v2" "$NGINX_CONF" 2>/dev/null; then
  log "nginx 已存在 v2 路由,跳过插入"
else
  cp "$NGINX_CONF" "$NGINX_CONF.bak-$(date +%Y%m%d%H%M%S)"
  # 在 location / 之前插入 /evareel/api/verify-iap 路由,注意 proxy_pass 带 URI 会把
  # 前缀 /evareel/api/verify-iap 替换为 /api/verify-iap 转发给 3001 的 EvaReel server
  awk -v port="$PORT" '
    /location \// && !inserted {
      print "    # EvaReel v2 IAP verify (evareel-verify-v2 :" port ")";
      print "    location /evareel/api/verify-iap {";
      print "        proxy_pass http://127.0.0.1:" port "/api/verify-iap;";
      print "        proxy_set_header Host $host;";
      print "        proxy_set_header X-Real-IP $remote_addr;";
      print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;";
      print "        proxy_set_header X-Forwarded-Proto $scheme;";
      print "        proxy_connect_timeout 10s;";
      print "        proxy_read_timeout 30s;";
      print "    }";
      print "    # EvaReel v2 health";
      print "    location /evareel/health {";
      print "        proxy_pass http://127.0.0.1:" port "/health;";
      print "        proxy_set_header Host $host;";
      print "    }";
      inserted = 1;
    }
    { print }
  ' "$NGINX_CONF" > "$NGINX_CONF.tmp" && mv "$NGINX_CONF.tmp" "$NGINX_CONF"
  nginx -t
  systemctl reload nginx
  log "nginx 已插入 v2 路由并重载"
fi

# ── 4. 验证 ────────────────────────────────────────────────────────────────
sleep 1
log "检查本机 3001 ..."
curl -fsS "http://127.0.0.1:$PORT/health" && echo
log "检查公网 https://$API_DOMAIN/evareel/health ..."
curl -fsS "https://$API_DOMAIN/evareel/health" && echo
log "部署成功! EvaReel App 端请指向 https://$API_DOMAIN/evareel/api/verify-iap"