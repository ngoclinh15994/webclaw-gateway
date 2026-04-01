# WebClaw Hybrid Gateway

**Save up to 90% on LLM scraping costs with a hybrid stealth pipeline.**  
Rust-speed extraction for easy pages. Playwright stealth fallback for JS-heavy and bot-protected pages.

---

## Why WebClaw Hybrid Gateway?

Most scraping stacks force a bad tradeoff:
- fast but blocked,
- or robust but expensive and slow.

This project uses a **Smart Gateway architecture** to get both:

1. **Fast Path (Rust CLI)**  
   The gateway executes the official `0xMassi/webclaw` binary directly for high-speed, low-cost extraction.
2. **Fallback Path (Playwright Stealth)**  
   If content quality is low, blocked, or SPA-like, the gateway automatically switches to Playwright + stealth plugin.
3. **Token-First Output**  
   HTML is purified to Markdown using Readability + Turndown, then measured with `tiktoken`.

Bottom line: you stop paying to send useless HTML noise into GPT/Claude.

---

## Key Features

- **Hybrid extractor brain**
  - Auto-routing between `webclaw` Rust fast path and Playwright stealth fallback.
- **Primary KPI: token reduction**
  - Returns `raw_tokens`, `cleaned_tokens`, `tokens_saved`, `reduction_percentage`.
- **Markdown purification pipeline**
  - `jsdom` + `@mozilla/readability` + `turndown`.
- **Anti-bot fallback support**
  - Handles SPA shells, Cloudflare/Captcha-like failures via browser render path.
- **Cookie sync-ready**
  - Cookie API and `data/cookies.json` support for 1-click sync workflows (including Chrome extension integration).
- **One-command Docker startup**
  - Included startup scripts for Windows and shell environments.
- **Built-in dashboard (API monitoring)**
  - UI on `http://localhost:8822`: aggregate stats, paginated scrape history, cookie manager, exclude-URL blacklist, OpenClaw skill installer, bilingual toggle (EN/VI).
- **SQLite history at scale**
  - Scrape history is persisted in `data/webclaw.db` (no flat `history.json` bottleneck).
- **User settings (exclude URLs)**
  - `data/settings.json` with `exclude_urls`; blocked URLs return `EXCLUDED_BY_USER` before Rust/Playwright run.
- **OpenClaw agent integration**
  - One-click auto-install into `~/.openclaw/skills/webclaw_scraper/SKILL.md` (Markdown skill, not a TS tool).

---

## Architecture

Single-container hybrid runtime:

- `services/gateway/Dockerfile`
  - Multi-stage build:
    - Stage A: pulls official `ghcr.io/0xmassi/webclaw:latest`
    - Stage B: Node.js + Playwright runtime
    - Copies `/usr/local/bin/webclaw` into gateway container
- `services/gateway/src/orchestrator.js`
  - Executes `webclaw` via `child_process.execFile`
  - Triggers Playwright fallback when needed
- `services/gateway/src/playwrightFallback.js`
  - Stealth mode + resource blocking + cookie injection
- `services/gateway/src/tokenMetrics.js`
  - KPI calculation using `tiktoken`
- `services/gateway/src/db.js`
  - SQLite initialization + migrations + history/stats queries
- `services/gateway/src/settings.js`
  - Reads/writes `data/settings.json`; scrape path checks exclude list before orchestration
- `services/gateway/src/templates/openclaw-skill.md`
  - OpenClaw `SKILL.md` template (curl to gateway, `EXCLUDED_BY_USER` fallback rule)

---

## Quick Start

### Requirements

- Docker Desktop (or Docker Engine + Compose)

### Windows (one click)

From repo root:

```bat
Start_WebClaw.bat
```

What it does:
- checks Docker daemon
- runs `docker compose up -d --build --remove-orphans`
- waits for `/health`
- opens dashboard at `http://localhost:8822`

### macOS / Linux

From repo root:

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
  "mode": "auto"
}
```

Modes:
- `auto`: Rust first, fallback to Playwright when needed
- `fast_only`: Rust only (errors if JS-only/empty)
- `playwright_only`: force browser fallback

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
  "engine_used": "webclaw_rust",
  "engine_label": "Rust Fast Path",
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
    "total_tokens_saved": 9876543
  }
}
```

### GET `/api/v1/settings`

Returns user settings (exclude URL blacklist).

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
- writes `SKILL.md` from gateway template

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

## Run with Docker Compose

```bash
docker compose up -d --build --remove-orphans
```

Service:
- `webclaw-gateway` exposed on `8822`

Health check URL:

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
- Skill name: `stealth_web_scraper`
- Auto-install endpoint: `POST /api/v1/integrate/openclaw`
- The skill uses `curl` against `http://localhost:8822/api/v1/scrape` and documents fallback when the gateway returns `EXCLUDED_BY_USER`.

Quick flow:

1. Start gateway (`Start_WebClaw.bat` or `Start_WebClaw.sh`)
2. Click `⚡ Install OpenClaw Skill` in dashboard (or call API)
3. Restart OpenClaw so it reloads skills

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
├─ openclaw-skill/
│  └─ README.md
├─ services/
│  └─ gateway/
│     ├─ src/
│     │  ├─ server.js
│     │  ├─ orchestrator.js
│     │  ├─ db.js
│     │  ├─ settings.js
│     │  └─ templates/openclaw-skill.md
│     ├─ ui/
│     ├─ Dockerfile
│     └─ package.json
├─ docker-compose.yml
├─ Start_WebClaw.bat
└─ Start_WebClaw.sh
```

---

## Credits

- Official Rust extractor: [`0xMassi/webclaw`](https://github.com/0xMassi/webclaw)

This project does **not** fork or modify Rust source.  
It orchestrates the official binary inside a production-friendly Node.js gateway.
