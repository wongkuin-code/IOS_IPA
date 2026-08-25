# EvaReel 状态快照

> 工程：`mytool/`（Expo SDK 57 / RN 0.86，App `EvaReel`）
> 目标：过 Apple 审核（重点 2.1 真实播放 + 真实目录、5.2.3 版权、2.3.3/2.3.6 元数据）
> 最后更新：2026-08-25
> 与 `EvaShort` 同步审查：本文件镜像 `EvaShort/状态快照.md` 的结构与口径。

---

## 一、已完成 ✅（多数领先 EvaShort）

### 播放链路（合规核心）
- [x] `PlayerScreen` 用 `expo-video` **真播放**（`useVideoPlayer` + `<VideoView>`），无假计时器；premium 拦截、倍速、重播、自动下一集。
- [x] `mytool/package.json` 已加 `expo-video@~57.0.2`；`app.json` plugins 含 `expo-video`。
- [x] `src/data/catalog.js`：拉取/解析服务器 `catalog.json`，按 (dramaId, episode) 解析视频 URL，AsyncStorage 缓存。

### 后端视频分发（早于 EvaShort 已上线）
- [x] 生产服务器 `43.129.30.172`（OpenCloudOS 9，HK）nginx 已配：
  - `/evareel/videos/` → `alias /var/www/evareel-videos/`（mp4 伪流式、`Accept-Ranges`、`Cache-Control` 长缓存）
  - `/evareel/catalog.json` → 静态 catalog
  - `/evareel/api/verify-iap`、`/evareel/health` → 代理 `127.0.0.1:3001`
- [x] pm2 进程 `evareel-verify-v2` 跑 `server.js`（端口 3001，用户 `evareel` 隔离）；EvaShort 在 `:3000`。
- [x] IAP 验签端点 `/api/verify-iap` 已实现（`server.js`），客户端 `iap.js` 指向 `…/evareel/api/verify-iap`、`VIP_PRODUCT_ID='vip.unlock.video'`，两端一致。

### 隐私与密钥（领先 EvaShort）
- [x] `mytool/privacy-policy.html` 已存在（EvaShort 尚缺）。
- [x] `keys/`（`*.p8`、AscKey）已被 `.gitignore` 忽略且**未入库**（无密钥泄漏历史风险），优于 EvaShort。

---

## 二、待完成 ⏳（按优先级，与 EvaShort 口径对齐）

### P0 — 过审生死线
- [ ] **生产内容是测试占位剧**（❗最严重）：截至 2026-08-24 部署快照，生产 `catalog.json` 仅为 `测试短剧 1`（1 集 `/1/1.mp4` 测试片）。必须发布**真实授权短剧目录 + 真视频文件**到 `/var/www/evareel-videos/`，否则 2.1 完整性与 5.2.3 双双不达标。
- [ ] **朋友短剧书面授权书**（5.2.3 红线）：`legal/` 目录**缺失**。内容与 EvaShort 同为「火华短剧」，可共用一份授权（须在授权书明确覆盖 EvaReel App）。原件待放入 `EvaReel/legal/`，⚠️ 人工核验条款（展示/转码/收费、全球、运营期、肖像与配乐权）。
- [ ] **bundleId 错误**（❗）：`app.json` 与服务器 wrapper 均为 `com.mytool.booksreader`（小说阅读器残留）。须改为正式 EvaReel bundleId（如 `com.mycompany.EvaReel`），并同步 `run-evareel-v2.sh` 的 `BUNDLE_ID`，否则 IAP 验签 bundleId 不匹配 + ASC 应用 ID 对不上。

### P1 — 审核材料（同 EvaShort 四条拒因）
- [ ] **IAP 送审**（对应 2.1(b)）：ASC 提交商品 `vip.unlock.video`（非消耗型），上传 IAP 审核截图，重新提交构建（版本 +1）。
- [ ] **年龄分级改 None**（对应 2.3.6）：ASC 年龄分级中家长控制/年龄保证/不受限网页/UGC/社交/聊天/广告 全部选「否」。
- [ ] **重截真实截图**（对应 2.3.3）：现有 `assets/screenshots/` 若为旧图须替换；**必须含 13 英寸 iPad**；用首页信息流 + 播放器真播帧。
- [ ] **附授权证据 + Notes**（对应 5.2.3）：ASC → App 审核信息 → 备注/附件 上传 `legal/` 授权书；Notes 说明内容系朋友原创授权、由自有后端分发，非第三方抓取。

### P2 — 隐私与账号
- [ ] App 内「Privacy Policy」加跳转链接指向 `privacy-policy.html` 的 https 地址；ASC「App 隐私」营养标签如实填报（账户/购买/观看历史）。
- [ ] IAP `vip.unlock.video` 沙盒买/恢复跑通（server `ALLOWED_PRODUCT_IDS` 已含该值）。

### P3 — 内容与运维
- [ ] 内容扩到 3–5 部（仍须授权），降低「仅 1 部/占位」风险。
- [ ] 视频编码：当前测试片为 HEVC，正式资源建议 H.264 以最大化 iOS 兼容（用 `scripts/prep_video.sh` 做 faststart）。
- [ ] 服务器安全收尾：关闭 SSH 密码登录、改 root 密码（公钥已就位）、避免 `deploy-evareel-v2.sh` 以 root 直拉 pm2（复用 `run-evareel-v2.sh` wrapper）。
- [ ] 检查 git 历史是否曾提交过 `keys/`（当前未跟踪，但历史需确认）；如有则 `git filter-repo` 清理。

---

## 三、与 EvaShort 的架构差异（注意）
- EvaReel 视频由 **nginx 静态分发 + `catalog.json`**，而非 `server.js` 的 `/api/videos` 接口（EvaShort 用接口）。两者都能真播，但 EvaReel 的「目录」是静态 `catalog.json`，需在服务器侧发布/更新，不像 EvaShort 有 `/api/videos` 动态接口。
- 两 App 共用域名 `api.haoweimedia.cn` 与同一台服务器，靠路径前缀 `/evareel/`（EvaReel）与 `/`（EvaShort）隔离。

---

## 四、当前已知风险
1. **生产 catalog 为占位测试剧** → 2.1 完整性 + 5.2.3 双拒因，最高优先级。
2. **bundleId 为旧小说阅读器 ID** → IAP 验签与 ASC 应用不匹配，必须改。
3. 无 `legal/` 授权书 → 5.2.3 拒因。
4. 隐私政策虽有 html，但 App 内跳转链接与 ASC 营养标签待补。
5. CDN 未配置（直连源站，可选优化，非拒因）。
