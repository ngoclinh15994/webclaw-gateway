# PROJECT SPEC: WebClaw Hybrid Engine

## 1. Project Overview
A hybrid, local-first web scraping system designed to minimize LLM token costs.

**Core stack:** [Crawlee](https://crawlee.dev/) **CheerioCrawler** (fast HTTP path) and **PlaywrightCrawler** (headless browser path), orchestrated by Node.js. Optional **WebSocket extension bridge** (`WEBCLAW_EXTENSION_WS`) if Playwright fails.

## 2. Tech Stack
- **Crawl / render:** Crawlee (Cheerio + Playwright), Playwright Chromium (via `npm run setup`).
- **Engine & API:** Node.js (Express, Readability + Turndown, tiktoken).
- **Data:** `data/cookies.json`, SQLite `data/webclaw.db`, `data/settings.json`.
- **Deployment:** Native Node.js (`npm install`, `npm run setup`, `npm start`). Optional legacy Docker under `.deprecated/docker/`.
- **Interfaces:** REST API and HTML/JS dashboard.

---

## 3. System Architecture & Workflow (Node.js hybrid engine pattern)

1. **Client** calls `POST /api/v1/scrape` on **WebClaw Hybrid Engine** (port 58822).
2. **Orchestrator** runs **Cheerio** first (unless `mode: playwright_only`).
3. **Evaluation:** If HTML is too small, HTTP error, or SPA/block markers → **PlaywrightCrawler** (~30s timeouts).
4. If Playwright fails and **`WEBCLAW_EXTENSION_WS`** is set → optional extension returns HTML over WebSocket.
5. **Markdown:** `purifyHtmlToMarkdown` (article vs ecommerce), **metrics** via tiktoken, JSON response with `data.markdown` for OpenClaw.

---

## 4. Response / Engine Labels

- `engine_used`: `crawlee_cheerio` | `crawlee_playwright` | `extension_ws`
- `engine_label`: includes **"Crawlee Hybrid (Cheerio + Playwright)"** for default paths.

(Older `webclaw_rust` / Rust CLI references are removed.)

---

## 5. Environment (optional)

| Variable | Purpose |
|----------|---------|
| `WEBCLAW_EXTENSION_WS` | e.g. `ws://127.0.0.1:18765` — extension returns HTML for failed Playwright runs |
| `WEBCLAW_EXTENSION_TIMEOUT_MS` | Socket wait (default `25000`) |
| `CRAWLEE_LOG_LEVEL` | Default `WARNING` if unset (set in `app.js`) |
| `PORT` | HTTP port for the engine (default `58822`) |
