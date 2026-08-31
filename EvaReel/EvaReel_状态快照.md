# EvaReel 状态快照

> 工程：`mytool/`（Expo SDK 57 / RN 0.86，App `EvaReel`）
> 目标：过 Apple 审核（重点 2.1 真实播放 + 真实目录、5.2.3 版权、2.3.3/2.3.6 元数据）
> 最后更新：2026-08-31
> 与 `EvaShort` 同步审查：本文件镜像 `EvaShort/状态快照.md` 的结构与口径。

---

## 一、核心决策（本轮）

- **过审策略改为最小化合规 App**：只放 1 条真实可播的**治愈/放松向原创视频**，其余全部「暂未开放」，IAP 购买流程可测。不再追求多部剧。
- **bundleId 维持 `com.mytool.booksreader`**：`server/server.js:84` 硬编码校验 `payload.bundleId !== BUNDLE_ID`，且 ASC App ID `6799368982`（Team `D5VA6Q22PL`）即此 ID；改则需同步服务器 `BUNDLE_ID` 与 ASC，风险大，故保持。
- **slug 维持 `duanju-novel`**：`extra.eas.projectId`（a49f46cd…）在 EAS 注册的 slug 即此值，改 `evareel` 会触发 `slug does not match projectId` 构建失败（已踩坑回退）。slug 只影响 EAS 项目名，不影响包名/显示名。
- **版权来源 = 自拍自制**（非朋友「火华短剧」）：删除 `legal/授权书_火华短剧.md`，改出 `legal/版权声明_EvaReel.md`（自权属声明），已填平台信息（Bundle ID / Team / ASC App ID / 域名 / 播放器），姓名与证件号待用户手填 + 签字 + 转 PDF。
- **iPhone-only（2026-08-31，commit `0fc95b9`）**：`app.json` `ios.supportsTablet=false`，只支持 iPhone、不需要 iPad 截图；审核截图按 6.5"（1284×2778）+ 13" iPad（2048×2732）两种尺寸加安全区黑边生成，见 `screenshots_padded/`。

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
- [x] **真实视频已部署**：`/var/www/evareel-videos/1/1.mp4` = 自拍治愈/放松向原创视频，H.264 + AAC + faststart（约 12.1MB，ffprobe 校验 h264/aac，HTTP 200 + `Range` 请求返回 206）；原 HEVC 备份 `/1/src.mp4`。
- [x] `catalog.json`：仅 drama 1（`available:true` + `premium:true`），`baseUrl https://api.haoweimedia.cn/evareel/videos`，url `/1/1.mp4`。已上传并验证端点返回正确 JSON。
- [x] 服务器安装静态 `ffmpeg 7.0.2`（`/usr/local/bin`）；`server/deploy/publish_videos.sh` 含服务端转码 H.264 + AAC + faststart。

### 客户端 UI（过审最小化门禁，2026-08-27 收敛）
- [x] `mockDramas.js`：保留 `available` 字段，仅 drama 1 `available+premium`；全库 30 部题材统一为治愈/放松向（drama 1 标题《Enjoy Nature》，与版权声明作品名一致）。
- [x] **首页（For You）= 单张满屏大封面 + 不可滚动 + 无扩展入口**：`HomeScreen` 仅渲染 1 个真实可播视频 `Hero`（`style={{flex:1, aspectRatio: undefined}}` 撑满剩余高度），顶部仅一行标题、无分类页签 / 搜索；无「Trending/New Releases」网格、无「More / 加载更多」、无点击展开更多，审核员无法滑入未实现区域（对应 2.3.3）。
- [x] **Discover 页**：仅放 3 个「锁起来」的占位封面（`PosterCard` + `Coming Soon` 遮罩），点击弹 `Coming Soon`（暂时未开放），不进入播放器。
- [x] **Library 页**：保持锁定，直接返回 `ComingSoon` 占位（即「暂未开放」状态）。
- [x] **Profile 页**：已展示真实内容（头像 / Saved·History 统计 / 未解锁时「Unlock Premium」入口 / 设置列表：通知开关、评分、隐私政策、Restore Purchase、About），不再是不实现的 Coming Soon。
- [x] `PosterCard`：「暂未开放」遮罩 + `PRO` 角标，可点击触发 `onPress`（锁定项用于弹 Coming Soon）。
- [x] `DramaDetailScreen` / `PlayerScreen`：`unavailable` 守卫，显示「暂未开放」；`DramaDetailScreen` 在 `drama` 为空时**提前 `return`**（原 bug：`drama.premium` 在 `if(!drama) return` 之前读取会崩），已修复。
- [x] 新增 `src/components/ComingSoon.js` 复用组件。
- [x] `PaywallModal` 含 `restoreVip`（首页 / Profile 付费墙可走 Restore，2.1(b) 可测）。

### 封面与首页收敛（提审观感）
- [x] **封面改用 EvaReel 真实视频首帧**：删除 `assets/covers/` 全部旧情侣/言情照（`poster-*.jpg`）及废弃模块 `src/data/posters.js`、`src/data/coverAssets.js`；从 EvaReel 自有视频 `https://api.haoweimedia.cn/evareel/videos/1/1.mp4` 提取第一帧 → `assets/covers/frame-1.jpg`（720×1280 竖屏 H.264）；`drama1.asset` 指向该图，其余 29 部 `asset=null` 回退 `DramaCover` 渐变（不再依赖任何照片资源）。
- [x] **⚠️ 封面改为「本地打包」修复（2026-08-31）**：build36（EAS #37）实测 **Web 端能显示首帧、iOS 端不显示**；已确认服务器/TLS/响应头条/二进制里的新代码全部正常，根因是 iOS 设备运行时拉取 `api.haoweimedia.cn` 的远程 `poster.jpg` 失败（Web 端网络可达）。解法 = 9 张真实首帧 `poster-1..9.jpg`（720×1280）从服务器下载进 `mytool/assets/covers/`，`mockDramas.js` 改用 Metro 静态 `require()` 打包进 App（约 1.5MB），零网络依赖，iOS/Web/审核端均必显示；`asset: available ? COVERS[id] : null`。
- [x] **Hero 封面 letterbox 渲染**：`HeroCard` 容器 16:9、`resizeMode="contain"` 让竖屏首帧完整居中显示，两侧黑边用「同图放大 + 压暗」填充（电影感）。Web 端因 RN-Web 容器缺 `position:'relative'` 会导致封面高度塌缩消失，已给 `HeroCard`/`PosterCard`/`DramaCover` 补 `position:'relative'`。
- [x] **首页大封面（2026-08-27）**：`HomeScreen` 改为单个 `Hero` 撑满屏幕，去掉首页网格 / 页签 / 搜索 / More，符合「尽量少视频 + 不可滚动 + 无扩展操作」的过审口径。

### 全英文化（无中文展示，2026-08-26）
- [x] **App 内全部用户可见文案英文化**：30 部剧集标题/副标题、`hotSearches` 热搜词、所有「暂未开放」→ `Coming Soon`、首页 footer「更多内容即将开放」→ `More content coming soon`、播放器全部提示（加载失败重试 / 解锁后观看 / 未开放 / 该集即将上线）、各页 `Alert`、`ComingSoon` 占位、`Web 预览`→`Web Preview` 提示等全部改为英文；代码注释同步英文化。已验证打包后 JS 无中文字符。
- [x] **隐私政策页英文化**：`mytool/privacy-policy.html` 由中文翻译为英文（标题/各章节/联系邮箱），`<html lang="en">`，用于 App Store 提审链接。
- [x] **版权声明 PDF 保留中文「短剧」表述**（按用户决定）：`legal/2026_08_26_19_03_31.pdf` 为法律文件、非 App 内展示，未改动。

### 隐私与密钥（领先 EvaShort）
- [x] `mytool/privacy-policy.html` 已存在。
- [x] `keys/`（`*.p8`、AscKey）已被 `.gitignore` 忽略且**未入库**（无密钥泄漏风险）。

---

## 三、待完成 ⏳（用户 / ASC 侧，无代码动作）

### P0 — ASC 控制台（阻塞上架）
- [ ] **IAP 送审**（对应 2.1(b)）：ASC 提交商品 `vip.unlock.video`（非消耗型，¥1），上传 IAP 审核截图，重新提交构建（已在 #33）。
- [ ] **年龄分级改 None**（对应 2.3.6）：家长控制 / 年龄保证 / 不受限网页 / UGC / 社交 / 聊天 / 广告 全部选「否」。

### P1 — 审核材料
- [x] **截图已生成（2026-08-31）**：`screenshots_padded/`（`01_player` / `02_paywall` / `03_profile` / `04_discover` / `05_home` × iPhone 6.5" 1284×2778 + iPad 13" 2048×2732，`pad_screenshots.py` 加黑边对齐 ASC 尺寸）；对应 2.3.3 截图须拍到「真实卡 + Coming Soon 遮罩 + 播放器真播帧」。
- [x] **版权证据已备**（对应 5.2.3）：签字扫描件 `legal/2026_08_26_19_03_31.pdf` 已就位（3 页，含平台信息表 + 英文 Notes 正文 + 手写签字/越南地址），上传时 ASC → App 审核信息 → 备注/附件 选该 PDF；备注粘贴文末英文说明（自制原创、自有后端分发、非第三方抓取）。
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

- **iOS production build #39**（封面打包修复版，2026-08-31）已成功构建并上架：
  - EAS 构建 `a175f29f-5e8b-40c4-8c1f-1edf068f6e0b`，状态 `FINISHED`，buildNumber 39；解决 build36「iOS 不显示首帧封面」问题（封面改为本地打包，见上文）。
  - `eas submit --id a175f29f...` 成功上传 App Store Connect，Apple 处理完成 `processingState=VALID`。
  - 已加入外部 TestFlight 组 `12a65f74-9141-4b96-b57a-c2182f69405d`（204）；内部组 `8b812752...` 因 `hasAccessToAllBuilds=true` 自动包含。
  - 状态页 https://appstoreconnect.apple.com/apps/6799368982/testflight/ios
- 历史构建：**#37**（build36 批次，commit `a5ed503`，远程封面前）已入外部组；**#38**（同 commit 备用，未提交）；#35 曾被 `tf_wait_add.js` 在 PROCESSING 时误加入组。
  - ⚠️ 脚本坑位记录：`tf_wait_add.js` 取「列表最新 VALID」的构建，若最新构建还在 PROCESSING 会把上一个 VALID 加组；`check_testflight.js` 的 build→betaGroups GET 会 403（该关系只允许 CREATE/DELETE），组归属需从 betaGroup 侧 `/v1/betaGroups/{id}/relationships/builds` 验证。
- 凭据齐：Distribution Cert（至 2027-08-08）、Provisioning Profile `2GQKWP3SUH` active、Team `D5VA6Q22PL`（Van Nam Nguyen Individual）；App Store API Key `AuthKey_74AU6WRUF9.p8` 在位（EvaReel 用 74AU6WRUF9 + issuer ac9f4281；`keys/keyID.txt` 里的 6XTPZ5CBDW 是 EvaShort 的，勿用于 EvaReel）。
- 日志（#39）：https://expo.dev/accounts/wongkuins-team/projects/duanju-novel/builds/a175f29f-5e8b-40c4-8c1f-1edf068f6e0b
- **Web 预览包（仅供 UI/文案审查，不用于提审）**：`cd EvaReel/mytool && npx expo export --platform web`，静态产物在 `dist/`；真播与 IAP 在 Web 端走 mock（已解锁、不弹真实付费墙），仅用于界面核对。

---

## 五、架构差异 / 已知风险

- 视频由 **nginx 静态分发 + `catalog.json`**（同前），无 `/api/videos` 动态接口（EvaShort 有）。
- 风险 1：内容仅 1 部（已用「暂未开放」策略缓解，且首页已收敛为单张满屏大封面、Discover 仅 3 个锁定占位，降低空壳观感，但仍建议后续扩量）。
- 风险 2：版权声明需用户签字转 PDF 才生效，否则 5.2.3 仍可能被拒。
- 风险 3：IAP / 年龄分级 / 截图 / Notes 全靠 ASC 控制台，未做则仍会被拒。
- 风险 4：bundleId 沿用旧小说 ID，若 Apple 质疑需协调服务器 + ASC 改动。
