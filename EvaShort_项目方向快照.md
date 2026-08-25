# EvaShort iOS 上架项目 — 方向 & 流程快照（AI 上下文）

> 最后更新：2026-08-24
> 配套规则文档：`EvaShort_iOS审核规则.md`（人类可读的审核规则 + 提审 Checklist，本文件不再重复细节，只摘要硬指标）
> 本文件目的：**让任何 AI 一眼看懂当前方向、改造流程、代码现状、待办与风险**，接手即可干活。
> 写代码前另读 `mytool/AGENTS.md`（要求先查 Expo v57 官方文档）。

---

## 0. 一句话目标
把 **EvaShort**（Expo SDK 57 / React Native 0.86 的 iOS 短剧 App，bundleId `com.mycompany.EvaShort`）改造到可过 Apple 审核上架。
**当前进度（2026-08-25）**：播放器已改为 `expo-video` 真播放（无假计时器），目录已接火华短剧（1 部、5 集真实本地视频，封面用视频首帧）。剩余 blocker：后端视频接口未建、内容仅 1 部偏少、缺朋友书面授权、隐私政策/账号类待补 → 仍会被 **Guideline 2.1 / 5.1** 卡，但「假播放 / 假目录」这一拒因已消除。

---

## 1. 当前确定方向（改造目标）

- **播放链路**：从服务器拿 `videoUrl` **真播放**，彻底去掉模拟播放。
- **内容来源（已确定）：使用朋友的短剧**（朋友自制、未上线）。⚠️ **必须取得朋友书面授权**（非口头）——Apple 被投诉会直接下架/封号；风险比商业平台低，但必须有凭证。授权书模板放 `legal/`（待生成）。无论来源须确保角色肖像、BGM 权利干净。
- 前端不关心内容类型，只消费后端返回的 `videoUrl`。
- **App 定位 = 短剧**（与内容一致，避免 Guideline 2.1）。

> 注：`EvaShort_iOS审核规则.md` 已同步为「短剧（朋友自制）」方向，与本快照一致。

---

## 2. 核心约束（硬指标，违反即拒）

- 必须**真播放**（2.1）：点开任意条能播真实视频，禁止假计时器/封面占位冒充。
- 视频接口审核期必须**真实在线**且返回 `videoUrl`（单点 `haoweimedia.cn` 风险高，需确认归属）。
- `API_BASE` / `VERIFY_API` 必须走 **env**，禁止写死泄露（`client.js` 当前写死，待改）。
- `expo-video` 是**原生模块** → 不能用 Expo Go，必须 **EAS dev build / 真机构建** 才能测。
- 隐私政策需 **https 可访问** + App 内跳转链接；ASC「App 隐私」营养标签须如实填报（账户/购买/观看历史）。
- IAP 商品 ID 须与代码一致（当前 `VIP_PRODUCT_ID='2.99'`，非消耗型）。

---

## 3. 改造流程（已定，待执行）

### 后端 `server/`（Node/Express，已含 auth/user/IAP/guest quota，缺视频接口）
1. ✅ 新建 `server/videos.json`：视频清单，每条 `{id, title, category, premium, poster, episodes:[{no, videoUrl, duration}]}`（火华短剧 5 集）。
2. ✅ `server.js` 加：`/videos` 静态目录 + `GET /api/videos`（列表，支持 `?category=&page=`）、`GET /api/videos/:id`（详情+分集）、`GET /api/search?q=`。**id 用数字**，对齐现有 `/user/watch` 的 `dramaId`，无需改配额逻辑。
3. `server/.env.example` 补 `API_BASE` 说明。

### 前端 `mytool/`（Expo SDK 57, RN 0.86）
4. **配置外置**：`app.json` 的 `expo.extra` 加 `API_BASE`（dev=本地 server，prod=生产）；`eas.json` production profile 加 `env.API_BASE` / `VERIFY_API`；`client.js:4` 改为从 `Constants.expoConfig.extra.API_BASE` 读取（带远程兜底），并新增 `getVideos()` / `getVideo(id)` / `searchVideos(q)`。
5. **装依赖**：`npx expo install expo-video`（按 Expo 57 装对应版；可选 `expo-keep-awake`）。
6. **数据层**：`mockDramas.js` 降级为离线兜底种子，结构加可选 `videoUrl`/`posterUrl`；新增 `src/data/catalogueStore.js` 缓存后端视频 `map(id→video)`。
7. **列表/详情接后端**：`HomeScreen.js`、`DiscoverScreen.js`、`DramaDetailScreen.js` 改调后端，替代 `import mockDramas`。
8. **PlayerScreen 重写（核心，改动最大）**：用 `expo-video` 的 `VideoView` + `useVideoPlayer` 真放；**删掉 `EPISODE_MS` 假计时器与 `setInterval`**（`PlayerScreen.js:18`、`:45-52`）；封面仅作 loading 占位；保留 premium 拦截与游客配额（现有 `watch()` 逻辑复用）。
9. **Library 联动**：`LibraryScreen.js` / `libraryStore.js` 同步后详情写入 `catalogueStore`。

### 验证
10. 本地起 `server` + `expo` dev build 真机/模拟器确认"点开任意条能真播" → TestFlight 自测 → 提审。

---

## 4. 代码现状（改造前，AI 改代码前必读）

| 文件 | 现状 |
|------|------|
| `mytool/src/screens/PlayerScreen.js` | ✅ 已真播放：`expo-video` 的 `VideoView`+`useVideoPlayer`，无假计时器；源来自 `episodeVideos`（本地 `/videos/*.mp4`），含倍速/进度/播完下一集 |
| `mytool/src/data/mockDramas.js` | ✅ 仅火华短剧 1 部（真实），`episodes=5`、`episodeVideos` 指向本地 `/videos/1~5.mp4`；封面用视频首帧 `poster-1.jpg`（脚本 `extract_firstframes.sh` 生成）；虚构 29 部已移除 |
| `mytool/src/api/client.js` | `API_BASE` 写死 `https://api.haoweimedia.cn/api`（`client.js:4`）；无 videos 接口方法 |
| `mytool/package.json` | ✅ 已加 `expo-video@~57.0.2`（移除 `expo-av`） |
| `server/server.js` | ✅ 已加视频接口：`/api/videos`（列表/分类/分页）、`/api/videos/:id`（详情+分集 `videoUrl`）、`/api/search`、`/videos` 静态目录（指向 `test_video/videos_compressed`） |

---

## 5. 待办 / 风险

- [x] **真实视频素材（本地就位）**：火华短剧 5 集已落地（`test_video/videos_compressed/1~5.mp4`，首帧封面已生成 `assets/covers/poster-1~5.jpg`）；⏳ 仍须：① 朋友**书面授权** ② 转生产（后端 `/videos` 或 CDN 下发 `videoUrl`）。
- [x] 生成 `legal/` 朋友授权书：**原件已就位** `EvaShort/legal/授权书_火华短剧.pdf`（2 页扫描签署件，来源 `test_video/2026_08_11_15_59_55.pdf`）。⚠️ 待人工核验条款是否覆盖展示/转码/收费、全球、运营期、肖像与配乐权利担保；缺则补 `legal/授权书_模板.md`。
- [ ] **密钥仍在 git 历史**（已移出索引但未清理）：须撤销 3 个 ASC API Key + `git filter-repo` 清历史 + force push；旧 Apple 账号改密。
- [ ] 后端域名 `haoweimedia.cn` 归属与服务器可控性待确认（若为远程生产）。
- [ ] 隐私政策 https 部署 + ASC 营养标签 + 审核演示账号。

---

## 6. 给其他 AI 的指引

- 改前端前先读：`mytool/AGENTS.md` → 本快照 → `EvaShort_iOS审核规则.md`。
- **播放器相关只动 `PlayerScreen.js`，且必须真放，禁止加回假计时器/封面冒充播放。**
- 任何新增视频接口**必须返回 `videoUrl` 且审核期在线**；id 用数字对齐现有 `dramaId`。
- 不擅自把 `API_BASE` 写死；始终从 env（`Constants.expoConfig.extra`）读取。
- 内容方向已确定为用户指定的**朋友短剧**；务必落实朋友书面授权，否则退回零风险的自拍风景以免产权事故。
