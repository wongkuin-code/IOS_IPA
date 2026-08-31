# EvaShort — App Store Connect Listing (English, Short-Drama)

> Purpose: copy these fields into App Store Connect → your App → **App Store 信息**.
> Positioning: **short-drama video app** (朋友自制短剧 / friend-produced short dramas).
> Language: English (the app UI is fully anglicized — see code comment audit: no CJK in user-facing strings).
> Suggested primary language for the App Store listing: **English**.

---

## 1. App Store 信息 (核心文案)

### App 名称 (Name) — max 30 chars
```
EvaShort
```

### 副标题 (Subtitle) — max 30 chars
```
Captivating Short Dramas
```
> Alt: `Bite-size Drama Series` (22) / `Romance Mini Dramas` (20)

### 推广文本 (Promotional Text) — max 170 chars, updatable without review
```
EvaShort brings you gripping short dramas — CEO romances, revenge twists and second chances, made to watch in minutes anytime, anywhere.
```
> 128 chars. Benefit-led; refreshable without a new build.

### 描述 (Description)
```
EvaShort is your pocket theatre for short dramas — gripping, fast-paced mini-series built for the moments between everything else.

This is the initial release of EvaShort. It launches with our first short drama fully playable, and we'll be adding more titles gradually as new episodes are released — so the library keeps growing.

Whether you love CEO romances, revenge twists, or stories of second chances, EvaShort delivers dramatic, bingeable short dramas in minutes.

Features:
• Short dramas — handpicked mini-series with premium, story-driven episodes
• A growing library — new titles arrive over time; locked cards show "Coming Soon" until they open
• Beautiful, distraction-free playback — smooth full-screen viewing with playback-speed control and replay
• Save & continue — pick up where you left off and build your own watch list
• One-time unlock, no subscriptions, no ads — unlock all premium episodes with a single purchase

Open EvaShort, press play, and dive into the story.
```

### 关键词 (Keywords) — max 100 chars, comma-separated, no spaces
```
shortdrama,drama,romance,ceo,series,mini,story,episodes,video,entertainment
```
> 76 chars. Apple ignores `app` automatically. No spaces after commas.

### 类别 (Category)
| 类型 | 类别 |
|------|------|
| 主要类别 (Primary) | Entertainment |
| 次要类别 (Secondary) | Lifestyle |

### 年龄分级 (Age Rating) — set per content
- Honesty first: short-drama themes (romance / relationship / revenge) typically warrant **12+** or **17+**. Do NOT claim 4+ if the content warrants higher.
- 家长控制 / 年龄保证 / 不受限网页 / UGC / 社交 / 聊天 / 广告 → select per actual app behavior.
- Resulting rating depends on the choices above; pick the rating that matches the drama content.

### 隐私政策网址 (Privacy Policy URL) — required, must be a reachable https page
```
https://api.haoweimedia.cn/evashort/privacy-policy.html
```
> Use the deployed English `privacy-policy.html` (already anglicized). Deploy before submit.

### 支持网址 (Support URL) — required
```
https://api.haoweimedia.cn/evashort/support
```

### 营销网址 (Marketing URL) — optional
```
https://api.haoweimedia.cn/evashort
```

---

## 2. 此版本的新功能 (What's New / Version Notes) — max 4000 chars
```
Welcome to EvaShort 1.0 — your pocket theatre for short dramas.

This first release brings our debut short drama plus a clean, distraction-free player with playback-speed control and replay. More dramatic titles are on the way.

Open EvaShort, press play, and dive into the story.
```

---

## 3. App 隐私 (Privacy Nutrition Labels) — declare honestly
Declare:
- **Data used to track you**: None
- **Data linked to you**:
  - Identifiers: User ID (for purchase restore)
  - Purchases: Purchase history (IAP)
- **Data not linked to you**:
  - Usage Data: Product Interaction / Usage Data (watch history, saved list)

> IAP product: `2.99` (Non-Consumable, one-time unlock all premium episodes). Confirm the ID matches ASC.

---

## 4. 审核备注 (App Review Information → Notes) — for 5.2.3 copyright
```
EvaShort streams short-drama videos produced by friends of the developer and owned/licensed by us. A signed authorization letter from the content creator is attached, confirming we hold the necessary rights to display and distribute the content within the app. All content is delivered from our own backend (https://api.haoweimedia.cn/evashort); no third-party scraping or redistribution. The current build includes our published titles, with additional titles marked "Coming Soon" as part of our regular content rollout.
```

---

## 5. 五图 (Screenshots) — real UI only
- 6.7" iPhone (1290×2796) ✅ required · 6.5" iPhone (1242×2688) ✅ required
- Must capture: Home (real drama + locked "Coming Soon" cards) · Player real-play frame · a locked card's "Coming Soon" alert
- Per EvaReel alignment: include **13" iPad** screenshot; no device frames; real interface only. Generate padded sizes with `screenshots_padded/pad_screenshots.py`.

---

## 6. 图标 (App Icon)
- 1024×1024 no-alpha PNG at `mytool/assets/icon.png`
