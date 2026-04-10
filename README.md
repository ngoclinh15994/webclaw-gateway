# WebClaw Hybrid Engine 🚀

[English](./README.md) | [Tiếng Việt](./README.vi.md)

**The ultimate privacy-first web scraping bridge for AI agents.**

WebClaw runs entirely on your machine: a **zero-Docker**, **NPM-native** Node.js stack that turns complex pages into **clean Markdown** for LLMs—without shipping raw HTML or browsing context to a third-party scraper.

---

## Quick start (the one-liner)

```bash
npx webclaw-hybrid-engine-ln
```

Wait until the terminal shows **Ready on port 58822**, then open the dashboard at **http://localhost:58822**.

- **100% Node.js native** — no Docker, no container runtime.
- **Privacy-first** — fetching, rendering, and Markdown conversion happen **locally**; your URLs and page content are not sent to WebClaw as a hosted service.

---

## 24/7 background service

To run WebClaw 24/7 with PM2:

```bash
npm install -g webclaw-hybrid-engine-ln
pm2 start webclaw-hybrid-engine-ln --name "webclaw"
pm2 save
```

---

## Management commands

| Command | What it does |
|--------|----------------|
| `pm2 status webclaw` | Check whether the **webclaw** process is running |
| `pm2 stop webclaw` | Stop the engine (does not remove it from PM2’s list) |
| `pm2 restart webclaw` | Restart the engine (e.g. after an update) |
| `pm2 delete webclaw` | Remove **webclaw** from PM2’s process list |

For logs: `pm2 logs webclaw`.

---

## OpenClaw Skill Installation

### ⚙️ How to Install the OpenClaw Skill

We provide a beautiful, 1-Click Local Dashboard to install the skill automatically without messing with file paths.

**Step 1: Start WebClaw**  
Ensure the engine is running (either via `npx` or `pm2`).

```bash
npx webclaw-hybrid-engine-ln
```

**Step 2: Open the Local Dashboard**  
Open your browser and go to: `http://localhost:58822`

**Step 3: Install via UI**

Click the yellow "Cài đặt Skill OpenClaw" button at the top right of the dashboard.

A popup will appear, automatically detecting your OS and the OpenClaw skills folder.

Click "Xác nhận Cài đặt".

🟢 Restart your OpenClaw agent. The `webclaw-hybrid-engine-ln` tool is now ready to use!

---

## Why WebClaw?

- **Hybrid engine** — Automatically uses a **fast Cheerio** path for static HTML and **Playwright** when pages are dynamic, SPA-heavy, or need a real browser context—powered by [Crawlee](https://crawlee.dev/).
- **Privacy-first** — Scraping, rendering, and Markdown extraction stay **on your machine**. You control cookies, blocklists, and data on disk.
- **Token-efficient** — Delivers **clean Markdown** (with readability-style extraction where appropriate) so agents ingest less noise—often **on the order of ~80% fewer tokens** versus sending raw HTML, depending on the site.

---

## API & dashboard

- **Scrape:** `POST http://localhost:58822/api/v1/scrape` with JSON body `{"url": "<url>", "mode": "auto"}` (optional `extract_mode`: `article` | `ecommerce`).
- **Health:** `GET http://localhost:58822/health`
- **Dashboard:** **http://localhost:58822** — history, stats, cookies, exclude URLs, OpenClaw skill installer.
- **Full API documentation (EN):** [`API.md`](./API.md)
- **Tài liệu API tiếng Việt:** [`API.vi.md`](./API.vi.md)

---

## Requirements

- **Node.js 20+**
- **npm** (for `npx`)

---

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).

---

## Repository

**https://github.com/ngoclinh15994/webclaw-gateway**

---

## Support

If this project helps you, you can support me here: [buymeacoffee.com/linhnn](https://buymeacoffee.com/linhnn)
