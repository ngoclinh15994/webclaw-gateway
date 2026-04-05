# WebClaw Hybrid Engine 🚀

**The ultimate privacy-first web scraping bridge for AI agents.**

WebClaw runs entirely on your machine: a **zero-Docker**, **NPM-native** Node.js stack that turns complex pages into **clean Markdown** for LLMs—without shipping raw HTML or browsing context to a third-party scraper.

---

## Quick start (the one-liner)

```bash
npx webclaw-hybrid-engine-ln
```

Wait until the terminal shows **Ready on port 8822**, then open the dashboard at **http://localhost:8822**.

- **100% Node.js native** — no Docker, no container runtime.
- **Privacy-first** — fetching, rendering, and Markdown conversion happen **locally**; your URLs and page content are not sent to WebClaw as a hosted service.

---

## Background service (set & forget)

To keep the engine running after you close the terminal and to survive reboots (with PM2’s startup hook), use [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start npx --name "webclaw" -- webclaw-hybrid-engine-ln
pm2 save && pm2 startup
```

Follow the on-screen instructions from `pm2 startup` once (so PM2 respawns your apps after a reboot).

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

## Integration with OpenClaw

Install the published skill for your OpenClaw / ClawHub workflow:

```bash
clawhub install webclaw-hybrid-engine-ln
```

The skill talks to **http://localhost:8822**. **The engine must be running** (foreground `npx` or PM2 **webclaw**) **on port 8822** before the agent can scrape.

You can also install the skill from the local dashboard (**Install OpenClaw Skill**) or via `POST /api/v1/integrate/openclaw` when the engine is already up.

---

## Why WebClaw?

- **Hybrid engine** — Automatically uses a **fast Cheerio** path for static HTML and **Playwright** when pages are dynamic, SPA-heavy, or need a real browser context—powered by [Crawlee](https://crawlee.dev/).
- **Privacy-first** — Scraping, rendering, and Markdown extraction stay **on your machine**. You control cookies, blocklists, and data on disk.
- **Token-efficient** — Delivers **clean Markdown** (with readability-style extraction where appropriate) so agents ingest less noise—often **on the order of ~80% fewer tokens** versus sending raw HTML, depending on the site.

---

## API & dashboard

- **Scrape:** `POST http://localhost:8822/api/v1/scrape` with JSON body `{"url": "<url>", "mode": "auto"}` (optional `extract_mode`: `article` | `ecommerce`).
- **Health:** `GET http://localhost:8822/health`
- **Dashboard:** **http://localhost:8822** — history, stats, cookies, exclude URLs, OpenClaw skill installer.

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
