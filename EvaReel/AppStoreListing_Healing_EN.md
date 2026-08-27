# EvaReel — App Store Connect Listing (English, Healing Short-Drama)

> Purpose: copy these fields into App Store Connect → your App → **App Store 信息**.
> Positioning: **healing / relaxing original short-drama video app** (治愈视频短剧).
> Language: English (the app UI is fully anglicized — see status snapshot 全英文化).
> Suggested primary language for the App Store listing: **English** (change from 简体中文 if needed, or add an English localization).

---

## 1. App Store 信息 (核心文案)

### App 名称 (Name) — max 30 chars
```
EvaReel
```

### 副标题 (Subtitle) — max 30 chars
```
Calm Healing Short Dramas
```
> Alt: `Healing Short Drama Videos` (26) / `Relaxing Mini Dramas` (22)

### 推广文本 (Promotional Text) — max 170 chars, updatable without review
```
Find your calm with EvaReel — gentle, healing short dramas made to help you relax, breathe, and unwind anytime, anywhere.
```
> 117 chars. Keep it benefit-led; this field can be refreshed anytime without a new build.

### 描述 (Description)
```
EvaReel is a calm space for healing short dramas — gentle, beautifully shot mini-stories designed to help you slow down, breathe, and unwind.

This is the initial release of EvaReel. It launches with our first original healing short drama fully playable, and we'll be adding more healing titles gradually over time — each new story opens in the app as it's released, so the library keeps growing.

Whether you're easing into sleep, taking a break from a busy day, or just need a few quiet minutes, EvaReel brings you original, relaxing short dramas that feel like a warm pause.

Features:
• Healing short dramas — handpicked original mini-stories with a calming, restorative mood
• A growing library — new healing titles arrive over time; locked cards show "Coming Soon" until they open
• Beautiful, distraction-free playback — smooth full-screen viewing with playback-speed control and replay
• Save & continue — pick up where you left off and build your own calming watch list
• One-time unlock, no subscriptions, no ads — unlock all videos with a single purchase

Made for moments of rest. Open EvaReel, press play, and let the day soften.
```

### 关键词 (Keywords) — max 100 chars, comma-separated, no spaces
```
healing,relax,shortdrama,calm,meditation,sleep,stress,wellness,drama,video
```
> 73 chars. Apple ignores `app` automatically — do not include it. No need for spaces after commas.

### 类别 (Category)
| 类型 | 类别 |
|------|------|
| 主要类别 (Primary) | Entertainment |
| 次要类别 (Secondary) | Health & Fitness |

### 年龄分级 (Age Rating) — Per status snapshot P0: set to **None / 4+**
- 家长控制 / 年龄保证 / 不受限网页 / UGC / 社交 / 聊天 / 广告 → 全部选「否」
- Result: **4+**

### 隐私政策网址 (Privacy Policy URL) — required, must be a reachable https page
```
https://<your-domain>/evareel/privacy-policy.html
```
> Use the deployed English `privacy-policy.html` (already anglicized). Fill in the real domain before submit.

### 支持网址 (Support URL) — required
```
https://<your-domain>/evareel/support
```

### 营销网址 (Marketing URL) — optional
```
https://<your-domain>/evareel
```

---

## 2. 此版本的新功能 (What's New / Version Notes) — max 4000 chars

```
Welcome to EvaReel 1.0 — your pocket-sized healing theatre.

This first release brings our debut original healing short drama plus a calm, distraction-free player with playback-speed control and replay. More relaxing titles are on the way.

Enjoy a quiet moment whenever you need one. Open EvaReel, press play, and let the day soften.
```

---

## 3. App 隐私 (Privacy Nutrition Labels) — declare honestly

Per status snapshot P2, declare:
- **Data used to track you**: None
- **Data linked to you**:
  - Contact Info: none collected
  - Identifiers: User ID (for purchase restore)
  - Purchases: Purchase history (IAP `vip.unlock.video`)
- **Data not linked to you**:
  - Usage Data: Product Interaction / Usage Data (watch history, saved list)

> IAP product: `vip.unlock.video` (Non-Consumable, one-time unlock all videos).

---

## 4. 审核备注 (App Review Information → Notes) — for 5.2.3 copyright
```
EvaReel streams original, self-produced healing short-drama videos delivered from our own backend (https://api.haoweimedia.cn/evareel). All content is original and owned by the developer; no third-party scraping or redistribution. A signed copyright statement is attached. The current build includes one published original title with additional titles marked "Coming Soon".
```

---

## 5. 五图 (Screenshots) — real UI only
- 6.7" iPhone (1290×2796) ✅ required · 6.5" iPhone (1242×2688) ✅ required
- Must capture: Home (1 real + locked "Coming Soon" cards) · Player real-play frame · a locked card's "Coming Soon" alert
- Per P1: include **13" iPad** screenshot; no device frames; real interface only.

---

## 6. 图标 (App Icon)
- 1024×1024 no-alpha PNG at `mytool/assets/icon.png`
