# OpenClaw Skill (Auto-Install)

This folder is **documentation-only**.  
The canonical OpenClaw skill template is:

- `services/gateway/src/templates/openclaw-skill.md`

**Official engine repository (clone, README, source review):** [https://github.com/ngoclinh15994/webclaw-gateway](https://github.com/ngoclinh15994/webclaw-gateway)

---

## What this skill does

The installed OpenClaw `SKILL.md` calls the **WebClaw Hybrid Engine** (100% Node.js, **Crawlee** + Playwright):

- `POST http://localhost:8822/api/v1/scrape`
- Typical payload: `{ "url": "<target>", "mode": "auto", "extract_mode": "article" }`
  - Use **`extract_mode": "ecommerce"`** for product/listing pages (prices, reviews, specs).

The agent should read **`data.markdown`** (and may use `data.title`) from the JSON response.

If `curl` cannot reach the engine, tell the user the WebClaw Hybrid Engine is not running. **Security-first:** encourage them to **review the code and README** on the official repo before running any install commands: [https://github.com/ngoclinh15994/webclaw-gateway](https://github.com/ngoclinh15994/webclaw-gateway). After they follow the README to install, run setup, and start the server, they can retry.

---

## Skill Metadata

- **Name:** `webclaw-hybrid-engine-ln`
- **Version:** `1.0.0` (see template frontmatter)
- **Install path:** `~/.openclaw/skills/webclaw_scraper/SKILL.md`

---

## Installation (Automated)

**Dashboard:** button **Install OpenClaw Skill** (wording may vary by language).

**API:**

```bash
curl -X POST http://localhost:8822/api/v1/integrate/openclaw
```

---

## Setup Checklist

1. **Get the source:** clone [https://github.com/ngoclinh15994/webclaw-gateway](https://github.com/ngoclinh15994/webclaw-gateway) (`git clone https://github.com/ngoclinh15994/webclaw-gateway.git` then `cd webclaw-gateway`). Read the README and review the code if you want to verify what runs locally.
2. **From repository root:** `npm install` → `npm run setup` (installs Playwright Chromium) → `npm start`
   - Or run **`Start_WebClaw.bat`** (Windows) / **`Start_WebClaw.sh`** (macOS/Linux), which chain the same steps.
3. Confirm health: `http://localhost:8822/health`
4. Install the skill: dashboard button or `POST /api/v1/integrate/openclaw`
5. Restart OpenClaw so it reloads skills.

---

## Notes

- With **`mode": "auto"`**, the engine uses **Crawlee Cheerio** first, then **Crawlee Playwright** when HTML looks like an SPA shell, is too small, or looks blocked—plus optional **WebSocket extension** fallback if `WEBCLAW_EXTENSION_WS` is configured and Playwright fails.
- **`mode": "fast_only"`** = Cheerio only (fails on heavy SPAs). **`playwright_only"`** = browser path first (then extension WS if configured).
- Responses still include **`metrics`** (token KPIs) for dashboards; OpenClaw usage focuses on **`data.markdown`**.
