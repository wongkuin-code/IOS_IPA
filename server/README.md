# EvaReel IAP 验证服务器

StoreKit 2 交易 JWS 服务器端验证（Apple 官方 `@apple/app-store-server-library`）。

## 本地运行

```bash
npm install
PORT=3000 node server.js
# 或: npm start
```

## 部署到云服务器（方案 A：域名 + HTTPS）

1. 把本目录（不含 node_modules）传到服务器：
   ```bash
   scp -r server user@SERVER_IP:/opt/evareel-server
   ```
2. 服务器上安装 Node 20+ 与依赖：
   ```bash
   cd /opt/evareel-server && npm install --omit=dev
   ```
3. 配置环境变量（可写进 systemd 或 .env 由进程管理器注入）：
   - `APP_ENV`：沙盒测试阶段用默认 `SANDBOX`；**上架后改 `PRODUCTION` 并填 `APPLE_APP_ID`（App 的 Apple ID，即 ASC App ID：6799368982）**
   - `PORT=3000`（内部端口，不对外暴露）
4. 用 pm2 常驻：
   ```bash
   npm i -g pm2
   pm2 start server.js --name evareel-verify
   pm2 save && pm2 startup
   ```
5. 域名解析：`verify.yourdomain.com` A 记录 → 服务器公网 IP
6. nginx 反代 + 免费证书（certbot）：
   ```nginx
   server {
     listen 80;
     server_name verify.yourdomain.com;
     location /.well-known/acme-challenge/ { root /var/www/certbot; }
     location / { return 301 https://$host$request_uri; }
   }
   server {
     listen 443 ssl;
     server_name verify.yourdomain.com;
     ssl_certificate     /etc/letsencrypt/live/verify.yourdomain.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/verify.yourdomain.com/privkey.pem;
     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   sudo certbot --nginx -d verify.yourdomain.com
   ```

## 验证接口

- `GET /health` — 存活检查
- `POST /api/verify-iap` — 请求体 `{ "jws": "<交易JWS>", "platform": "ios" }`
  - 验签 + 证书链校验（锚定 server/certs 的 Apple 根证书）
  - 校验 `bundleId=com.mytool.booksreader`、`productId=vip.unlock.all`、类型 NonConsumable
  - `transactionId` 防重放（写入 store.json）
  - 返回 `{ ok: true, productId, transactionId, alreadyGranted }`

## 客户端接入

`mytool/src/iap.js` 里把 `VERIFY_API` 换成你的真实域名：
`https://verify.yourdomain.com/api/verify-iap`

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| PORT | 3000 | 监听端口（nginx 反代到它） |
| APP_ENV | SANDBOX | SANDBOX / PRODUCTION |
| APPLE_APP_ID | 空 | PRODUCTION 时必填（ASC App ID：6799368982） |
| BUNDLE_ID | com.mytool.booksreader | App 的 bundle id |
| ALLOWED_PRODUCT_IDS | vip.unlock.all | 允许的商品 ID，逗号分隔 |
| STORE_FILE | ./store.json | 交易记录文件路径 |

## 安全注意

- `store.json` 含已使用交易 ID，需定期备份，不要放入公网目录
- 生产环境务必走 HTTPS（iOS ATS 要求），且 `APP_ENV=PRODUCTION`
- 服务器端无需 App Store Connect API Key（纯 JWS 验签），但如需查退款/吊销，可后续加 In-App Purchase Key 调 App Store Server API
