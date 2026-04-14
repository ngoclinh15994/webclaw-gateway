# WebClaw Hybrid Engine API Reference

[English](./API.md) | [Tiếng Việt](./API.vi.md)

Base URL (local): `http://localhost:58822`

This document lists all public endpoints currently supported by WebClaw Hybrid Engine for integration.

---

## Common Conventions

- Content type for POST JSON APIs: `Content-Type: application/json`
- Success shape: usually includes `"status": "success"`
- Error shape: usually includes `"status": "error"` and `"message"`

---

## Health

### GET `/health`
Quick health check for uptime monitoring.

**Response**
```json
{
  "status": "ok"
}
```

---

## Scraping

### POST `/api/v1/scrape`
Main endpoint to fetch and convert a URL into clean Markdown.

**Request body**
```json
{
  "url": "https://example.com/article",
  "mode": "auto",
  "extract_mode": "article"
}
```

**Fields**
- `url` (string, required): target URL
- `mode` (string, optional): `auto` | `fast_only` | `playwright_only` (default `auto`)
- `extract_mode` (string, optional): `article` | `ecommerce` (default `article`)

**How to choose parameters**

- `mode="auto"` (recommended): starts with Cheerio (fast), then automatically falls back to Playwright if the page looks dynamic/blocked/too thin.
- `mode="fast_only"`: Cheerio-only path for speed. Use when you want maximum throughput and the site is mostly static HTML.
- `mode="playwright_only"`: browser-first path for SPA/login-like or heavily JS-rendered pages where static fetch is often insufficient.
- `extract_mode="article"` (default): best for news/blog/docs pages; prioritizes main readable content and usually gives the cleanest Markdown.
- `extract_mode="ecommerce"`: best for product/listing/review pages; preserves more commercial page blocks (prices/specs/reviews-like sections) instead of aggressive article-style extraction.

**Important compatibility note**

- `extract_mode="ecommerce"` **cannot** be used with `mode="fast_only"`.
- Valid pairs for ecommerce are:
  - `mode="auto"` + `extract_mode="ecommerce"` (recommended first)
  - `mode="playwright_only"` + `extract_mode="ecommerce"` (when you need browser rendering from the start)

**Practical examples**

```json
{
  "url": "https://example.com/news/abc",
  "mode": "auto",
  "extract_mode": "article"
}
```

```json
{
  "url": "https://example.com/product/sku-123",
  "mode": "auto",
  "extract_mode": "ecommerce"
}
```

**Success response (example)**
```json
{
  "status": "success",
  "engine_used": "crawlee_cheerio",
  "data": {
    "title": "Page title",
    "markdown": "# Clean Markdown output..."
  },
  "metrics": {
    "raw_tokens": 12345,
    "cleaned_tokens": 2345,
    "tokens_saved": 10000,
    "reduction_percentage": 81.0
  }
}
```

**Common error cases**
- `400`: missing `url`
- `400`: invalid `mode`
- `400`: invalid `extract_mode`
- `400`: URL blocked by user settings (`EXCLUDED_BY_USER`)
- `500`: runtime failure in crawler pipeline

---

## History & Stats

### GET `/api/v1/history`
Returns scrape history with pagination.

**Query params**
- `limit` (optional): default `50`, min `1`, max `200`
- `offset` (optional): default `0`

**Example**
`GET /api/v1/history?limit=20&offset=0`

**Response (example)**
```json
{
  "status": "success",
  "items": [],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 0
  }
}
```

### GET `/api/v1/stats`
Returns aggregate token-saving stats.

**Response (example)**
```json
{
  "status": "success",
  "stats": {
    "total_requests": 0,
    "total_tokens_saved": 0,
    "overall_reduction_percentage": 0
  }
}
```

---

## OpenClaw Integration

These endpoints run on the WebClaw engine (default base URL `http://localhost:58822`). They only **write or inspect the OpenClaw skill file on disk** (under `~/.openclaw`). They do **not** start the OpenClaw app, invoke the `webclaw-hybrid-engine-ln` tool on your behalf, or execute arbitrary OpenClaw functions. After a successful install, restart OpenClaw so it reloads skills.

**Default skill location (matches skill name `webclaw-hybrid-engine-ln`):** `~/.openclaw/skills/webclaw-hybrid-engine-ln/SKILL.md`

`GET /api/v1/system-info` returns the same path as `suggestedSkillPath`. `POST /api/v1/install-skill` can still install into another directory **inside** `~/.openclaw` if you pass a custom `targetPath`.

### GET `/api/v1/integrate/openclaw/status`
Checks whether `~/.openclaw` exists and whether **`~/.openclaw/skills/webclaw-hybrid-engine-ln/SKILL.md`** is present (`installed`).

**Response (example)**
```json
{
  "status": "success",
  "installed": false,
  "openclawRootExists": true
}
```

### POST `/api/v1/integrate/openclaw`
Installs the skill template into **`~/.openclaw/skills/webclaw-hybrid-engine-ln/SKILL.md`** (creates directories as needed). Uses the same template source as `POST /api/v1/install-skill` (`getSkillTemplatePath()` in code). Fails if `~/.openclaw` does not exist.

**Response (success)**
```json
{
  "status": "success",
  "message": "WebClaw Skill successfully installed into OpenClaw!"
}
```

**Response (OpenClaw missing)** — HTTP **404**
```json
{
  "status": "error",
  "message": "OpenClaw is not installed on this machine."
}
```

### GET `/api/v1/system-info`
Returns OS + suggested installation path for UI installer.

**Response (example)**
```json
{
  "status": "success",
  "osType": "Windows",
  "suggestedSkillPath": "C:\\Users\\<you>\\.openclaw\\skills\\webclaw-hybrid-engine-ln",
  "isOpenClawInstalled": true
}
```

### POST `/api/v1/install-skill`
Installs `SKILL.md` into a custom/selected OpenClaw skill path.

**Request body**
```json
{
  "targetPath": "C:\\Users\\<you>\\.openclaw\\skills\\webclaw-hybrid-engine-ln"
}
```

**Behavior**
- Validates absolute path
- Restricts path to `.openclaw` subtree for safety
- Creates directories recursively if missing
- Copies template content into `SKILL.md`

**Response (success)**
```json
{
  "status": "success",
  "message": "Skill installed successfully. Please restart OpenClaw.",
  "targetPath": "C:\\Users\\<you>\\.openclaw\\skills\\webclaw-hybrid-engine-ln\\SKILL.md"
}
```

---

## Settings (Exclude URLs)

### GET `/api/v1/settings`
Returns current settings.

**Response**
```json
{
  "status": "success",
  "settings": {
    "exclude_urls": []
  }
}
```

### POST `/api/v1/settings`
Updates settings.

**Request body**
```json
{
  "exclude_urls": ["youtube.com", "example.org"]
}
```

**Validation**
- `exclude_urls` must be an array

---

## Cookies

### GET `/api/v1/cookies`
Returns stored cookies used by scraping pipeline.

**Response**
```json
{
  "status": "success",
  "cookies": []
}
```

### POST `/api/v1/cookies`
Stores cookie entries.

**Request body**
```json
{
  "cookies": [
    {
      "domain": "example.com",
      "cookie_string": "a=1; b=2"
    }
  ]
}
```

**Response**
```json
{
  "status": "success",
  "count": 1
}
```

---

## Quick Integration Example

```bash
curl -X POST "http://localhost:58822/api/v1/scrape" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://example.com\",\"mode\":\"auto\"}"
```

For dashboard usage, open: `http://localhost:58822`
