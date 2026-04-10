# OpenClaw Skill (Auto-Install)

This folder is **documentation-only**.  
The canonical OpenClaw skill template is:

- `services/gateway/src/templates/openclaw-skill.md`

**Quick start (published package):** `npx webclaw-hybrid-engine-ln` — wait for **Ready on port 58822**.  
**Official engine repository (clone, README, source review):** [https://github.com/ngoclinh15994/webclaw-gateway](https://github.com/ngoclinh15994/webclaw-gateway)

---

## What this skill does

The installed OpenClaw `SKILL.md` calls the **WebClaw Hybrid Engine** (100% Node.js, **Crawlee** + Playwright):

- `POST http://localhost:58822/api/v1/scrape`
- Typical payload: `{ "url": "<target>", "mode": "auto", "extract_mode": "article" }`
  - Use **`extract_mode": "ecommerce"`** for product/listing pages (prices, reviews, specs).

The agent should read **`data.markdown`** (and may use `data.title`) from the JSON response.

If `curl` cannot reach the engine, use the same onboarding copy as in the skill template: **`npx webclaw-hybrid-engine-ln`**, then wait for **Ready on port 58822** (optional: review source on [GitHub](https://github.com/ngoclinh15994/webclaw-gateway) first).

---

## Skill Metadata

- **Name:** `webclaw-hybrid-engine-ln`
- **Version:** `1.0.2` (see template frontmatter)
- **Install path:** `~/.openclaw/skills/webclaw_scraper/SKILL.md`

---

## Installation (Automated)

**Dashboard:** button **Install OpenClaw Skill** (wording may vary by language).

**API:**

```bash
curl -X POST http://localhost:58822/api/v1/integrate/openclaw
```

---

## Setup Checklist

1. **Run the engine:** either `npx webclaw-hybrid-engine-ln` (wait for **Ready on port 58822**), **or** clone [https://github.com/ngoclinh15994/webclaw-gateway](https://github.com/ngoclinh15994/webclaw-gateway) and from the repo root run `npm install` → `npm run setup` → `npm start`, or **`Start_WebClaw.bat`** / **`Start_WebClaw.sh`**.
2. Confirm health: `http://localhost:58822/health`
3. Install the skill: dashboard button or `POST /api/v1/integrate/openclaw`
4. Restart OpenClaw so it reloads skills.

---

## Notes

- With **`mode": "auto"`**, the engine uses **Crawlee Cheerio** first, then **Crawlee Playwright** when HTML looks like an SPA shell, is too small, or looks blocked—plus optional **WebSocket extension** fallback if `WEBCLAW_EXTENSION_WS` is configured and Playwright fails.
- **`mode": "fast_only"`** = Cheerio only (fails on heavy SPAs). **`playwright_only"`** = browser path first (then extension WS if configured).
- Responses still include **`metrics`** (token KPIs) for dashboards; OpenClaw usage focuses on **`data.markdown`**.
