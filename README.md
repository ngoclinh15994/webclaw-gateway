# WebClaw Hybrid Engine

**Official repository:** [github.com/ngoclinh15994/webclaw-gateway](https://github.com/ngoclinh15994/webclaw-gateway)

**Save up to 90% on LLM scraping costs with a hybrid stealth pipeline.**  
[Crawlee](https://crawlee.dev/) **Cheerio** fast path for static HTML, **Playwright** for SPAs and bot-heavy pages—100% Node.js, Windows-friendly.

---

## Why WebClaw Hybrid Engine?

Most scraping stacks force a bad tradeoff:
- fast but blocked,
- or robust but expensive and slow.

This project uses a **smart hybrid architecture** to get both:

1. **Fast Path (Crawlee Cheerio)**  
   HTTP fetch + Cheerio parsing for static pages (≈30s timeout per request).
2. **Stealth Path (Crawlee Playwright)**  
   Headless Chromium when HTML is too small, blocked, or SPA-like (Crawlee browser pool + your synced cookies).
3. **Optional extension bridge**  
   Set `WEBCLAW_EXTENSION_WS` for a WebSocket that returns `{ "html": "..." }` if Playwright fails.
4. **Token-First Output**  
   HTML is purified to Markdown (Readability + Turndown for `article` mode; full-body Turndown for `ecommerce`), then measured with `tiktoken`.

Bottom line: you stop paying to send useless HTML noise into GPT/Claude.

---

## Key Features

- **Hybrid extractor brain (Crawlee)**
  - Auto-routing between **CheerioCrawler** and **PlaywrightCrawler** (~30s caps per level).
- **Primary KPI: token reduction**
  - Returns `raw_tokens`, `cleaned_tokens`, `tokens_saved`, `reduction_percentage`.
- **Markdown purification pipeline**
  - `jsdom` + `@mozilla/readability` + `turndown`.
- **Anti-bot fallback support**
  - Handles SPA shells, Cloudflare/Captcha-like failures via browser render path.
- **Cookie sync-ready**
  - Cookie API and `data/cookies.json` support for 1-click sync workflows (including Chrome extension integration).
- **Zero-Docker Node.js setup**
  - `npm install`, `npm run setup` (`npx playwright install chromium`), `npm start` from repo root.
- **Built-in dashboard (API monitoring)**
  - UI on `http://localhost:8822`: aggregate stats, paginated scrape history, cookie manager, exclude-URL list, OpenClaw skill installer, bilingual toggle (EN/VI).
- **SQLite history at scale**
  - Scrape history is persisted in `data/webclaw.db` (no flat `history.json` bottleneck).
- **User settings (exclude URLs)**
  - `data/settings.json` with `exclude_urls`; blocked URLs return `EXCLUDED_BY_USER` before any crawl (Cheerio/Playwright).
- **OpenClaw agent integration**
  - One-click auto-install into `~/.openclaw/skills/webclaw_scraper/SKILL.md` (Markdown skill, not a TS tool).

---

## Architecture

Native Node.js hybrid runtime (no Docker required):

- `services/gateway/src/orchestrator.js`
  - **CheerioCrawler** → **PlaywrightCrawler** → optional **`extensionFallback.js`** (`WEBCLAW_EXTENSION_WS`)
- `services/gateway/src/extensionFallback.js`
  - Optional WebSocket bridge for a Chrome extension (`{ "type":"scrape","url" }` / `{ "html" }`)
- `services/gateway/src/tokenMetrics.js`
  - KPI calculation using `tiktoken`
- `services/gateway/src/db.js`
  - SQLite initialization + migrations + history/stats queries
- `services/gateway/src/settings.js`
  - Reads/writes `data/settings.json`; scrape path checks exclude list before orchestration
- `services/gateway/src/templates/openclaw-skill.md`
  - OpenClaw `SKILL.md` template (curl to the local API, `EXCLUDED_BY_USER` fallback rule)

---

## Quick Start

### Requirements

- **Node.js 20+** and **npm**
- **Git** (recommended) — clone from [github.com/ngoclinh15994/webclaw-gateway](https://github.com/ngoclinh15994/webclaw-gateway)

### Install and run (all platforms)

Clone the official repo (review the code on GitHub first if you are security-conscious):

```bash
git clone https://github.com/ngoclinh15994/webclaw-gateway.git
cd webclaw-gateway
```

From the **repository root**:

```bash
npm install
npm run setup
npm start
```

- **`npm run setup`** runs `npx playwright install chromium` (required for the Playwright crawler tier).

Dashboard and API: **http://localhost:8822**

### Windows (convenience)

```bat
Start_WebClaw.bat
```

Runs `npm install`, `npm run setup`, then `npm start`.

### macOS / Linux (convenience)

```bash
chmod +x Start_WebClaw.sh
./Start_WebClaw.sh
```

---

## API Reference

### POST `/api/v1/scrape`

Endpoint:

```text
http://localhost:8822/api/v1/scrape
```

Request body:

```json
{
  "url": "https://example.com/article",
  "mode": "auto",
  "extract_mode": "article"
}
```

Optional **`extract_mode`**: `"article"` (default, Readability) or `"ecommerce"` (full body, no Readability). Omit or use `"article"` for most pages.

Modes:
- `auto`: Cheerio first, then Playwright (then optional extension WS if configured)
- `fast_only`: Cheerio only (errors if HTML is too small / SPA-like)
- `playwright_only`: Playwright only (then extension WS if Playwright fails)

If the URL matches any string in `exclude_urls` (substring match, case-insensitive), the API returns immediately:

```json
{
  "status": "error",
  "message": "EXCLUDED_BY_USER: This URL is blacklisted by user settings. Please use your default browser tool."
}
```

Example:

```bash
curl -X POST "http://localhost:8822/api/v1/scrape" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/article","mode":"auto"}'
```

Success response shape:

```json
{
  "status": "success",
  "extract_mode": "article",
  "engine_used": "crawlee_cheerio",
  "engine_label": "Crawlee Hybrid (Cheerio + Playwright)",
  "data": {
    "title": "Page title",
    "markdown": "# Clean markdown"
  },
  "metrics": {
    "raw_tokens": 12000,
    "cleaned_tokens": 900,
    "tokens_saved": 11100,
    "reduction_percentage": 92.5
  }
}
```

### GET `/api/v1/history`

Returns recent history from SQLite, newest first.

Query params:
- `limit` (default `50`, max `200`)
- `offset` (default `0`)

Example:

```bash
curl "http://localhost:8822/api/v1/history?limit=50&offset=0"
```

### GET `/api/v1/stats`

Returns aggregate stats from SQLite.

Example:

```bash
curl "http://localhost:8822/api/v1/stats"
```

Response:

```json
{
  "status": "success",
  "stats": {
    "total_requests": 1234,
    "total_tokens_saved": 9876543,
    "overall_reduction_percentage": 85.2
  }
}
```

### GET `/api/v1/settings`

Returns user settings (`exclude_urls` list).

```bash
curl "http://localhost:8822/api/v1/settings"
```

Response:

```json
{
  "status": "success",
  "settings": {
    "exclude_urls": ["youtube.com", "localhost"]
  }
}
```

### POST `/api/v1/settings`

Updates settings. Body must include `exclude_urls` (array of strings).

```bash
curl -X POST "http://localhost:8822/api/v1/settings" \
  -H "Content-Type: application/json" \
  -d '{"exclude_urls":["youtube.com"]}'
```

### POST `/api/v1/integrate/openclaw`

Automatically installs the OpenClaw skill file into the local user profile.

Behavior:
- detects `~/.openclaw`
- creates `~/.openclaw/skills/webclaw_scraper/` if needed
- writes `SKILL.md` from the OpenClaw skill template

Success:

```json
{
  "status": "success",
  "message": "WebClaw Skill successfully installed into OpenClaw!"
}
```

If OpenClaw is not installed (`~/.openclaw` missing), returns `404` with an error message.

---

## Cookie Manager API

### GET `/api/v1/cookies`
Returns cookie entries from `data/cookies.json`.

### POST `/api/v1/cookies`
Stores cookie entries used for Playwright fallback.

Request example:

```json
{
  "cookies": [
    {
      "domain": "portal.example.com",
      "cookie_string": "session=abc123; cf_clearance=xyz"
    }
  ]
}
```

This format is designed for quick automation and browser-extension sync.

---

## Optional Docker (deprecated)

Legacy `Dockerfile` / `docker-compose` samples live under **`.deprecated/docker/`** for reference only. The supported workflow is **native Node** (above).

Health check:

```text
http://localhost:8822/health
```

---

## For n8n / Automation Builders

Use `POST /api/v1/scrape` as a standard HTTP node:
- Input: URL + mode
- Output: clean Markdown + token reduction KPI
- Branch on `engine_used` if you want analytics by path

This is optimized for agents and workflows where token waste directly hits your cloud bill.

---

## OpenClaw Integration

This repository ships a ready-to-use OpenClaw **skill** (Markdown `SKILL.md`, installed under `~/.openclaw/skills/webclaw_scraper/`):

- Template source: `services/gateway/src/templates/openclaw-skill.md`
- Skill name: `webclaw-hybrid-engine-ln`
- Auto-install endpoint: `POST /api/v1/integrate/openclaw`
- The skill uses `curl` against `http://localhost:8822/api/v1/scrape` and documents fallback when the API returns `EXCLUDED_BY_USER`.

Quick flow:

1. Clone and run the engine from the [official repository](https://github.com/ngoclinh15994/webclaw-gateway) (see **Quick Start** above).
2. Start WebClaw Hybrid Engine (`Start_WebClaw.bat` or `Start_WebClaw.sh`)
3. Click `⚡ Install OpenClaw Skill` in dashboard (or call API)
4. Restart OpenClaw so it reloads skills

Detailed notes:
- `openclaw-skill/README.md`

---

## Project Structure

```text
.
├─ data/
│  ├─ cookies.json
│  ├─ settings.json
│  └─ webclaw.db
├─ scripts/
│  └─ setup.js             # npx playwright install chromium
├─ openclaw-skill/
│  └─ README.md
├─ services/
│  └─ gateway/
│     ├─ src/
│     │  ├─ app.js
│     │  ├─ extensionFallback.js
│     │  ├─ orchestrator.js
│     │  ├─ db.js
│     │  ├─ settings.js
│     │  └─ templates/openclaw-skill.md
│     ├─ ui/
│     └─ package.json
├─ package.json            # workspace root (npm start / setup)
├─ Start_WebClaw.bat
└─ Start_WebClaw.sh
```

---

## Credits

- Crawlee: [Apify Crawlee](https://crawlee.dev/)
- Markdown stack: Mozilla Readability, Turndown, tiktoken

WebClaw Hybrid Engine is a **Node.js** orchestration layer around Crawlee and your local Playwright install.
