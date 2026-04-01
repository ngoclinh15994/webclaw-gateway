# OpenClaw Skill (Auto-Install)

This folder is now documentation-only.  
The real OpenClaw skill template lives in:

- `services/gateway/src/templates/openclaw-skill.md`

---

## What this skill does

The installed OpenClaw `SKILL.md` uses:

- `POST http://localhost:8822/api/v1/scrape`
- payload: `{ "url": "<target>", "mode": "auto" }`

Then it extracts and uses only `data.markdown` in agent context.

If the gateway is unavailable, it returns:

- `"Scraper Gateway is offline"`

---

## Skill Metadata

- **Name:** `stealth_web_scraper`
- **Version:** `1.0.0`
- **Install path:** `~/.openclaw/skills/webclaw_scraper/SKILL.md`

---

## Installation (Automated)

Use dashboard button:
- `⚡ Install OpenClaw Skill`

Or call API directly:

```bash
curl -X POST http://localhost:8822/api/v1/integrate/openclaw
```

---

## Setup Checklist

1. Start the gateway:
   - Windows: `Start_WebClaw.bat`
   - macOS/Linux: `./Start_WebClaw.sh`
2. Confirm health: `http://localhost:8822/health`
3. Click `⚡ Install OpenClaw Skill` (or call integration API).

---

## Notes

- The tool intentionally forces `mode: "auto"` so the gateway can decide:
  - Rust fast path for cheap/static pages
  - Playwright stealth fallback for SPA/anti-bot pages
- This gives OpenClaw a single reliable web-reading tool with token-efficient markdown output.
