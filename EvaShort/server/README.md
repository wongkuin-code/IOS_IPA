# EvaShort 服务器（账号 + IAP 验证）

单服务提供两套功能：

1. **用户账号系统**：注册 / 登录 / 游客登录 / 游客升级、个人资料、收藏与观看历史云同步
2. **IAP 验证**：StoreKit 2 交易 JWS 服务器端验证（Apple 官方 `@apple/app-store-server-library`）

## 部署到香港服务器（43.129.30.172 · OpenCloudOS 9 · api.haoweimedia.cn）

> 2026-08-12 已从上海服务器（124.221.168.96，备案受限）迁到香港节点，直接用标准 443，无需 8443 过渡方案。
> 上海机上的旧 8443 方案文档已移入 `server/deploy/archive/`。

本地（Windows）把修复后的代码上传：

```powershell
# 1. 把 server/ 目录(exclude node_modules)完整上传到香港服务器
scp -r server root@43.129.30.172:/opt/evashort-server/
```

服务器上（root）：

```bash
cd /opt/evashort-server
npm install --omit=dev
pm2 restart evashort
```

之后确认（自检 /health）：

```bash
curl https://api.haoweimedia.cn/health
# 期望: {"ok":true,"app":"evashort-api","env":"Sandbox","users":0}
pm2 logs evashort
```

首次全新部署用一键脚本（Node 20 + pm2 常驻 + nginx 反代 + certbot HTTPS + promo 页面托管）：

```bash
bash server/deploy/deploy-on-server.sh
```

域名现状（DNS 均解析到 43.129.30.172）：

- `api.haoweimedia.cn` → 443 (Let's Encrypt) → 反代 `127.0.0.1:3000`（账号 API + IAP 验签）
- `www.haoweimedia.cn` / `haoweimedia.cn` → 80 静态落地页（`/var/www/haoweimedia`）
- 香港服务器无 ICP 备案限制，80/443 入站正常，无需 8443 非标端口

## 本地运行

```bash
npm install
PORT=3000 node server.js
# 或: npm start
```

## 账号接口（均在 /api 下）

鉴权方式：`Authorization: Bearer <token>`

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /auth/register | `{nickname, email, password}` → `{token, user}` |
| POST | /auth/login | `{account, password}`（account=邮箱）→ `{token, user}` |
| POST | /auth/guest | 无参数，创建设备游客账号 → `{token, user}` |
| POST | /auth/upgrade | 游客 token + `{nickname, email, password}`，保留收藏/历史转为正式账号 |
| GET | /auth/me | 当前用户信息（含 saved/history） |
| PUT | /user/profile | `{nickname?, avatar?}` 修改昵称/头像 |
| GET | /user/saved | `{ids: string[]}` |
| PUT | /user/saved | `{ids: string[]}` 全量覆盖收藏 |
| GET | /user/history | `{items: [{id, episode, ts}]}` |
| PUT | /user/history | `{items}` 全量覆盖历史（最多 50 条） |
| POST | /user/watch | `{dramaId, episode}` 观看配额校验：游客每日限量（默认 3 集），超限返回 `{allowed:false, used, limit}`；正式账号永远 `{allowed:true}` |

密码使用 scrypt + 随机盐哈希存储，token 为 32 字节随机串（每账号最多 5 个）。
用户数据存于 `server/users.json`（已在 .gitignore，含真实用户数据需定期备份）。
注册/登录接口做了每 IP 每分钟 20 次的简单限流。

错误统一返回 `{ok:false, error:'CODE', message:'人类可读信息'}`；
未登录返回 401 `UNAUTHORIZED`；邮箱重复 409 `EMAIL_TAKEN`。

## 验证接口

- `GET /health` — 存活检查
- `POST /api/verify-iap` — 请求体 `{ "jws": "<交易JWS>", "platform": "ios" }`
  - 验签 + 证书链校验（锚定 server/certs 的 Apple 根证书）
  - 校验 `bundleId=com.mycompany.EvaShort`、`productId=2.99`、类型 `Type.NON_CONSUMABLE`（Apple 枚举值 = `"Non-Consumable"`，带连字符）
  - `transactionId` 防重放（写入 store.json）
  - 返回 `{ ok: true, productId, transactionId, alreadyGranted }`

## 客户端接入

`mytool/src/api/client.js` 里已指向真实域名：
`https://api.haoweimedia.cn`（账号接口 + IAP 验签共用）

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| PORT | 3000 | 监听端口（nginx 反代到它） |
| APP_ENV | SANDBOX | SANDBOX / PRODUCTION |
| APPLE_APP_ID | 空 | PRODUCTION 时必填（ASC App ID：6802204407） |
| BUNDLE_ID | com.mycompany.EvaShort | App 的 bundle id |
| ALLOWED_PRODUCT_IDS | 2.99 | 允许的商品 ID，逗号分隔 |
| STORE_FILE | ./store.json | IAP 交易记录文件路径 |
| USERS_FILE | ./users.json | 用户数据文件路径 |
| GUEST_DAILY_LIMIT | 3 | 游客每日免费观看集数上限 |

## 安全注意

- `store.json` 与 `users.json` 含真实数据，需定期备份，不要放入公网目录
- 生产环境务必走 HTTPS（iOS ATS 要求），且 `APP_ENV=PRODUCTION`
- 服务器端无需 App Store Connect API Key（纯 JWS 验签），但如需查退款/吊销，可后续加 In-App Purchase Key 调 App Store Server API
