#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# EvaReel IAP 验证服务器 一键部署脚本 (OpenCloudOS 9 / RHEL9 系, 需 root)
#
# 部署目标: 香港服务器 43.129.30.172 (腾讯云香港, 无备案限制, 走标准 443)
# 前置条件(在 DNS 控制台完成):
#   api.haoweimedia.cn        A 记录 → 43.129.30.172
#   www.haoweimedia.cn        A 记录 → 43.129.30.172
#   haoweimedia.cn            A 记录 → 43.129.30.172
#
# 使用方法: 在服务器上以 root 执行  bash deploy-on-server.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

API_DOMAIN="api.haoweimedia.cn"
WWW_DOMAIN="haoweimedia.cn"
APP_DIR="/opt/evareel-server"
PROMO_DIR="/var/www/haoweimedia"
PM2_NAME="evareel-verify"

log()  { echo -e "\033[1;36m[deploy]\033[0m $*"; }
die()  { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "请用 root 运行: sudo bash deploy-on-server.sh"

# ── 1. 安装 Node.js 20 (OpenCloudOS 9 自带 nodejs-20) ─────────────────────
if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q "^v2[0-9]"; then
  log "安装 Node.js 20 (dnf AppStream)..."
  dnf install -y nodejs
fi
node -v && npm -v

# ── 2. 安装 nginx + certbot ────────────────────────────────────────────────
log "安装 nginx / certbot... (OpenCloudOS dnf.conf 默认 exclude nginx,需 setopt 覆盖)"
dnf install -y nginx --setopt=exclude=
dnf install -y certbot python3-certbot-nginx

systemctl enable --now nginx

# ── 3. 部署应用代码(脚本须与 server/ 目录同目录) ──────────────────────────
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # 脚本位于 server/deploy/
[ -f "$SRC_DIR/server.js" ] || die "未找到 server.js,请把 server/ 目录连同脚本拷贝到服务器"
mkdir -p "$APP_DIR"
rsync -a --delete "$SRC_DIR"/ "$APP_DIR"/ 2>/dev/null || cp -r "$SRC_DIR"/. "$APP_DIR"/
cd "$APP_DIR" || die "进入 $APP_DIR 失败"

log "安装 npm 依赖 (--omit=dev)..."
npm install --omit=dev

# ── 4. pm2 常驻 ────────────────────────────────────────────────────────────
npm install -g pm2
# 默认环境变量(PORT=3000 / SANDBOX / bundleId)与代码默认值一致,无需注入。
# 上架后改 PRODUCTION 时: 先 export APP_ENV=PRODUCTION APPLE_APP_ID=6799368982
# 再执行: pm2 restart "$PM2_NAME" --update-env
export PORT=3000
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start server.js --name "$PM2_NAME" --update-env
fi
pm2 save
if command -v systemctl >/dev/null 2>&1; then
  pm2 startup systemd -u root --hp /root | tail -n1 | bash 2>/dev/null || true
fi

# ── 5. 落地页静态站点 ──────────────────────────────────────────────────────
log "部署 promo 落地页到 $PROMO_DIR ..."
mkdir -p "$PROMO_DIR"
PROMO_SRC="$SRC_DIR/../../promo-html"
if [ -d "$PROMO_SRC" ]; then
  cp -r "$PROMO_SRC"/* "$PROMO_DIR"/ 2>/dev/null || true
else
  log "未找到 promo-html 目录,跳过落地页($WWW_DOMAIN 暂时 404)"
fi

# ── 6. nginx 配置 ──────────────────────────────────────────────────────────
log "写入 nginx 配置..."
if [ ! -f /etc/nginx/conf.d/evareel.conf ]; then
  cp "$(dirname "${BASH_SOURCE[0]}")/nginx-evareel.conf" /etc/nginx/conf.d/evareel.conf
fi
rm -f /etc/nginx/conf.d/default.conf
nginx -t && systemctl reload nginx

# ── 7. 防火墙放行 80/443 ──────────────────────────────────────────────────
log "放行防火墙 80/443..."
if command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-service=http --add-service=https 2>/dev/null && firewall-cmd --reload 2>/dev/null || true
fi

# ── 8. 申请 HTTPS 证书 ─────────────────────────────────────────────────────
log "certbot 申请证书 (逐个域名,能解析到本机的先发)..."
DONE_DOMAINS=()
SKIP_DOMAINS=()
for d in "$WWW_DOMAIN" "$API_DOMAIN"; do
  if command -v dig >/dev/null 2>&1; then
    resolves=$(dig +short "$d" | head -n1)
  else
    resolves=$(getent hosts "$d" | awk '{print $1}' | head -n1)
  fi
  if [ -z "$resolves" ]; then
    log "跳过 $d: 未解析($d 不在 DNS 中,请在腾讯云/DNSPod 添加 A 记录)"
    SKIP_DOMAINS+=("$d")
    continue
  fi
  certbot --nginx -d "$d" --non-interactive --agree-tos \
    --register-unsafely-without-email --redirect 2>/dev/null \
    && DONE_DOMAINS+=("$d") \
    || { log "certbot 失败: $d"; SKIP_DOMAINS+=("$d"); }
done
if [ "${#SKIP_DOMAINS[@]}" -gt 0 ]; then
  log "以下域名稍后可补证书: certbot --nginx -d ${SKIP_DOMAINS[*]}"
fi

# ── 9. 验证 ────────────────────────────────────────────────────────────────
sleep 1
log "检查 /health ..."
if curl -fsS "https://$API_DOMAIN/health"; then
  echo
  log "部署成功! "
else
  log "/health 未通,检查: systemctl status nginx; pm2 logs $PM2_NAME; 域名解析"
fi

# ── 10. 校验视频可播(2.1 真播放生死线) ───────────────────────────────────
log "校验 /videos/1.mp4 是否 200 可播 ..."
VCODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$API_DOMAIN/videos/1.mp4")
if [ "$VCODE" = "200" ]; then
  log "OK: /videos/1.mp4 返回 200,审核员可真播"
else
  log "WARN: /videos/1.mp4 返回 $VCODE —— 视频目录未随部署到位!"
  log "排查: ls -l $APP_DIR/videos ; pm2 restart $PM2_NAME --update-env ; 确认 VIDEOS_DIR"
fi
# 封面同理
CCODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$API_DOMAIN/covers/poster-1.jpg")
[ "$CCODE" = "200" ] && log "OK: /covers/poster-1.jpg 返回 200" || log "WARN: /covers/poster-1.jpg 返回 $CCODE"