# iOS 上架全流程操作手册

> 适用项目：`E:\Tools\ios\mytool`（书籍阅读，Expo SDK 57）
> 本文档记录从零到上架 App Store 的完整操作步骤、所需 Key/ID 清单及注意事项。

---

## 目录

1. [前置准备](#一前置准备)
2. [注册 Bundle ID](#二注册-bundle-id)
3. [App Store Connect 创建 App](#三app-store-connect-创建-app)
4. [创建 API Key](#四创建-api-key)
5. [填写商店信息（素材/五图/隐私政策）](#五填写商店信息素材五图隐私政策)
6. [配置 eas.json 并构建上传](#六配置-easjson-并构建上传)
7. [TestFlight 测试](#七testflight-测试)
8. [提交审核](#八提交审核)
9. [接入 iOS 内购（IAP）](#九接入-ios-内购iap)
10. [所需 Key / ID 速查表](#十所需-key--id-速查表)
11. [常见问题（FAQ）](#十一常见问题faq)

---

## 一、前置准备

| 项目 | 说明 | 状态 |
|------|------|------|
| Apple Developer 账号 | $99/年，[developer.apple.com](https://developer.apple.com) 注册 | 需自行注册 |
| Expo 账号 | 已创建并登录（wongkuin），用于 EAS 云端构建 | ✅ 已完成 |
| EAS 免费额度 | 每月 15 次 iOS 构建 + 15 次 Android 构建，自然月重置 | ✅ 已了解 |
| 项目配置 | `app.json` 已配好名称「书籍阅读」、Bundle ID | ✅ 已完成 |
| eas-cli | 已全局安装 21.7.0，`expo-doctor` 20/20 通过 | ✅ 已完成 |

> ⚠️ Expo 账号与 Apple 开发者账号相互独立，不一致没有影响：
> - Expo 账号：只负责云端构建
> - Apple 账号：负责签名与上传

---

## 二、注册 Bundle ID

虽然 EAS 构建时可选自动注册，但建议提前手动注册：

1. 登录 [developer.apple.com](https://developer.apple.com) → **证书、标识符与描述文件**
2. 点击 **标识符（Identifiers）** → 左上角 **「+」**
3. 选择 **App IDs** → 继续
4. 描述填写 `BooksReader` → Bundle ID 选择 **Explicit** → 输入：`com.mytool.booksreader`
5. 勾选需要的 Capability（目前无需额外勾选；后续接入 IAP 需勾选 **In-App Purchase**）
6. 注册完成后确认状态为 **Enabled**

---

## 三、App Store Connect 创建 App

链接：**https://appstoreconnect.apple.com**

### 3.1 签署协议（不签无法上传）
- 进入 **「协议、税务和银行业务」** → 接受 **「付费 App 协议」**（免费 App 也必须签）
- 未来若卖钱，还需填写税务 + 银行信息

### 3.2 新建 App
1. **我的 App** → 左上角 **「+」→「新建 App」**
2. 填写：
   | 字段 | 值 |
   |------|-----|
   | 平台 | iOS |
   | 名称 | 书籍阅读 |
   | 主语言 | 简体中文 |
   | Bundle ID | `com.mytool.booksreader` |
   | SKU | `booksreader001`（唯一字符串即可） |
3. 点创建后进入 App 详情页

### 3.3 获取 ASC App ID
- App 详情页上方显示的 **「Apple ID」**（纯数字）即 **ASC App ID**
- 记录备用，将填入 `eas.json` 的 `ascAppId`

---

## 四、创建 API Key

链接：**https://appstoreconnect.apple.com/access/api**

1. 若提示无权限：让账号拥有者在 **「用户和访问」** 中将你的角色提升为 **App Manager 或 Admin**
2. 点 **「+」** → 访问权限选 **App Store Connect API** → 命名随意（如 `eas-upload`）→ 生成
3. 生成后获得三样凭证（⚠️ 均为敏感信息，严禁外泄/传 git）：
   - **Key ID**（10 位，如 `2X9R4HXF34`）
   - **Issuer ID**（36 位 UUID）
   - **.p8 私钥文件**（只可下载一次，务必立即保存到安全位置，建议放 `E:\Tools\ios\keys\`）

> `.gitignore` 已包含 `*.p8`、`*.p12`、`*.key`、`*.mobileprovision`，可防误提交。

---

## 五、填写商店信息（素材/五图/隐私政策）

### 5.1 App 信息页
| 字段 | 建议内容 |
|------|---------|
| 副标题 | 简洁一句话（如：阅读文化，滋养心灵） |
| 描述 | 详细介绍功能：书架、阅读器、文化内容等 |
| 关键词 | 如：书籍,阅读,小说,文化,电子书（逗号分隔，≤100 字符） |
| 类别 | 图书 |
| 年龄分级 | 按问卷填写 |
| 隐私政策 URL | **必须可访问的网页**，App 收集任何数据都要提供 |

### 5.2 版本页（五图）
| 截图 | 尺寸 | 必传 |
|------|------|------|
| 6.7 英寸 iPhone | 1290×2796 | ✅ 必传 |
| 6.5 英寸 iPhone | 1242×2688 | ✅ 必传 |
| 6.1 英寸 iPhone | 1206×2622 | 可选 |
| 5.5 英寸 iPhone | 1242×2208 | 可选 |
| iPad | 按需 | 若 supportsTablet=true 建议提供 |

- 每张 5-10 张，建议 5 张起（用户常说的「五图」）
- 格式：JPG 或 PNG，不能带设备边框，不能用模板图
- 截取自 App 真实界面（书架页、阅读页等）

### 5.3 App 图标
- 1024×1024 无圆角 PNG（`assets/icon.png`，目前为模板图，**上架前必须替换**）

---

## 六、配置 eas.json 并构建上传

### 6.1 修改 eas.json（替换占位符）

`E:\Tools\ios\mytool\eas.json`：

```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "production": {
      "autoIncrement": true,
      "ios": { "buildConfiguration": "Release" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "你的开发者账号邮箱",
        "ascAppId": "你的 ASC App ID（数字）",
        "appleTeamId": "你的 Team ID（10位）"
      }
    }
  }
}
```

> API Key（Key ID / Issuer ID / .p8）建议用环境变量传入，避免写进文件：
> `EXPO_APPLE_API_KEY_ID`、`EXPO_APPLE_API_ISSUER_ID`、`EXPO_APPLE_API_KEY_PATH`

### 6.2 构建（Windows 云端打包）

```bash
cd E:\Tools\ios\mytool
npx eas login                 # 已登录可跳过
npm run build:ios             # 云端构建 ipa（约 10-20 分钟，免费额度内）
```

> 若未手动注册 Bundle ID，构建时选择自动注册即可。

### 6.3 上传 TestFlight

```bash
npm run submit:ios
```

上传完成后进入 App Store Connect → **TestFlight** 页即可看到构建版本。

---

## 七、TestFlight 测试

### 内部测试（≤100 人，免审核，推荐自测）
1. TestFlight 页 → **内部测试** → 新建群组
2. 添加测试员：**自己的 Apple ID**（可以是免费普通账号，与开发者账号无关）
3. iPhone 安装 **TestFlight** App → 登录同一 Apple ID → 接受测试

### 外部测试（≤10000 人，首次需 Beta 审核）
- 适合发给外部朋友，首次审核约 1-2 天

### 其他测试方式（补充）
| 方式 | 适用 | 限制 |
|------|------|------|
| 开发版构建（expo-dev-client） | 日常调试，热更新 | 需信任开发者证书 |
| 侧载 ipa（爱思助手/Sideloadly） | 快速真机验证 | 免费 Apple ID 7 天过期重签 |
| Expo Go | 纯前端快速预览 | 不支持原生模块（IAP 等） |

---

## 八、提交审核

1. 商店信息、五图、隐私政策全部填好
2. 版本页 → 选择已上传的构建版本（处理完 TestFlight 测试后）
3. 点 **「添加以供审核」**
4. 审核周期一般 1-3 天，可随时在 App Store Connect 查看状态

> ⚠️ 审核注意：
> - App 目前是演示数据，上架前必须接入真实书籍数据源，否则以「空壳应用」被拒
> - 若含第三方内容，需准备版权相关说明

---

## 九、接入 iOS 内购（IAP）

### 9.1 产品配置（App Store Connect）
1. 确认已签「付费 App 协议」+ 税务/银行信息
2. App 详情页 → **功能 → App 内购买项目** → 创建商品（唯一 Product ID）
3. 设置好沙盒测试账号：**用户和访问 → 沙盒 → 测试者**（新建测试 Apple ID）

### 9.2 代码接入
- 推荐库：`react-native-iap`（OpenIAP 规范，支持 StoreKit 2，Expo 需开发版构建）
- 需要配置 StoreKit capability（在 Bundle ID 中勾选 In-App Purchase）
- ⚠️ IAP 必须真机测试（模拟器不行），用沙盒账号

### 9.3 服务器（收据验证，当前阶段说明）
| 场景 | 是否需要服务器 |
|------|--------------|
| 一次性小额购买、测试期 | 纯客户端可行（有被刷风险） |
| 订阅/正式上线 | **建议**：后端调 Apple App Store Server API 验证收据 + 处理订阅通知 |

- 当前项目 **纯前端**，无需服务器；后续需要时可用 Vercel/Cloudflare Workers 免费 Serverless 方案，无需购买服务器
- 推荐流程：客户端拿收据 → 发送到后端 → 后端调 Apple 接口验证 → 验证通过解锁功能

---

## 十、所需 Key / ID 速查表

| # | 名称 | 长什么样 | 获取位置 | 用途 | 保密性 |
|---|------|---------|---------|------|--------|
| 1 | Bundle ID | `com.mytool.booksreader` | 自定义（app.json 已配置） | App 唯一标识 | 公开 |
| 2 | Team ID | 10 位字母数字（如 `ABCDE12345`） | developer.apple.com → 账户 → 会员资格 | 识别开发团队 | 半公开 |
| 3 | ASC App ID | 纯数字（如 `1234567890`） | App Store Connect → App 信息页上方 | `eas.json` 的 `ascAppId` | 半公开 |
| 4 | Key ID | 10 位（如 `2X9R4HXF34`） | appstoreconnect.apple.com/access/api | API 上传身份 | 🔒 保密 |
| 5 | Issuer ID | 36 位 UUID | 同上 | API 上传身份 | 🔒 保密 |
| 6 | .p8 私钥文件 | 下载的文件 | 同上（⚠️ 只可下载一次） | 上传凭证 | 🔒 严禁外泄 |
| 7 | Apple ID 邮箱 | 开发者账号邮箱 | 自己的 | `eas.json` 的 `appleId` | 半公开 |
| 8 | App 图标 | 1024×1024 PNG | 自行设计 | 商店展示 | 公开 |
| 9 | 五图 | 1290×2796 / 1242×2688 | 真实界面截图 | 商店展示 | 公开 |
| 10 | 隐私政策 URL | https 网页链接 | 自行准备 | 审核必需 | 公开 |

> 🔒 第 4/5/6 项为 API Key 三件套，泄露后任何能访问你 .p8 的人都可以上传/管理你的 App。不要提交 git、不要发给任何人。

---

## 十一、常见问题（FAQ）

**Q：Windows 本地能打 iOS 包吗？**
不能，iOS 构建需要 macOS + Xcode。Windows 下用 EAS 云端构建即可。

**Q：Expo 账号和上包账号不一致可以吗？**
可以，Expo 只管构建，Apple 账号管签名上传，两者独立。

**Q：TestFlight 测试者需要开发者账号吗？**
不需要，任何 Apple ID（免费注册）都能接受测试；内部测试需将测试员加入开发者团队成员。

**Q：免费额度够用吗？**
每月 15 次 iOS 构建（失败不消耗），个人开发完全够用。

**Q：测试 IAP 需要什么？**
真机 + 沙盒测试账号，模拟器无法测试内购。

**Q：一定要服务器吗？**
纯前端可以先上架（无 IAP 或简单场景），正式订阅功能建议加免费 Serverless 后端验证收据。
