# EvaShort 状态快照

> 工程：`mytool/`（Expo SDK 57 / RN 0.86，App `EvaShort`，bundleId `com.mycompany.EvaShort`）
> 目标：过 Apple 审核（重点 Guideline 2.1 真实播放 + 真实目录，5.1 隐私）
> 最后更新：2026-08-25

---

## 一、已完成 ✅

### 播放链路（合规核心）
- [x] `PlayerScreen` 改用 `expo-video` **真播放**，删除所有假计时器/模拟进度；保留 premium 拦截、guest 配额、播完自动下一集。
- [x] `package.json`：加 `expo-video@~57.0.2`，移除 `expo-av`。
- [x] 播放器 `timeUpdateEventInterval = 0.25`，进度条正常驱动。

### 内容目录（真实、自有）
- [x] `mockDramas` 精简为 **1 部真实短剧**（火华短剧，5 集真视频 + 首帧封面），虚构 29 部已移除。
- [x] 封面用 `scripts/extract_firstframes.sh` 从 `/videos/N.mp4` 抽首帧，下载图已删。
- [x] 本地测试源用 `test_video/videos_compressed`（非原 `videos`）。

### 后端视频接口（本地已实现）
- [x] `server/server.js`：`GET /api/videos`（列表/分类/分页）、`GET /api/videos/:id`（详情 + 分集 `videoUrl`）、`GET /api/search`。
- [x] 静态：`/videos`（Range 支持）、`/covers` 长缓存；CORS `*`。
- [x] `server/videos.json`：含 `cast` 等完整字段；`videoUrl` 为相对路径（已预留 CDN 切换）。
- [x] **视频/封面已打包进仓库外目录**：`server/videos/`（1~5.mp4，约 57MB）、`server/covers/`（poster-1~5.jpg）；`server.js` 的 `VIDEOS_DIR` 默认改为 `__dirname/videos`，部署**自包含**（无需再依赖 `test_video`）。二者已加 `.gitignore`，由 `deploy-on-server.sh` 的 rsync 随 `server/` 上服务器（不进 git 历史）。
- [x] `deploy-on-server.sh` 末尾新增 `/videos/1.mp4`、`/covers/poster-1.jpg` 的 200 可播校验，部署完即知线上能否真播。

### 前端接后端（remote-first + 本地回退）
- [x] `client.js`：`API_BASE` 从 `extra.apiBase`（env）读取 + 回退默认域名；新增 `STATIC_BASE`、`getVideos/getVideo/searchVideos`。
- [x] 新增 `data/catalogue.js`：统一数据层；`normalize()` 把相对 `videoUrl`/`poster` 解析为绝对 `https`；`useCatalogue()` 钩子；`loadVideoDetail()` 懒加载分集。
- [x] **兜底也绝对化**：本地剧集视频地址解析为绝对 `https`（本会话新增），真机不再因相对路径播不出。
- [x] 6 个页面全部切到 catalogue：Home / Discover / DramaDetail / Player / Library / MoreList。
- [x] `app.json` 加 `extra.apiBase`。

### 验证
- [x] `npx expo export -p web` 编译通过（exit 0）。

---

## 二、待完成 ⏳（按优先级）

### P0 — 过审生死线
- [x] **后端部署上线且审核期真实在线**：`server/videos/` + `covers/` 已 scp 到 `43.129.30.172:/opt/evareel-server`，`evashort`(pm2) 已重启；本机复测 `https://api.haoweimedia.cn/videos/1.mp4` 返回 200 + `Accept-Ranges: bytes`、`/api/videos/1` 正常返回分集 `videoUrl`（2026-08-25 实测）。2.1「假播放/假目录」拒因已消除。
- [ ] **视频改 CDN 绝对地址**（见下方"CDN 方案"）：可选优化，审核拉流直连源站可能偏慢，非拒因。
- [x] **朋友短剧书面授权书**（5.2 红线）：原件已就位 `legal/授权书_火华短剧.pdf`（2 页扫描签署件，来源 `test_video/2026_08_11_15_59_55.pdf`）。⚠️ **待人工核验条款**是否覆盖 App 内展示/转码/收费、全球、运营期、肖像与配乐权利担保；若缺模板条款则补 `legal/授权书_模板.md`。

### P1 — 审核材料（回应 2.1 Information Needed）
- [ ] App Store Connect Notes 填 7 项（草稿已给）：录屏 / 测试设备 / 功能描述 / 演示账号 / 外部服务清单 / 地区一致性 / 授权文件。
- [ ] **演示账号**：注册一个真实账号填入 Notes；premium 走沙盒 IAP（无真实扣费）。
- [ ] **录屏**：真机 + 最新 iOS，展示真实播放 + 注册/登录/删号 + IAP 解锁。
- [ ] **截图更新**（2.3.3）：必须是真实使用画面（信息流/播放页），非登录页/闪屏。

### P2 — 隐私与账号
- [ ] 隐私政策部署 `https` 且可访问；App 内"Privacy Policy"加跳转链接。
- [ ] ASC「App 隐私」营养标签如实填写（账户/购买/观看历史）。
- [ ] IAP 商品 ID `2.99` 与 ASC 一致、非消耗、沙盒买/恢复跑通。

### P3 — 内容与其它
- [x] **线上已可真播**：`server/videos/`（1~5.mp4, 56M）+ `covers/poster-1~5.jpg` 已 scp 到 `43.129.30.172:/opt/evareel-server`，`evashort`(pm2) 已重启；本机复测 `https://api.haoweimedia.cn/videos/1.mp4` 返回 200 + `Accept-Ranges: bytes`、`/api/videos/1` 正常返回分集 `videoUrl`。2.1「假播放」拒因已消除。
- [ ] 内容扩到 3–5 部（仍须授权），降低"仅 1 部"风险。
- [ ] 服务器启动需 `certs/` 下 Apple 根证书（缺则 `process.exit(1)`）——本次部署 `certs/` 已在服务器就位，无需处理。
- [ ] 密钥历史清理：`git filter-repo` 清掉已推送的旧 ASC Key 历史 + 旧账号改密 + 撤销重建 Key。

---

## 三、CDN 切换方案（已确认可行）
- 路线 A（零代码）：Cloudflare 橙云反代 `api.haoweimedia.cn`，同源缓存 `/videos`、`/covers`。
- 路线 B（规范）：`server.js` 加 `VIDEO_CDN_BASE` 环境变量，`toVideoSummary` 与 detail 返回时把 `poster`/`episodes[].videoUrl` 改写为 CDN 绝对地址；前端 `resolveUrl` 对绝对地址原样透传，无需改动。
- 注意：CDN 须透传 `Range` 并保留 CORS（独立域名时）；审核期须稳定可达。

---

## 四、2026-08-25 审核拒信处置（真实拒因）

> Submission ID: `82bf017d-4eea-4b08-9f5a-3f69aa1a263c`；审核设备 iPad Air 11″(M3)；版本 1.0(32)。
> 以下为 Apple 实际给出的四条拒因与逐条处置。

| 拒因 | 根因 | 负责人 | 状态 |
|------|------|--------|------|
| **2.1(b)** App Completeness — IAP 未送审 | ASC 中 `2.99` 未提交审核，App 却引用 Premium | 用户（ASC 控制台） | ⏳ 待操作 |
| **2.3.6** Accurate Metadata — 年龄分级 | 分级勾了 In-App Controls/年龄保证，但 App 无此功能 | 用户（ASC 控制台） | ⏳ 待操作 |
| **2.3.3** Accurate Metadata — 截图不实 | 截图为旧阅读 App(shelf/reader)，且缺 13″ iPad | 用户截图 + 我辅助 | ⏳ 待重截 |
| **5.2.3** Legal: IP — Audio/Video | 缺内容权利书面证据 | 用户核验 + 我起草 | ⏳ 待附证据 |

### 2.1(b) IAP 送审（阻塞项，须先做）
- ASC → 功能 → App 内购买项目：确认商品 ID `2.99`、非消耗型、状态已提交；上传 **IAP 审核截图**（展示 Premium 弹窗/购买页）。
- 版本页勾选 `2.99` 为本次包含 IAP → **重新提交构建**（版本号 +1：1.0(32)→1.0(33)）。
- 沙盒实购须能解锁（`server.js` SANDBOX 验签链路须通）。代码侧 `iap.js:5` `VIP_PRODUCT_ID='2.99'` 已对齐。

### 2.3.6 年龄分级改 None
- ASC → App 信息 → 年龄分级 → 编辑：家长控制=否、年龄保证=否、不受限网页访问=否、用户生成内容=否、社交媒体=否、信息和聊天=否、广告=否。
- 使「App 内控件」整体=否，与实际无家长控制/年龄验证一致，即闭合 2.3.6。

### 2.3.3 重截真实截图
- 现有 `mytool/assets/screenshots/` 为旧 `shelf/reader` 图，须替换。需截：首页信息流（真实短剧封面）、播放器真播帧、详情/发现页。
- **必须含 13 英寸 iPad**（拒信特指）。我可出截图清单，像素需用户真机截后传 ASC。

### 5.2.3 上传授权证据（最关键）
- 上传位置：ASC → App 审核信息 → 备注/附件，附 `legal/授权书_火华短剧.pdf`。
- 授权书须明示：① 朋友为著作权人/已获权 ② 授予 App 内流媒体播放/展示 ③ 授予编目/发现/分类展示 ④ 授予转码压缩 ⑤ 授予收费(IAP VIP) ⑥ 全球、运营期内 ⑦ 涵盖肖像/演员权与视频内 BGM/配乐权。
- Notes 文字说明：内容为朋友原创授权、由自有后端 `api.haoweimedia.cn` 提供，非第三方抓取。
- ⚠️ 若 PDF 条款不足，需朋友按 `legal/授权书_模板.md`（待我起草）重签。

---

## 五、当前已知风险
1. ~~后端未确认在线 → 审核员可能看不到真实播放~~ **已解决**：视频已部署且 `/videos/1.mp4` 返回 200 + `Accept-Ranges`。
2. 仅 1 部内容 + 无书面授权 → 5.2 风险（授权书原件已在 `legal/`，待人工核验条款）。
3. 隐私政策未部署 https、营养标签未填。
4. 密钥仍存在于 git 历史（已推送旧提交）。
5. CDN 尚未配置（当前直连源站，审核拉流可能偏慢；可选优化，非拒因）。
