# iOS 开发 / 上架 全流程操作手册

> 适用项目：`E:\Tools\ios\IOS_IPA\mytool`（EvaReel，Expo SDK 57，React Native 0.86）
> 本手册是 iOS 开发的唯一操作依据：从零到上架、日常迭代、TestFlight 测试、内购接入，以及各种异常情况的归因与处理。
> 最后更新：2026-08-10（首包已上传 TestFlight ✅）

---

## 目录

1. [项目速查表（所有 ID / Key）](#一项目速查表所有-id--key)
2. [前置准备](#二前置准备)
3. [注册 Bundle ID](#三注册-bundle-id)
4. [App Store Connect 创建 App](#四app-store-connect-创建-app)
5. [创建 API Key](#五创建-api-key)
6. [本地配置（app.json / eas.json）](#六本地配置appjson--easjson)
7. [构建流程（preview 真机 / production 上传）](#七构建流程preview-真机--production-上传)
8. [TestFlight 测试](#八testflight-测试)
9. [提交审核](#九提交审核)
10. [接入 iOS 内购（IAP）](#十接入-ios-内购iap)
11. [日常迭代流程（改代码 → 发新版）](#十一日常迭代流程改代码--发新版)
12. [异常情况归因与处理（FAQ / 排障）](#十二异常情况归因与处理faq--排障)
13. [保密与安全](#十三保密与安全)

---

## 一、项目速查表（所有 ID / Key）

### 1.1 账号体系（三个独立账号）

| 账号 | 归属 | 作用 | 状态 |
|------|------|------|------|
| Expo 账号（wongkuin） | expo.dev | 云端构建 EAS | ✅ 已登录 |
| Apple 开发者账号 `vuthingocnga9798@icloud.com`（$99/年） | developer.apple.com | 签名、Bundle ID、证书 | ✅ 已注册，团队 Van Nam Nguyen |
| App Store Connect | appstoreconnect.apple.com | App 管理、TestFlight、上架 | ✅ 已注册 |

> 三者为独立体系，互相没有绑定关系。Expo 只负责云端打包，Apple 账号负责签名与上传。

### 1.2 本项目所有 ID

| # | 名称 | 值 | 保密性 |
|---|------|----|--------|
| 1 | EAS 项目名（slug） | `evareel` | 公开 |
| 2 | EAS projectId | `a49f46cd-54e1-4dbd-b1f6-fc8c615cb4c3` | 公开 |
| 3 | App 显示名 | `EvaReel`（app.json `name`） | 公开 |
| 4 | Bundle ID | `com.mytool.booksreader` | 公开 |
| 5 | Team ID | `D5VA6Q22PL`（Van Nam Nguyen，Individual） | 半公开 |
| 6 | ASC App ID | `6799368982` | 半公开 |
| 7 | ASC API Key ID | `74AU6WRUF9` | 🔒 保密 |
| 8 | ASC API Issuer ID | `ac9f4281-658a-4b96-8a40-cebf371c26de` | 🔒 保密 |
| 9 | .p8 私钥 | `keys/AuthKey_74AU6WRUF9.p8` | 🔒 严禁外泄 |
| 10 | SKU | `BooksReader123456789` | 半公开 |
| 11 | Apple 账号 | `vuthingocnga9798@icloud.com`（登录密码 + 2FA，存 `keys/apple-dev.txt`） | 🔒 保密 |
| 12 | 分发证书 Serial | `72D0AB8AB168ECDA152CE709FF40803B`（2027-08-08 到期） | 半公开 |

> 🔒 第 7/8/9 项为 API Key 三件套，泄露后任何拿到 .p8 的人都能上传/管理你的 App。已加入 `.gitignore`，严禁提交 git、严禁外发。

### 1.3 构建档位说明

| 档位 | profile | 用途 | 可否上 TestFlight |
|------|---------|------|-------------------|
| 真机调试 | `preview` | 内部测试、IAP 沙盒测试 | ❌ 不行（internal 分发） |
| 上架包 | `production` | TestFlight + 提交审核 | ✅ 必须用它 |

---

## 二、前置准备

| 项目 | 说明 | 状态 |
|------|------|------|
| Apple Developer 账号 | $99/年，[developer.apple.com](https://developer.apple.com) | ✅ |
| Expo 账号 | wongkuin，已登录 | ✅ |
| EAS 免费额度 | 每月 15 次 iOS 构建（失败不消耗），自然月重置 | ✅ |
| eas-cli | 项目内已装 `eas-cli@21.7.0` | ✅ |
| expo-doctor | 通过 | ✅ |

> ⚠️ **Windows 无法本地打 iOS 包**，必须用 EAS 云端构建（macOS + Xcode 才可本地打包）。

---

## 三、注册 Bundle ID

1. 登录 [developer.apple.com](https://developer.apple.com) → **证书、标识符与描述文件**
2. 点击 **标识符（Identifiers）** → 左上角 **「+」**
3. 选择 **App IDs** → 继续
4. 描述填写 `EvaReel` → Bundle ID 选择 **Explicit** → 输入：`com.mytool.booksreader`
5. 勾选 Capability：**In-App Purchase**（接入 IAP 必须）
6. 注册完成后确认状态为 **Enabled**

> 本项目已注册完成，无需重复操作。新项目需照此执行。

---

## 四、App Store Connect 创建 App

链接：**https://appstoreconnect.apple.com**

### 4.1 签署协议（不签无法上传）
- 进入 **「协议、税务和银行业务」** → 接受 **「付费 App 协议」**（免费 App 也必须签）
- 若卖钱，还需填写税务 + 银行信息

### 4.2 新建 App
1. **我的 App** → 左上角 **「+」→「新建 App」**
2. 填写：
   | 字段 | 值 |
   |------|-----|
   | 平台 | iOS |
   | 名称 | EvaReel |
   | 主语言 | 简体中文 |
   | Bundle ID | `com.mytool.booksreader` |
   | SKU | `BooksReader123456789`（唯一字符串即可） |
3. 点创建后进入 App 详情页

### 4.3 获取 ASC App ID
- App 详情页上方显示的 **「Apple ID」（纯数字）** 即 **ASC App ID** → 本项目为 `6799368982`
- 记录备用，填入 `eas.json` 的 `ascAppId`

---

## 五、创建 API Key

链接：**https://appstoreconnect.apple.com/access/api**

1. 若提示无权限：让账号拥有者在 **「用户和访问」** 中将你的角色提升为 **App Manager 或 Admin**
2. 点 **「+」** → 访问权限选 **App Store Connect API** → 命名随意（如 `eas-upload`）→ 生成
3. 生成后获得三样凭证（⚠️ 均为敏感信息，严禁外泄/传 git）：
   - **Key ID**（10 位，本项目 `74AU6WRUF9`）
   - **Issuer ID**（36 位 UUID，本项目 `ac9f4281-658a-4b96-8a40-cebf371c26de`）
   - **.p8 私钥文件**（只可下载一次，务必立即保存到安全位置，本项目放 `E:\Tools\ios\IOS_IPA\keys\`）

> `.gitignore` 已包含 `*.p8`、`*.p12`、`*.key`、`*.mobileprovision`，防误提交。

---

## 六、本地配置（app.json / eas.json）

### 6.1 app.json（`mytool/app.json`）

```json
{
  "expo": {
    "name": "EvaReel",
    "slug": "evareel",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.mytool.booksreader",
      "buildNumber": "1",
      "infoPlist": { "ITSAppUsesNonExemptEncryption": false }
    },
    "android": { "package": "com.mytool.booksreader" },
    "plugins": ["expo-iap"],
    "extra": { "eas": { "projectId": "a49f46cd-54e1-4dbd-b1f6-fc8c615cb4c3" } },
    "owner": "wongkuin"
  }
}
```

要点：
- `bundleIdentifier` 必须与 Apple 注册的完全一致
- `ITSAppUsesNonExemptEncryption: false`：声明无加密，可跳过出口合规问卷
- `plugins: ["expo-iap"]`：IAP 原生模块（**Expo Go 不支持，必须真机构建测试**）

### 6.2 eas.json（`mytool/eas.json`）

```json
{
  "cli": { "version": ">= 16.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "buildConfiguration": "Release" }
    },
    "production": {
      "autoIncrement": true,
      "ios": { "buildConfiguration": "Release" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "6799368982",
        "ascApiKeyId": "74AU6WRUF9",
        "ascApiKeyIssuerId": "ac9f4281-658a-4b96-8a40-cebf371c26de",
        "ascApiKeyPath": "../keys/AuthKey_74AU6WRUF9.p8"
      }
    }
  }
}
```

要点：
- `autoIncrement: true`：每次 production 构建自动递增 buildNumber，TestFlight 不接受相同版本号重复上传
- submit 用 API Key（推荐，比 appleId+密码安全）；**不要**把 .p8 提交进 git

---

## 七、构建流程（preview 真机 / production 上传）

> ⚠️ **不要用 preview 包传 TestFlight**——preview 是 internal 分发（adhoc 签名），App Store Connect 会拒绝。

### 7.1 真机调试包（preview）

```bash
cd E:\Tools\ios\IOS_IPA\mytool
npx eas login                                  # 已登录可跳过
npx eas build --platform ios --profile preview --message "真机调试 vX"
```

- 构建完成会给下载链接（.ipa），可用爱思助手等安装到真机
- 适合：功能自测、IAP 沙盒测试
- 免费额度内约 10-20 分钟

### 7.2 上架包（production）→ 上传 TestFlight

```bash
cd E:\Tools\ios\IOS_IPA\mytool
npm run build:ios         # = eas build --platform ios --profile production
npm run submit:ios        # = eas submit --platform ios --profile production
```

或一条命令构建完自动上传：

```bash
npx eas build --platform ios --profile production --auto-submit
```

上传完成后进入 App Store Connect → **TestFlight** 页即可看到构建版本。

### 7.3 ⚠️ 首次构建必读（证书配置交互）

首次 production 构建需要创建**分发证书 + 描述文件**，必须**在你的终端里交互式运行**（非交互模式会直接失败）：

```bash
npx eas build --platform ios --profile production
```

交互应答要点（2026-08-10 实战验证）：

| 提示 | 应答 |
|------|------|
| Do you want to log in to your Apple account? | `yes` |
| Apple ID | `vuthingocnga9798@icloud.com` |
| Password | **输入账号真实登录密码**（⚠️ 不是 App 专用密码！） |
| 2FA 验证码（6 位） | 输手机收到的验证码 |
| Reuse this distribution certificate? | `Y`（复用已有证书，本项目已有 72D0AB8A…） |
| Generate a new Apple Provisioning Profile? | `Y`（首次必选，之后复用） |

> ⚠️ **密码大坑**：`EXPO_APPLE_APP_SPECIFIC_PASSWORD`（App 专用密码）**只用于 `eas submit` 上传**，**不用于证书认证**。构建登录必须用**账号真实密码 + 2FA 验证码**，否则一直报 `Invalid username and password combination`。

> ✅ 证书配置一次后保存在 EAS 服务器，**以后构建无需再交互**，直接 `npm run build:ios` 即可。

---

## 八、TestFlight 测试

### 8.1 内部测试（≤100 人，免审核，推荐自测）
1. App Store Connect → 你的 App → **TestFlight** → **内部测试** → 新建群组
2. 添加测试员：**直接填自己 iPhone 上日常使用的 Apple ID 邮箱**（免费普通账号即可，与开发者账号无关）
3. iPhone 安装 **TestFlight** App → 登录**同一个 Apple ID** → 接受测试 → 安装

> ✅ **推荐直接用自己 iPhone 的日常 Apple ID 当测试员**：一次添加,以后每发新版自动收到更新,不用换号、不用维护第二个账号。

### 8.2 外部测试（≤10000 人，首次需 Beta 审核）
- 适合发给外部朋友，首次审核约 1-2 天，通过后无需再审核

### 8.3 测试员要求
| 项 | 要求 |
|----|------|
| Apple ID | 任何免费账号，无需开发者账号；**推荐直接用自己 iPhone 的日常 Apple ID** |
| 设备 | iPhone/iPad 均可 |
| TestFlight App | 必须从 App Store 安装 |

### 8.4 其他测试方式对比
| 方式 | 适用 | 限制 |
|------|------|------|
| preview 包侧载（爱思助手/Sideloadly） | 快速真机验证 | 免费 Apple ID 7 天过期重签 |
| Expo Go | 纯前端快速预览 | 不支持原生模块（IAP 等） |
| 开发版构建（expo-dev-client） | 日常调试热更新 | 需信任开发者证书 |

---

## 九、提交审核

1. 商店信息、五图、隐私政策全部填好（见下表）
2. 版本页 → 选择已上传的构建版本（用 production 包）
3. 点 **「添加以供审核」**
4. 审核周期一般 1-3 天，可随时在 App Store Connect 查看状态

### 9.1 商店信息必填项

| 字段 | 建议内容 |
|------|---------|
| 副标题 | 简洁一句话 |
| 描述 | 详细介绍功能（短剧播放、解锁等） |
| 关键词 | ≤100 字符，逗号分隔 |
| 类别 | 娱乐/图书等 |
| 年龄分级 | 按问卷填写 |
| 隐私政策 URL | **必须可访问的 https 网页**，收集任何数据都要提供 |

### 9.2 五图要求
| 截图 | 尺寸 | 必传 |
|------|------|------|
| 6.7 英寸 iPhone | 1290×2796 | ✅ 必传 |
| 6.5 英寸 iPhone | 1242×2688 | ✅ 必传 |
| 6.1 英寸 iPhone | 1206×2622 | 可选 |
| 5.5 英寸 iPhone | 1242×2208 | 可选 |
| iPad | 按需 | supportsTablet=true 建议提供 |

- 每屏 5-10 张，建议 5 张起；格式 JPG/PNG；不能带设备边框；必须真实界面截图
- 截图需在 App Store Connect 上传页内按设备尺寸重新生成（旧书架截图已清理，需用短剧 App 真实界面）

### 9.3 App 图标
- 1024×1024 无圆角 PNG（`mytool/assets/icon.png`）

---

## 十、接入 iOS 内购（IAP）

### 10.1 产品配置（App Store Connect）
1. 确认已签「付费 App 协议」+ 税务/银行信息
2. App 详情页 → **功能 → App 内购买项目** → 创建商品
3. 建沙盒测试账号：**用户和访问 → 沙盒 → 测试者**（新建测试 Apple ID）

**本项目已定商品**（代码已按此 ID 实现）：

| 字段 | 值 |
|------|-----|
| 类型 | 非消耗型（Non-Consumable，一次购买永久有效） |
| 参考名称 | 解锁全部短剧视频 |
| 产品 ID | `vip.unlock.video` |
| 价格 | ¥1 最低档（中国区最低 ¥1，美区最低 $0.99） |
| 本地化 | 简体中文 |
| 可用地区 | **排除中国大陆**（购买范围为除中国大陆外的 App Store 地区） |

> 商品创建后处于「准备提交」即可用于沙盒测试，无需等审核。

### 10.2 代码位置
- `mytool/App.js`：页签/付费墙/购买/恢复购买
- `mytool/src/iap.js`：产品 ID 与解锁持久化

### 10.3 沙盒测试流程（⚠️ 必须真机 + preview 构建）
1. `npx eas build --platform ios --profile preview` 装到真机
2. 真机「设置 → App Store」退出登录，改用**沙盒测试员账号**登录
3. 打开 App 点购买 → 出现「沙盒环境」确认框 → 确认 → **模拟支付，不产生真实扣费**
4. 测试恢复购买：卸载重装后点「恢复购买」应恢复解锁
5. 正式上线后价格才会真实扣款

> 模拟器、Expo Go 都无法测试 IAP。

### 10.4 服务器（收据验证）
| 场景 | 是否需要服务器 |
|------|--------------|
| 一次性小额购买（¥1）、测试期 | 纯客户端可行（有被刷风险，低价下风险低） |
| 订阅/正式上线 | **建议**：后端调 Apple App Store Server API 验证收据 + 处理订阅通知 |

- 当前项目纯前端，无需服务器；后续可用 Vercel/Cloudflare Workers 免费 Serverless
- 推荐流程：客户端拿收据 → 后端调 Apple 接口验证 → 解锁功能

---

## 十一、日常迭代流程（改代码 → 发新版）

```bash
cd E:\Tools\ios\IOS_IPA\mytool
# 1. 改代码（App.js / src/*）

# 2. 本地快速检查
npx expo-doctor                    # 依赖健康检查

# 3. 提交 git（勿提交 keys/、.p8、node_modules）
git add -A
git commit -m "feat: xxx"
git push

# 4. 真机验证（可选）
npx eas build --platform ios --profile preview

# 5. 发新 TestFlight 版本
npm run build:ios                  # autoIncrement 自动 +1 buildNumber（证书已配好，无需交互）
npm run submit:ios                 # 上传（若提示选择构建：npx eas submit --platform ios --profile production --id <构建ID> --non-interactive）
# 6. App Store Connect → TestFlight 等待处理完成（5-10 分钟）→ 测试员自动收到新版本 → 测试
```

> ⚠️ 新代码必须经过 TestFlight 全流程验证后才能提审，避免「空壳应用」「功能不可用」被拒。

---

## 十二、异常情况归因与处理（FAQ / 排障）

### 12.1 构建类

| 现象 | 原因 | 处理 |
|------|------|------|
| `eas build` 报登录失效 | Expo 登录过期 | `npx eas login` 重新登录 |
| 构建失败不扣额度 | EAS 机制 | 直接重试即可 |
| 构建成功但无法安装 | 证书/设备未加入 adhoc 描述文件 | preview 构建时确认设备 UDID 已登记（EAS 会引导） |
| 上传时提示版本号已存在 | buildNumber 未递增 | 用 `autoIncrement: true` 或手动改 app.json `buildNumber` |
| `Credentials are not set up. Run in interactive mode` | 首次构建需创建证书 | **必须在你自己的终端交互运行** `eas build --profile production`（见 7.3） |
| Apple 登录报 `Invalid username and password combination` | ① 密码用了 App 专用密码（仅 submit 用）② 账号不对 | 用**账号真实密码** + 2FA 验证码；核对 Apple ID=`vuthingocnga9798@icloud.com` |
| 构建提示复用证书/描述文件 | 已生成过 | 直接 `Y` 复用，勿重复生成 |

### 12.2 上传/提交类

| 现象 | 原因 | 处理 |
|------|------|------|
| `eas submit` 报 401/403 | API Key 无效或权限不足 | 检查 Key ID/Issuer/.p8 是否一致；ASC 账号需 App Manager/Admin 角色 |
| `eas submit` 提示 `What would you like to submit?` | 交互提示选择构建 | 加 `--id <构建ID>` + `--non-interactive`，或先 `npm run build:ios` 再 `npm run submit:ios` |
| 上传提示 App 不存在 | `ascAppId` 填错，或 Bundle ID 与 ASC 中 App 不匹配 | 核对 `ascAppId=6799368982`、Bundle ID=`com.mytool.booksreader` |
| 上传被拒（preview 包） | internal 分发不能传 TestFlight | 必须用 production profile 重新构建 |
| 上传后 TestFlight 看不到 | 处理中（一般几分钟~1小时） | 等状态变「已处理」；过久则看邮件/构建日志 |
| 隐私合规问卷弹窗 | 出口合规 | `ITSAppUsesNonExemptEncryption: false` 可跳过 |

### 12.3 签名/证书类

| 现象 | 原因 | 处理 |
|------|------|------|
| 证书相关报错 | 描述文件过期/失效 | EAS 构建时选择自动管理证书（推荐） |
| 真机安装提示无法验证开发者 | 未信任证书 | 设置 → 通用 → VPN与设备管理 → 信任 |
| adhoc 包设备装不上 | UDID 未注册 | 在 Apple 开发者后台把设备 UDID 加入描述文件 |

### 12.4 审核类

| 现象 | 原因 | 处理 |
|------|------|------|
| 以「空壳应用」被拒 | 无真实内容/演示数据 | 接入真实数据源、真实可用的功能再提审 |
| 隐私政策缺失被拒 | 收集数据未声明 | 提供可访问的 https 隐私政策页 |
| 功能不可用被拒 | 提审包有 bug | 严格走 TestFlight 验证后提审 |
| IAP 被拒 | 商品/沙盒未配置好 | 按第 10 节完整配置后再提审 |

### 12.5 IAP 类

| 现象 | 原因 | 处理 |
|------|------|------|
| 点购买无反应 | Expo Go/模拟器不支持 | 必须真机 + preview 构建 |
| 提示「无法连接 App Store」 | 沙盒账号未正确登录 | 设置 → App Store 退出，用沙盒测试员账号登录 |
| 恢复购买不生效 | 收据/解锁逻辑问题 | 检查 `src/iap.js` 持久化逻辑 |
| 找不到商品 | 商品未创建或状态不对 | 确认产品 ID=`vip.unlock.video`，状态为「准备提交」及以上 |

### 12.6 其他

| 现象 | 原因 | 处理 |
|------|------|------|
| TestFlight 测试员收不到邀请 | 邮箱未验证/未装 TestFlight | 确认该 Apple ID 验证过邮箱，iPhone 装 TestFlight |
| 免费额度用完 | 每月 15 次 iOS 构建 | 等自然月重置，或升级 EAS 计划 |
| Windows 本地打包失败 | 平台限制 | 一律走 EAS 云端构建 |
| `npm install` 版本冲突 | 依赖锁定 | 用项目内 `package-lock.json`，勿全局装 |

---

## 十三、保密与安全

1. **API Key 三件套**（Key ID / Issuer / .p8）= 你的上传身份证，泄露即失控
2. 已加入 `.gitignore`：`*.p8`、`*.p12`、`*.key`、`*.mobileprovision`、`keys/`
3. `keys/AuthKey_74AU6WRUF9.p8`、`keys/apple-dev.txt`（含 Apple 登录密码/App 专用密码）只可放本机，备份到私人存储，勿发任何人
4. 若怀疑泄露：立即在 App Store Connect → 访问 → API Keys 中**撤销并重建**
5. 沙盒测试账号密码无需保密，但不能用于真实购买测试

---

## 附：常用命令速查

```bash
# 构建
npx eas build --platform ios --profile preview     # 真机调试包
npm run build:ios                                  # production 上架包
npx eas build --platform ios --profile production --auto-submit   # 构建+上传一步
npm run submit:ios                                 # 上传已构建的包
npx eas build:list --platform ios                  # 查看历史构建

# 登录/诊断
npx eas login
npx eas whoami
npx expo-doctor
```
