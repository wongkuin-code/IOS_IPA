# EvaShort — 隐私政策（TermsFeed 构建套件）

> 用途：用 TermsFeed 生成 EvaShort 的隐私政策托管链接，彻底不再依赖服务器域名。
> 数据口径已按代码核对（server/server.js、mytool/src/、AuthContext.js、ProfileScreen.js）。
> 生成链接后还需：① 填入 ASC Privacy Policy URL；② 改 App 内两处链接 + 重建（见文末）。

---

## A. TermsFeed 向导逐字段答案（直接照抄）

打开 https://www.termsfeed.com/privacy-policy-generator ，按表填：

| TermsFeed 字段 | EvaShort 答案 |
|---|---|
| App / Website name | `EvaShort` |
| App / Website URL | `https://api.haoweimedia.cn`（App 上架后也可填 App Store 链接） |
| Company / Owner name | **待确认**（填你 Apple Developer 账号的法定名称；个人账号=本人姓名） |
| Contact email | `taoxi110@qq.com` |
| 收集用户个人信息？ | **是** — username、password(仅哈希)、nickname、avatar |
| 收集 email？ | **否**（注册/登录只用 username + password，不收邮箱） |
| 收集财务/支付信息？ | **否直接收集**；IAP 由 Apple StoreKit 处理，Apple 才拿到支付数据 |
| 收集精确位置？ | **否** |
| 收集设备 ID / 广告 ID(IDFA)？ | **否** |
| 自动收集（使用数据）？ | **是** — 观看历史、搜索历史（登录用户存服务端+本地） |
| Cookie / 追踪 / 第三方分析？ | **否** — 无第三方分析/广告/崩溃 SDK，无广告追踪 |
| 用到的第三方服务？ | Apple StoreKit（内购）；自有服务器 api.haoweimedia.cn（账号） |
| 有用户账号？ | **是**（可选；支持游客模式） |
| 儿童/年龄？ | App 评级 13+；不主动向 13 岁以下收集 |
| 提供删除权？ | **是** — App 内 Delete Account 删除服务端数据 |
| 国际数据传输？ | 服务器位于境外，账号数据会跨境传至该服务器处理 |

> ⚠️ 切勿在 TermsFeed 里勾选"我们不收集任何数据"——EvaShort 实际收集 username/密码/观看历史等，那样会重蹈我们刚修掉的 5.1.1 风险。

---

## B. 完整政策正文（英文，可直接用；若 TermsFeed 允许粘自定义文本也可直接贴）

**Privacy Policy for EvaShort**

*Last updated: 2026-08-31*

**1. Introduction**
EvaShort (the "App", "we", "us") is a short-drama streaming application. This policy explains what information we collect, why, and the choices you have. By using EvaShort you agree to the practices described here.

**2. Information We Collect**

*2.1 Information you provide*
- Account data: when you create a free account we collect a username, a password (stored only as a salted scrypt hash — we never store your password in plain text), an optional display nickname, and an optional avatar.
- We do NOT collect your email address. Registration and login use only username and password.
- Purchase records: if you unlock VIP, Apple processes the payment through StoreKit. We record only the transaction identifier on our server to prevent duplicate unlock (anti-replay). We never receive or store your credit card or Apple payment details.

*2.2 Information collected automatically*
- Watch history and search history: if you are signed in, these are stored on our server tied to your account so they follow you across devices. They are also cached in local device storage.
- Saved list (bookmarked dramas): stored on our server for account users and locally on device.

*2.3 Information we do NOT collect*
- We do not collect your email, phone number, precise location, contacts, photos, or any advertising identifier (IDFA).
- We do not use any third-party analytics, advertising, or crash-reporting SDKs. The only external service is Apple StoreKit (payments) and our own server.

**3. How We Use Information**
- To create and secure your account (login and password verification).
- To sync your saved list, watch history, and search history across devices.
- To validate and restore your VIP unlock.
- We do NOT use your data for advertising or cross-app tracking.

**4. Sharing of Information**
- We do not sell your personal information.
- Payment handling is performed by Apple; Apple receives the payment data necessary to process your purchase.
- We share data only with our own server infrastructure needed to operate the App.

**5. Data Storage and Security**
- Passwords are protected with scrypt key derivation plus a unique salt.
- All traffic between the App and our server uses HTTPS.
- We retain account data for as long as your account exists; you may delete it at any time (see Section 7).

**6. Children's Privacy**
EvaShort is rated 13+ and is not directed to children under 13. We do not knowingly collect personal information from users under 13. If you believe a child under 13 has provided us data, contact us and we will delete it.

**7. Your Rights and Choices**
- Access / correct: you can view and edit your nickname and avatar in the App.
- Delete your account: use Profile → Delete Account and confirm with your password. This permanently removes your username, saved list, and watch history from our servers. Data stored only on your device (local cache) is cleared by logging out or uninstalling the App.
- Restore purchases: Profile → Restore Purchase.

**8. International Data Transfers**
If you access EvaShort from outside the region where our server is located, your account data is transferred to and processed on that server.

**9. Changes to This Policy**
We may update this policy. Material changes will be reflected by the "Last updated" date; continued use after changes constitutes acceptance.

**10. Contact Us**
Questions: taoxi110@qq.com

---

## C. 生成链接后的必做步骤

1. **ASC 填写**：把 `https://www.termsfeed.com/live/<你的uuid>` 填入 App Store Connect 的 **Privacy Policy URL**。
2. **改 App 内链接 + 重建**（否则 App 内按钮仍指向服务器，与 ASC 不一致）：
   - `mytool/src/screens/AuthScreen.js:14` → 改为新 TermsFeed 链接
   - `mytool/src/screens/ProfileScreen.js:199` → 改为新 TermsFeed 链接
   - 之后 `eas build` + 重新提审。
3. **Support URL 不在 TermsFeed 范围**：TermsFeed 是纯隐私政策生成器，不能托管支持页。支持页仍需另找宿主（Google Sites / Carrd / Notion，或保留 `api.haoweimedia.cn/evashort/support.html`）。

---

## D. 待确认项
- [ ] Apple Developer 账号法定名称（用于 TermsFeed 的 Company/Owner 字段，以及 ASC 版权字段）
- [ ] 服务器所在地区（用于第 8 节国际传输表述，可写具体区域或留泛称）
