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

### GET `/api/v1/integrate/openclaw/status`
Checks whether OpenClaw root exists and whether skill is already installed.

**Response (example)**
```json
{
  "status": "success",
  "installed": false,
  "openclawRootExists": true
}
```

### POST `/api/v1/integrate/openclaw`
Installs skill automatically into default OpenClaw location.

**Response (success)**
```json
{
  "status": "success",
  "message": "WebClaw Skill successfully installed into OpenClaw!"
}
```

**Response (OpenClaw missing)**
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
