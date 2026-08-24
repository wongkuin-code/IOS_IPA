# EvaReel 改动快照（Deploy Snapshot）

> 生成时间：2026-08-24
> 范围：真实视频播放（MP4 + nginx 静态分发 + catalog.json）+ EvaReel/EvaShort 服务隔离
> 服务器：HK `43.129.30.172`（OpenCloudOS 9），域名 `api.haoweimedia.cn`（已签 certbot 证书）
> 说明：本快照为本次会话变更的记录，便于复盘与后续部署。

---

## 一、服务器端改动（生产已生效）

### 1. 新增系统用户 `evareel`（隔离用，无登录 shell）
- `useradd -r -s /usr/sbin/nologin -d /opt/evareel-verify-v2 evareel`
- 当前：`uid=992(evareel) gid=992(evareel)`

### 2. 目录归属 `evareel`
| 路径 | 归属 | 用途 |
|---|---|---|
| `/var/www/evareel-videos` | `evareel:evareel` | 视频静态文件 + catalog.json |
| `/opt/evareel-verify-v2` | `evareel:evareel` | EvaReel v2 应用目录 |
| `/usr/local/bin/run-evareel-v2.sh` | `evareel:evareel` | 降级启动 wrapper（见下） |

### 3. 降级启动 wrapper（pm2 7 无 `--uid`，改用 runuser）
- 位置：`/usr/local/bin/run-evareel-v2.sh`（**放在应用目录之外**，避免重新部署覆盖丢失）
- 内容要点：
  ```bash
  #!/bin/bash
  export PORT=3001
  export BUNDLE_ID=com.mytool.booksreader
  export APP_ENV=SANDBOX
  export ALLOWED_PRODUCT_IDS=vip.unlock.video
  exec runuser -u evareel -- /usr/bin/node /opt/evareel-verify-v2/server.js
  ```
- 关键：server.js 默认 `PORT=3000` 与 EvaShort 冲突，必须显式给 `3001`。

### 4. pm2 进程（已 `pm2 save` 持久化）
| pm2 名 | 原意 | 端口 | 运行用户 | 状态 |
|---|---|---|---|---|
| `evashort`（原 `evareel-verify`） | EvaShort 旧应用 | :3000 | root | online |
| `evareel-verify-v2` | **EvaReel v2（本次目标）** | :3001 | **evareel**（经 wrapper） | online |

> 注：pm2 7.0.3 已移除 `rename` 命令，改名用 `delete`+`start --name` 实现；`evashort` 仅为改名，功能/端口不变。

### 5. nginx `/etc/nginx/conf.d/evareel.conf`（已 reload）
`api.haoweimedia.cn` 的 server 块内现有 `/evareel/` 路由：
- `location /evareel/api/verify-iap` → 代理 `127.0.0.1:3001`（EvaReel v2 的 IAP 校验）
- `location /evareel/health` → 代理 `127.0.0.1:3001`
- `location /evareel/videos/` → `alias /var/www/evareel-videos/`；`mp4;` 伪流式、`Accept-Ranges`、`Cache-Control` 长缓存
- `location = /evareel/catalog.json` → `alias /var/www/evareel-videos/catalog.json`；`application/json`，短缓存
- `location /` → 代理 `127.0.0.1:3000`（EvaShort，保持不变）
- `nginx -t` 通过；HTTP→HTTPS 由 certbot 管理（301）。

### 6. 上传的测试资源
- `/var/www/evareel-videos/1/1.mp4`（5.9MB，720×1280，HEVC+AAC，40.9s，已 faststart）
- `/var/www/evareel-videos/catalog.json`：
  ```json
  {
    "baseUrl": "https://api.haoweimedia.cn/evareel/videos",
    "updatedAt": "2026-08-24",
    "dramas": { "1": { "title": "测试短剧 1", "premium": true, "urls": { "1": "/1/1.mp4" } } }
  }
  ```

### 7. SSH 访问
- `deploy@evareel` 公钥已写入 `/root/.ssh/authorized_keys`（1 条）。
- 当前仍允许密码登录——**安全收尾待办**。

---

## 二、本地代码改动（尚未构建/打包）

| 文件 | 状态 | 说明 |
|---|---|---|
| `mytool/src/data/catalog.js` | 新增 | 拉取/解析服务器 catalog.json，按 (dramaId, episode) 解析视频 URL；AsyncStorage 缓存 |
| `mytool/src/screens/PlayerScreen.js` | 重写 | 用 `expo-video` 真实播放：`useVideoPlayer` + `<VideoView nativeControls/>`、付费墙、倍速(`playbackRate`)、重播、自动下一集 |
| `mytool/App.js` | 编辑 | 启动时 `fetchCatalog()` 预热 catalog |
| `mytool/package.json` | 编辑 | 增加 `"expo-video": "~57.0.2"` |
| `mytool/app.json` | 编辑 | `plugins` 增加 `"expo-video"` |
| `mytool/src/iap/iap.js` | 审查（未改） | `VERIFY_API='https://api.haoweimedia.cn/evareel/api/verify-iap'`、`VIP_PRODUCT_ID='vip.unlock.video'`，与服务器一致，无需改动 |
| `server/deploy/nginx-evareel.conf` | 编辑 | 视频分发两段 location + “已并入线上”注释（**注意：本文件为草稿，线上真实配置已含上述路由，以服务器为准**） |
| `server/deploy/catalog.example.json` | 新增 | catalog 样例 |
| `mytool/scripts/prep_video.sh` | 新增 | ffmpeg `-movflags +faststart` 预处理封装 |
| `server/deploy/publish_videos.sh` | 重写 | 支持跳板机/直连（`BASTION`/`SERVER` 环境变量） |
| `server/deploy/isolate_evareel.sh` | 新增/更新 | 建 `evareel` 用户、目录归属、`RESTART_SVC=1` 时以 evareel 重启（wrapper 置于 `/usr/local/bin`） |
| `server/deploy/deploy-evareel-v2.sh` | 编辑 | 头部跳板机说明注释 |
| `_staging/evareel_test_drama1_ep1.mp4` | 新增 | 本地测试视频（已 faststart） |

---

## 三、验证结果

| 验证项 | 命令/路径 | 结果 |
|---|---|---|
| 视频分片拖动 | `curl -H "Range: bytes=0-1023" …/evareel/videos/1/1.mp4` | `206 Partial Content`，`Content-Range: bytes 0-1023/5908045`，`Accept-Ranges: bytes` ✅ |
| 视频全量 | `curl -I …/evareel/videos/1/1.mp4` | `200`，`Content-Length: 5908045`，`video/mp4` ✅ |
| catalog | `curl …/evareel/catalog.json` | 返回正确 JSON ✅ |
| EvaReel v2 健康 | `:3001/health` 与 `/evareel/health` | 均 `200` ✅ |
| EvaReel v2 运行用户 | `ps` | `evareel <pid> node /opt/evareel-verify-v2/server.js` ✅ |
| EvaShort 健康 | `:3000/health` | `200`（改名后无影响）✅ |
| IAP 路由 | `POST /evareel/api/verify-iap` | `400`（端点可达，非 502）✅ |
| HTTP→HTTPS | `http://api.haoweimedia.cn/…` | `301` ✅ |

---

## 四、已知待办 / 未做项

1. **安全收尾（用户要求暂缓）**：关闭 SSH 密码登录、改 root 密码（公钥已就位）。
2. **部署脚本隔离**：`deploy-evareel-v2.sh` 若后续发布直接 `pm2 start server.js`，会以 root 拉起、丢失隔离。建议改为复用 `/usr/local/bin/run-evareel-v2.sh`。
3. **客户端联调**：本地 `catalog.js` 当前指向真实 URL，但客户端代码尚未构建/真机预览验证（需 EAS 云构建 + TestFlight）。
4. **测试视频编码**：当前 `1.mp4` 为 HEVC；正式资源建议 H.264 以最大化兼容。
5. **跳板机**：经确认无需（43.129.30.172 即应用服务器，无独立跳板机）。
