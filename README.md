# AI Content Scheduler

**Intelligent Social Media Content Pipeline -- From Ideation to Scheduled Publishing in One Click**

## 📋 Quick Summary

> 🤖 **AI Content Scheduler** 是一套端到端的 AI 社群內容自動化工廠，專為社群媒體經營者打造。只需輸入主題、語氣與目標受眾，系統便能透過 🧠 GPT-4o-mini 自動產生文案、標籤與長文，並利用 🎨 GPT-Image-1 生成貼圖風格視覺素材，再經由 🎬 FFmpeg 將靜態圖片轉製成 Instagram Reels 短影片（1080x1920）。所有素材統一上傳至 ☁️ Firebase Cloud Storage，最終一鍵透過 📱 Instagram Graph API 直接發佈貼文或 Reels。技術架構採用 ⚡ Next.js 15 + React 19 + Turbopack，搭配 🔐 iron-session 管理 Instagram OAuth 驗證流程，並以 ✅ Zod 4 嚴格驗證所有 API 輸入。這不是排程工具，而是一條從「靈感💡」到「發佈📤」的完整 AI 內容產線，將原本需要數小時的多工具切換流程壓縮為一次點擊，大幅提升社群內容的產出效率與品質一致性 🚀。

---

## 🤔 Why This Exists

Social media managers spend hours every day on a repetitive loop: brainstorm a topic, write copy, design a visual, format for the platform, schedule, publish. Each step involves a different tool. Most of that work is mechanical, not creative.

AI Content Scheduler collapses that entire pipeline into a single workflow. Give it a topic, a tone, and a target audience -- it generates the caption, the sticker-style visual, the Instagram Reel video, and the hashtags. Then it publishes directly to Instagram through the Graph API. One input, one click, done.

This is not a scheduling tool. It is an end-to-end content factory powered by AI.

---

## 🏗️ Architecture

```
User Input (Topic / Tone / Audience / Language)
        |
        v
+-------------------+
|   Next.js 15 App  |  <-- React 19 + Tailwind + Turbopack
|   (App Router)    |
+--------+----------+
         |
    +----+----+---------------------+
    |         |                     |
    v         v                     v
 OpenAI    FFmpeg              Firebase
 GPT-4o   (Video)             (Storage)
    |         |                     |
    |   +-----+------+             |
    |   | Image-to-  |             |
    |   | Reel (MP4) |             |
    |   +-----+------+             |
    |         |                     |
    v         v                     v
+---------------------------------------+
|       Generated IG Package            |
|  - AI Sticker (PNG, transparent BG)   |
|  - Caption + Hashtags                 |
|  - Long-form Article / Script         |
|  - Reel Video (1080x1920 MP4)         |
+-------------------+-------------------+
                    |
                    v
          Instagram Graph API
          (Post or Reel Publish)
```

### 🧩 Core Modules

| Module | Path | Purpose |
|--------|------|---------|
| **Generator** | `src/lib/generator.ts` | Orchestrates GPT-4o-mini for structured content + GPT-Image-1 for visual generation |
| **Video Pipeline** | `src/lib/video.ts` | Converts static images into Instagram Reels using FFmpeg with caption overlays |
| **Instagram Client** | `src/lib/instagram.ts` | Handles media container creation and publishing via the Graph API |
| **Storage** | `src/lib/storage.ts` | Firebase Cloud Storage for persistent asset hosting |
| **Auth** | `src/app/api/auth/` | Instagram OAuth flow with session management via iron-session |
| **API Routes** | `src/app/api/generate/` | Content generation endpoint with Zod validation |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (App Router, Turbopack) |
| Runtime | React 19, TypeScript 5 |
| AI | OpenAI GPT-4o-mini (text), GPT-Image-1 (image) |
| Video | FFmpeg (via ffmpeg-static) |
| Storage | Firebase Cloud Storage |
| Auth | Instagram OAuth, iron-session, jose (JWT) |
| Validation | Zod 4 |
| Styling | Tailwind CSS 4 |
| Testing | Vitest |
| Code Quality | Biome |

---

## 🏁 Quick Start

```bash
# Clone and install
git clone <repo-url>
cd ai-content-scheduler
npm install

# Configure environment
cp .env.example .env.local
# Fill in: OPENAI_API_KEY, Firebase config, Instagram App credentials, SESSION_SECRET

# Run development server
npm run dev
```

Open `http://localhost:3000`, enter a topic, and click generate. The AI produces a complete Instagram content package -- sticker, caption, hashtags, article, and Reel video -- ready for one-click publishing.

### ⚙️ Available Commands

```bash
npm run dev       # Start dev server with Turbopack
npm run build     # Production build
npm run test      # Run Vitest test suite
npm run lint      # Biome linting
npm run format    # Biome auto-format
```

---

## 👤 Author

**Huang Akai (Kai)** -- Founder @ Universal FAW Labs | Creative Technologist | Ex-Ogilvy | 15+ years in digital creative and marketing technology.
