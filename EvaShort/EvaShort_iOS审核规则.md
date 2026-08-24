# EvaShort iOS 上架审核规则与清单

> 适用工程：`mytool/`（Expo SDK 57，React Native 0.86，App 名 `EvaShort`，bundleId `com.mycompany.EvaShort`）
> 目的：把 iOS 审核要点固化成"规则 + 清单"，每次提审前逐项核对；并记下当前包的真实状态与改造计划。
> 最后更新：2026-08-24

---

## 〇、总体结论（当前包状态）

**当前包不具备上架条件。** 播放器为"模拟播放"（无真实视频），剧集目录为写死的本地假数据。按 Apple 规则会被 **Guideline 2.1（App 完整性 / 功能不符合描述）** 拒绝，重则触发 4.1（模板/空壳）。

只有把"播放链路"和"剧集目录"都接成后端真实的、可播放的内容后，才可能过审。

---

## 一、审核规则（按严重度）

### 🔴 致命（必拒）
| 规则 | 条款 | 当前状态 | 说明 |
|------|------|----------|------|
| 播放器必须真放视频 | 2.1 | ❌ 违反 | `PlayerScreen` 仅显示封面图 + 90s 假计时器，全代码库无 `mp4/m3u8/HLS/videoUrl` 任何真实视频源 |
| 内容必须是真实目录 | 2.1 | ❌ 违反 | `mockDramas.js` 为 30 部虚构短剧（假标题/假演员/假评分/生成封面），无真实内容源 |

### 🟠 高危
| 规则 | 条款 | 当前状态 | 说明 |
|------|------|----------|------|
| 后端审核期必须真实在线且返回可播数据 | 2.1 | ⚠️ 依赖外部 | 所有鉴权/游客/书架/IAP 验证全走 `api.haoweimedia.cn`（单 IP `43.129.30.172`，无 CDN）。宕机或返回无 `videoUrl` 即拒 |
| 后端必须归开发者自有并可控 | 安全/5.1 | ⚠️ 待确认 | 该域名/服务器须为本人或团队所有，否则账号与购买凭证失控 |
| IAP 商品 ID 必须与代码一致 | 业务 | ⚠️ 待核对 | 代码 `VIP_PRODUCT_ID='2.99'`，须在 ASC 商品 ID 完全一致；类型非消耗、¥1 |
| 必须有可访问的隐私政策 URL | 5.1.1 | ❌ 缺失 | 现有 `privacy-policy.html` 仅本地文件，须部署 https；App 内"Privacy Policy"无跳转链接 |
| App 隐私营养标签必须如实填写 | 5.1.1 | ❌ 缺失 | 收集账号/密码/购买/观看历史，须在 ASC「App 隐私」申报 |

### 🟡 中危
| 规则 | 条款 | 当前状态 | 说明 |
|------|------|----------|------|
| 内容须有合法授权 | 5.2 | ⚠️ 待确认 | 封面/视频若用他人素材须有授权；自产或正版素材库最稳 |
| 须提供审核演示账号 | 2.1 | ⚠️ 待提供 | 游客可免登录浏览但无真内容；须在 ASC 提供演示账号并备注 |
| 元数据/截图/年龄分级须齐备 | 元数据 | ⚠️ 待补 | 6.7″+6.5″ 截图、1024 图标、`supportsTablet=true` 建议补 iPad 截图、年龄分级按内容填 |

---

## 二、真实流程改造计划（过审前提）

### 目标架构
```
启动 → 登录/游客(api.haoweimedia.cn)
     → 首页/发现/详情 从后端拉剧集(含每集 videoUrl)
     → 播放页用 expo-video 真放 HLS/MP4
     → 收藏/历史 存后端, 详情从后端剧集缓存解析
```

### 后端契约（须由 api.haoweimedia.cn 提供）
```
GET /api/dramas            → 剧集列表(分页/分类)
GET /api/dramas/:id        → 单剧详情 + episodes:[{no,title,videoUrl,duration}]
GET /api/search?q=         → 搜索
PUT /api/user/saved        → {ids:[...]}
PUT /api/user/history      → {items:[{id,episode,ts}]}
GET /api/user/saved | /api/user/history  → 返回的 id 须能在 /api/dramas 查到
POST /api/verify-iap       → 收据验证(已有)
```
**关键：每集必须带 `videoUrl`（https 的 .m3u8 或 .mp4）**。

### 前端改动清单
| 文件 | 改动 | 量级 |
|------|------|------|
| `package.json` | 加 `expo-video`（播放）、可选 `expo-keep-awake` | 小 |
| `src/api/client.js` | `API_BASE` 改从 env 读；新增 `getDramas/getDrama/search` | 小 |
| `eas.json`+`app.json` | production 加 `env.API_BASE`/`VERIFY_API`；视频 CDN 的 ATS 放行（https 则无需） | 小 |
| `src/data/mockDramas.js` | 降级为离线兜底种子，结构加可选 `videoUrl`/`posterUrl` | 中 |
| `src/data/catalogueStore.js`（新增） | 缓存后端剧集 map(id→drama)，供 Library/Detail 解析 | 中 |
| `src/screens/HomeScreen.js` | 列表改从后端拉（替代本地） | 中 |
| `src/screens/DiscoverScreen.js` | 搜索/分类改调后端 | 中 |
| `src/screens/DramaDetailScreen.js` | 进页从后端取详情+分集 | 中 |
| `src/screens/PlayerScreen.js` | **整页重写**：expo-video 真放；真缓冲/错误/播完下一集；删假计时器；premium 拦截保留 | 大 |
| `src/screens/LibraryScreen.js` | 详情从 catalogueStore 解析（不再只查 mock） | 小 |
| `src/data/libraryStore.js` | 同步后把剧详情写入 catalogueStore | 小 |
| `AuthScreen.js`/`ProfileScreen.js` | 隐私政策加可点击链接 | 小 |

### 改动量
前端约 9–11 文件，净增/改约 400–700 行（不含后端）。最大外部依赖是后端须真实现 `dramas` 接口 + 真视频文件（HLS）+ 转码。`expo-video` 必须在 **EAS 真机构建**中测，Expo Go/Web 无原生模块。

### 实施顺序
1. 配置外置化（API_BASE/VERIFY_API 走 env）+ 加 expo-video
2. PlayerScreen 真播放（先用写死 videoUrl 联调）
3. 剧集目录后端化（Home/Discover/Detail + catalogueStore）
4. Library 联动
5. 隐私/元数据（隐私政策链接 + ASC 填表 + 演示账号）
6. EAS 真机构建 + TestFlight 自测 → 提审

---

## 三、真实视频获取规则（合规红线）

- ✅ **能用的**：自己拍的；正版授权（Artgrid / Storyblocks / Pond5 / Shutterstock / Adobe Stock 含 App 内分发权）；与短剧制作方签书面分发协议。
- ❌ **不能碰的**：从 ReelShort / 抖音 / 快手 / YouTube 等下载或盗链；免费素材站（多仅非商用）；他人剧照/演员肖像（肖像权）。
- 过审最小成本：自拍或买 **3–5 段** 1–2 分钟真能播视频 → `ffmpeg`/Mux/Cloudflare Stream 转 HLS → 后端下发 `videoUrl` → expo-video 真放。无需整库即可过 2.1。

---

## 四、提审前 Checklist（每次提审逐项核对）

- [ ] 播放器真放视频（非模拟），点开任意集能播
- [ ] 剧集目录来自后端且含 `videoUrl`，审核期后端在线
- [ ] 3–5 部以上内容有合法授权（备授权文件）
- [ ] 免费集可播、premium 集弹付费、已解锁可播
- [ ] IAP 商品 ID 与代码一致，沙盒买/恢复跑通，付费协议已签
- [ ] 隐私政策已部署 https 且可访问，App 内有跳转链接
- [ ] ASC「App 隐私」营养标签已如实填写（账户/购买/历史）
- [ ] 6.7″+6.5″ 截图、1024 图标、年龄分级齐备
- [ ] 已提供审核演示账号
- [ ] API_BASE / VERIFY_API 经 env 注入，未写死泄露
- [ ] 视频域名 https（或已配 ATS 例外）

---

## 五、安全/牵连（已处理 & 待办）

- ✅ 已将 `*.p8` / `keys/` 加入 `.gitignore`，并把 `keys/*.p8` + `apple-dev.txt` + `Issuer.txt` + `keyID.txt` 从 git 索引移除（不再跟踪，磁盘文件保留供构建）。
- ✅ 已将根目录旧 App（番茄助手 `App.js`/`app.json`/`index.js`）归档至 `old-fanqie-helper/`，避免误构建。
- ⚠️ **密钥仍存在于 git 历史（已推送的旧提交）**：须在 App Store Connect 撤销这 3 个 ASC API Key 并重建、旧 Apple 账号改密，并用 `git filter-repo` 清理历史后 force push。
- ⚠️ 后端域名 `haoweimedia.cn` 归属与服务器可控性待本人确认。
