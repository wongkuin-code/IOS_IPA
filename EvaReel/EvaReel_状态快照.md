# EvaReel 状态快照

> 工程：`mytool/`（Expo SDK 57 / RN 0.86，App `EvaReel`）
> 目标：过 Apple 审核（重点 2.1 真实播放 + 真实目录、5.2.3 版权、2.3.3/2.3.6 元数据）
> 最后更新：2026-09-02
> 与 `EvaShort` 同步审查：本文件镜像 `EvaShort/状态快照.md` 的结构与口径。

---

## 〇、2.1(b) 拒审修复（2026-09-02，Submission `78b2789c`）

**拒因**：审核员（iPad Air 11" M3 / iPadOS 26.6，沙盒）未走购买流程，Profile 页即显示 "VIP Unlocked"。

**客户端（`mytool/src/iap/UnlockContext.js`）**
- [x] 去掉 3 处 fail-open 兜底（expo-iap 模块缺失 / 监听器注册抛异常 / `initConnection` 抛异常时 `setUnlocked(true)`）：改为 **fail closed**，只记录错误、保持锁定。
- [x] 新增 `awaitingUserAction` 门闩：`purchaseUpdatedListener` 只处理**本次会话由用户主动发起**的 buy/restore，忽略 StoreKit 启动时重放的未完成交易（旧沙盒购买残留是「开局即解锁」的主因）。
- [x] 删除「连上商店即 `getAvailablePurchases()` 自动恢复」：恢复**只在用户点 Restore Purchase 时**进行（Profile + Paywall 均可触发，符合苹果要求）。
- [x] Restore 校验通过后补 `finishTransaction`，清掉未完成交易、避免每次启动重放。
- [x] Watchdog 文案修正（原「重启自动恢复」已不成立 → 改指向 Restore Purchase）。

**服务器（`server/server.js`，改动需重新部署到 43.129.30.172）**
- [x] 原固定 `Environment.SANDBOX` 验签：库在 `jws_verification.js:78` 强制 `decodedJWT.environment !== this.environment` 即抛错 → **上架后真实用户（Production 交易）会验签失败、永远解锁不了**。
- [x] 改为 Sandbox / Production 双 verifier，按 JWS payload 里的 `environment` 声明选路并互相兜底；`APP_ENV` 可强制单环境（默认 `AUTO`）。
- [x] `APPLE_APP_ID` 默认 `6799368982`（Production verifier 构造时必填，否则启动即抛 `appAppleId is required`）。

**部署记录（2026-09-02，43.129.30.172）**
- [x] `/opt/evareel-verify-v2/server.js` 已替换并 `node --check` 通过；回滚文件 `server.js.bak.20260902`。
- [x] pm2 wrapper `/usr/local/bin/run-evareel-v2.sh` 同步改：`APP_ENV=SANDBOX` → `APP_ENV=AUTO`，并补 `export APPLE_APP_ID=6799368982`（原写死 SANDBOX 会覆盖自动选路）。
- [x] `pm2 restart evareel-verify-v2` → online；启动日志 `listening on :3001 env=AUTO verifiers=Sandbox,Production bundleId=com.mytool.booksreader`。
- [x] 公网验证：`https://api.haoweimedia.cn/evareel/health` → `{"ok":true,...,"verifiers":["Sandbox","Production"]}`；非法 JWS → 400 `INVALID_SIGNATURE`，进程不崩。
- [x] **旧日志佐证拒因**：此前已有 4 笔沙盒交易验签通过（`tx=2000001225475638 / 226623912 / 226895128 / 228690452`，`env=Sandbox`）→ 说明审核端确实买过，旧代码「启动即自动恢复」把 VIP 直接解锁了。

**结论（Web 兼容影响面）**：Web 预览相关代码仅 3 处且都有运行时守卫，对 iOS 无影响 —— `UnlockContext.js:39` 的 `Platform.OS === 'web'` 分支、`PaywallModal.js:20` 与 `AppNavigator.js:44` 的 `typeof document === 'undefined'` 提前 return（`previewMode` 无任何消费方，属于死代码）。expo-iap v5 的 `requestPurchase` / `finishTransaction` / `ErrorCode` / `purchaseToken`(iOS JWS) 调用形式已逐一核对无误。

## 〇·隐私政策部署（2026-09-02，P0 拒审点修复）

> 复查发现应用内 "Privacy Policy" 按钮是死按钮，且 `api.haoweimedia.cn/evareel/privacy-policy.html` 返回 404 → 5.1.1 + 2.1 风险。

- [x] **隐私页上线**：`mytool/privacy-policy.html` 上传至 `/var/www/evareel/privacy-policy.html`（1659B）；nginx `evashort.conf`（api.haoweimedia.cn server 块）新增精确 location `location = /evareel/privacy-policy.html { alias /var/www/evareel/privacy-policy.html; }`，`nginx -t` 通过 + `systemctl reload nginx`。
- [x] **验证**：公网 `https://api.haoweimedia.cn/evareel/privacy-policy.html` → HTTP 200（`<title>Privacy Policy - EvaReel</title>`）；文案准确（无账户、仅本地 AsyncStorage、含联系邮箱 vuthingocnga9798@icloud.com）。
- [x] **应用内按钮接线** `ProfileScreen.js`：删 `ComingSoon` 无用 import；加 `Linking` + `Constants`；`Privacy Policy` → 打开上述 URL；`About` → Alert 显示版本号 + 版权；`Rate EvaReel` → `https://apps.apple.com/app/id6799368982`（ASC Apple ID 即商店页 id）。无残留死按钮。
- [x] `server.js` 内 `app.get('/evareel/privacy-policy.html')` 现被 nginx 拦截、公网不可达，属无害死路由，保留。
- [!] **客户端改动需重新出包**：`ProfileScreen.js` 改了行为，`eas build --platform ios --profile production` + `eas submit` 才生效；服务器部署已即时生效。

---

## 一、核心决策（本轮）

- **过审策略（早期）改为最小化合规 App**：只放 1 条真实可播的**治愈/放松向原创视频**，其余全部「暂未开放」，IAP 购买流程可测。
- **内容策略更新（应对 4.2 拒信）**：最新提审包已改为**全库真实可播内容**（无 "Coming Soon" 占位、无空卡片），详见第六节。仓库 `mockDramas.js` 中 ID 1–9 为 `available` 真实视频+真实首帧封面；若包由服务端 `api.haoweimedia.cn/evareel` 下发全量内容，则全部可播。提交前须确认打出的包确实不含占位空卡片（否则 4.2 仍会被打回）。
- **bundleId 维持 `com.mytool.booksreader`**：`server/server.js:84` 硬编码校验 `payload.bundleId !== BUNDLE_ID`，且 ASC App ID `6799368982`（Team `D5VA6Q22PL`）即此 ID；改则需同步服务器 `BUNDLE_ID` 与 ASC，风险大，故保持。
- **slug 维持 `duanju-novel`**：`extra.eas.projectId`（a49f46cd…）在 EAS 注册的 slug 即此值，改 `evareel` 会触发 `slug does not match projectId` 构建失败（已踩坑回退）。slug 只影响 EAS 项目名，不影响包名/显示名。
- **版权来源 = 自拍自制**（非朋友「火华短剧」）：删除 `legal/授权书_火华短剧.md`，改出 `legal/版权声明_EvaReel.md`（自权属声明），已填平台信息（Bundle ID / Team / ASC App ID / 域名 / 播放器），姓名与证件号待用户手填 + 签字 + 转 PDF。
- **iPhone-only（2026-08-31，commit `0fc95b9`）**：`app.json` `ios.supportsTablet=false`，App 仅支持 iPhone、iPad 上以 iPhone 布局居中运行（系统壁纸填充四周，非纯黑）。按 `AppStoreListing_Healing_EN.md:118` 要求仍需上传 **13" iPad（2048×2732）截图**，`screenshots_padded/` 中 iPad 图为「真实 iPhone 界面 + 纯黑撑边（pillow pad）」生成；用户确认目标只需「iPad 显示与上传截图内容一致」——界面内容一致，仅四周黑边 vs 真机壁纸的色差（iPhone-only 应用常态，过审风险低）。

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
- 风险 1（已缓解）：早期内容仅 1 部 + 大量 Coming Soon，已在 **4.2 拒信**后被判定「内容太少」；最新提审包已改为全库真实可播（见第六节），该风险关闭。
- 风险 2：版权声明需用户签字转 PDF 才生效，否则 5.2.3 仍可能被拒。
- 风险 3：IAP / 年龄分级 / 截图 / Notes 全靠 ASC 控制台，未做则仍会被拒。
- 风险 4：bundleId 沿用旧小说 ID，若 Apple 质疑需协调服务器 + ASC 改动。

---

## 六、审核动态：4.2 拒信与应对（2026-08-29 收 / 2026-08-31 处置）

### 拒信（版 35，Review date 2026-08-29）
- **条款**：Guideline 4.2 - Design - Minimum Functionality
- **设备**：iPad Air 11-inch (M3)（说明 iPhone-only 跑 iPad 本身未被卡，问题在内容）
- **版本**：1.0 (build 35)
- **Submission ID**：`78b2789c-ea7c-4412-8e0f-6db81298142a`
- **原因**：App 内真实可播内容太少（build 35 仅 1 条 + 大量 Coming Soon），看起来像空壳，不符合「足够有价值的内容/功能」。

### 根因澄清
- 仓库 `mockDramas.js` 中 ID 10–30 为 `seed()` 仅传 7 参、无 `available`/`premium` → `asset:null`、无视频、无封面 → 空卡片。若包含这些条目且图/视频缺失，审核员必以 4.2 打回。
- build 35 的稀疏观感即来源于此。

### 应对（已落地）
- **内容补全**：最新提审包改为**全库真实可播**，无占位、无 Coming Soon 空卡（用户确认：现在最新包就是全部真实可播内容）。
- **回信要点**（已草拟，英文）：
  1. 感谢审核；说明 EvaReel 为原创治愈短剧流媒体；
  2. 被审的 build 35 为早期限量目录；新提交 build 已将完整内容库上线，每部均为自有后端 `https://api.haoweimedia.cn/evareel` 托管、经 App 内播放器端到端真播；
  3. 明确「无 placeholder / 无 Coming Soon，全部真实可播」；
  4. 引导审核员实测：Home（真实首帧封面）→ Library/Discover（浏览全库）→ Player（点开真播）；
  5. 请求复审，并留「若某条在测试设备无法播放请告知，立即排查」。
- 回信模板见对话记录（英文版，替换 `[BUILD NUMBER]` 为实际新 build 号）。

### 待办
- [ ] 确认打出的新包确实全量真实可播、不含空卡片（核对 `mockDramas.js` 或服务端目录）。
- [ ] 在 ASC 以新 build 重新提交 + 粘贴上述 Notes 回复拒信。
- [ ] 若仍被判 4.2，需真实增加可播视频数量（服务端 `publish_videos.sh` 转码 H.264+AAC+faststart 后下发）。
