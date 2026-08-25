# EvaReel 状态快照

> 工程：`mytool/`（Expo SDK 57 / RN 0.86，App `EvaReel`）
> 目标：过 Apple 审核（重点 2.1 真实播放 + 真实目录、5.2.3 版权、2.3.3/2.3.6 元数据）
> 最后更新：2026-08-26
> 与 `EvaShort` 同步审查：本文件镜像 `EvaShort/状态快照.md` 的结构与口径。

---

## 一、核心决策（本轮）

- **过审策略改为最小化合规 App**：只放 1 条真实可播视频（自制/自拍短剧），其余全部「暂未开放」，IAP 购买流程可测。不再追求多部剧。
- **bundleId 维持 `com.mytool.booksreader`**：`server/server.js:84` 硬编码校验 `payload.bundleId !== BUNDLE_ID`，且 ASC App ID `6799368982`（Team `D5VA6Q22PL`）即此 ID；改则需同步服务器 `BUNDLE_ID` 与 ASC，风险大，故保持。
- **slug 维持 `duanju-novel`**：`extra.eas.projectId`（a49f46cd…）在 EAS 注册的 slug 即此值，改 `evareel` 会触发 `slug does not match projectId` 构建失败（已踩坑回退）。slug 只影响 EAS 项目名，不影响包名/显示名。
- **版权来源 = 自拍自制**（非朋友「火华短剧」）：删除 `legal/授权书_火华短剧.md`，改出 `legal/版权声明_EvaReel.md`（自权属声明），已填平台信息（Bundle ID / Team / ASC App ID / 域名 / 播放器），姓名与证件号待用户手填 + 签字 + 转 PDF。

---

## 二、已完成 ✅

### 播放链路（合规核心）
- [x] `PlayerScreen` 用 `expo-video` **真播放**（`useVideoPlayer` + `<VideoView>`），无假计时器；premium 拦截、倍速、重播、自动下一集。
- [x] `mytool/package.json` 已加 `expo-video@~57.0.2`；`app.json` plugins 含 `expo-video`。
- [x] `src/data/catalog.js`：拉取/解析服务器 `catalog.json`，按 (dramaId, episode) 解析视频 URL，AsyncStorage 缓存。

### 后端视频分发（真实内容已上线）
- [x] 生产服务器 `43.129.30.172`（OpenCloudOS 9，HK）nginx 已配：
  - `/evareel/videos/` → `alias /var/www/evareel-videos/`（mp4 伪流式、`Accept-Ranges`、`Cache-Control` 长缓存）
  - `/evareel/catalog.json` → 静态 catalog
  - `/evareel/api/verify-iap`、`/evareel/health` → 代理 `127.0.0.1:3001`
- [x] pm2 进程 `evareel-verify-v2` 跑 `server.js`（端口 3001，用户 `evareel` 隔离）。
- [x] **真实视频已部署**：`/var/www/evareel-videos/1/1.mp4` = 自拍短剧，H.264 + AAC + faststart（约 12.1MB，ffprobe 校验 h264/aac，HTTP 200 + `Range` 请求返回 206）；原 HEVC 备份 `/1/src.mp4`。
- [x] `catalog.json`：仅 drama 1（`available:true` + `premium:true`），`baseUrl https://api.haoweimedia.cn/evareel/videos`，url `/1/1.mp4`。已上传并验证端点返回正确 JSON。
- [x] 服务器安装静态 `ffmpeg 7.0.2`（`/usr/local/bin`）；`server/deploy/publish_videos.sh` 含服务端转码 H.264 + AAC + faststart。

### 客户端 UI（「暂未开放」门禁）
- [x] `mockDramas.js`：新增 `available` 字段，仅 drama 1 `available+premium`（标题保留占位名 `Fated to My Vengeful Husband`）。
- [x] `HomeScreen`：仅 `For You` 展示真实视频（Hero=drama1 + Trending/NewReleases 网格，锁定卡带「暂未开放」遮罩、点击弹提示）；其它分类页签直接 `ComingSoon`；`openDetail/openPlayer` 对非 available 弹「暂未开放」，premium 未解锁走付费墙。
- [x] `PosterCard`：「暂未开放」遮罩 + `PRO` 角标。
- [x] `DiscoverScreen` / `LibraryScreen` / `ProfileScreen`：直接返回 `ComingSoon`（副标题区分）。
- [x] `DramaDetailScreen` / `PlayerScreen`：`unavailable` 守卫，显示「暂未开放」。
- [x] 新增 `src/components/ComingSoon.js` 复用组件。
- [x] `PaywallModal` 含 `restoreVip`（即便 Profile 锁定，首页付费墙可走 Restore，2.1(b) 可测）。

### 隐私与密钥（领先 EvaShort）
- [x] `mytool/privacy-policy.html` 已存在。
- [x] `keys/`（`*.p8`、AscKey）已被 `.gitignore` 忽略且**未入库**（无密钥泄漏风险）。

---

## 三、待完成 ⏳（用户 / ASC 侧，无代码动作）

### P0 — ASC 控制台（阻塞上架）
- [ ] **IAP 送审**（对应 2.1(b)）：ASC 提交商品 `vip.unlock.video`（非消耗型，¥1），上传 IAP 审核截图，重新提交构建（已在 #33）。
- [ ] **年龄分级改 None**（对应 2.3.6）：家长控制 / 年龄保证 / 不受限网页 / UGC / 社交 / 聊天 / 广告 全部选「否」。

### P1 — 审核材料
- [ ] **重截真实截图**（对应 2.3.3）：**必须含 13 英寸 iPad**；用首页信息流 + 播放器真播帧（建议补 Home 全屏播放截图）。
- [ ] **附版权证据 + Notes**（对应 5.2.3）：`legal/版权声明_EvaReel.md` 填姓名 + 签字 → PDF，ASC → App 审核信息 → 备注/附件 上传；Notes 说明内容为自制原创、由自有后端分发、非第三方抓取。
- [ ] **提审**：`npx eas submit --platform ios --profile production`（需 `keys/AuthKey_74AU6WRUF9.p8` 有效；失效则改用 Apple ID 登录方式）。

### P2 — 验收
- [ ] 真机验收：首页点视频 → 付费墙 → 沙盒购买 → 真播；底部三页签「暂未开放」；Restore 可用。
- [ ] App 内「Privacy Policy」加跳转链接指向 `privacy-policy.html` 的 https 地址；ASC「App 隐私」营养标签如实填报（账户/购买/观看历史）。

### P3 — 运维（非拒因）
- [ ] 服务器安全收尾：关闭 SSH 密码登录、改 root 密码（公钥已就位）、避免 `deploy-evareel-v2.sh` 以 root 直拉 pm2。
- [ ] 检查 git 历史是否曾提交过 `keys/`（当前未跟踪，但历史需确认）；如有则 `git filter-repo` 清理。
- [ ] 内容扩量（可选）：后续可加 3–5 部自拍/授权剧，降低「仅 1 部」观感。

---

## 四、当前构建

- **iOS production build #33** 已提交 EAS，状态 `in queue`（2026-08-26）。
- 凭据齐：Distribution Cert（至 2027-08-08）、Provisioning Profile `2GQKWP3SUH` active、Team `D5VA6Q22PL`（Van Nam Nguyen Individual）。
- 日志：https://expo.dev/accounts/wongkuins-team/projects/duanju-novel/builds/8cb87194-2350-4151-aff2-df00a7cfc56f
- 注：buildNumber 走 remote 版本源，自动 32 → 33。

---

## 五、架构差异 / 已知风险

- 视频由 **nginx 静态分发 + `catalog.json`**（同前），无 `/api/videos` 动态接口（EvaShort 有）。
- 风险 1：内容仅 1 部（已用「暂未开放」策略缓解，但仍建议后续扩量）。
- 风险 2：版权声明需用户签字转 PDF 才生效，否则 5.2.3 仍可能被拒。
- 风险 3：IAP / 年龄分级 / 截图 / Notes 全靠 ASC 控制台，未做则仍会被拒。
- 风险 4：bundleId 沿用旧小说 ID，若 Apple 质疑需协调服务器 + ASC 改动。
