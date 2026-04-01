# PROJECT SPEC: WebClaw Hybrid Gateway

## 1. Project Overview
A hybrid, local-first web scraping system designed to minimize LLM token costs. 
**CRITICAL RULE:** The core extraction engine uses the official unmodified Docker image of `0xMassi/webclaw`. We will NOT fork or modify the Rust code. Instead, we will build a Node.js API Gateway that orchestrates the flow, delegates to the Rust core, and falls back to a Playwright stealth instance when the Rust core fails (e.g., SPA, Cloudflare).

## 2. Tech Stack
- **Core Engine (Untouched):** Official Docker image of `0xMassi/webclaw` (Rust).
- **Gateway & Orchestrator:** Node.js (Express, Playwright Stealth, Readability, Turndown, tiktoken).
- **Data Storage:** Local `data/cookies.json`.
- **Deployment:** Docker Compose.
- **Interfaces:** REST API and Minimal HTML/JS Dashboard.

---

## 3. System Architecture & Workflow (Node.js Gateway Pattern)

1. **Client** calls `POST /api/v1/scrape` on our **Node.js Gateway** (Port 8822).
2. **Node.js Gateway** forwards the target URL to the **webclaw-core** container via internal Docker network REST API.
3. **Evaluation Phase:** Node.js evaluates the response from `webclaw-core`.
   - **IF SUCCESS (Fast Path):** Node.js calculates token savings and returns the result to Client.
   - **IF BLOCKED/SPA (Fallback Path):** (e.g., status 403, or content too short):
     - Node.js reads `data/cookies.json` for the domain.
     - Node.js launches Playwright Stealth, injects cookies, and renders the page completely.
     - Node.js runs `Mozilla Readability` and `Turndown` on the rendered HTML to extract clean Markdown.
     - Node.js calculates Token Savings and returns the final JSON to Client.

---

## 4. Module Breakdown & Cursor Tasks

### Module A: `webclaw-core` (The Blackbox)
- **Task:** NO CODE TO WRITE. This will just be a service definition in `docker-compose.yml` pulling the official image (e.g., `ghcr.io/0xmassi/webclaw`).

### Module B: `webclaw-gateway` (Node.js Orchestrator & Heavy Scraper)
- **Directory:** `./services/gateway/`
- **Tasks for Cursor:**
  - [ ] Initialize Node.js (`package.json`) with Express, `playwright-extra`, `puppeteer-extra-plugin-stealth`, `@mozilla/readability`, `jsdom`, `turndown`, and `tiktoken`.
  - [ ] Implement `POST /api/v1/scrape`.
  - [ ] **Step 1:** Make HTTP request to `http://webclaw-core:8000` (or its default REST port).
  - [ ] **Step 2:** Write logic to determine if Fallback is needed (check status codes, error messages, or short content length).
  - [ ] **Step 3:** Implement the Playwright Fallback function. Read `../data/cookies.json`, inject cookies matching the domain, navigate, wait for idle network, and return `document.documentElement.outerHTML`.
  - [ ] **Step 4:** Implement `Markdown Purifier`. Use `jsdom` + `Readability` to extract main content, then use `turndown` to convert it to Markdown.
  - [ ] **Step 5:** Integrate token counting (`tiktoken`) for both raw HTML length and output Markdown length.
  - [ ] Implement `POST /api/v1/cookies` to safely update `../data/cookies.json`.

### Module C: Minimal Dashboard & Data
- **Directory:** `./ui/` and `./data/`
- **Tasks for Cursor:**
  - [ ] Create `data/cookies.json` initialized as `[]`.
  - [ ] Serve `./ui/` statically via the Node.js Express server.
  - [ ] Build `index.html` (Tailwind CDN + Vanilla JS).
  - [ ] **Features:** - URL Input Form to test scraping.
    - Result view showing the Markdown.
    - Token/USD Savings Statistics.
    - Cookie Manager Table (Add/Delete cookies for domains).

### Module D: Infrastructure (`docker-compose.yml`)
- **Directory:** `./` (Root)
- **Tasks for Cursor:**
  - [ ] Create `docker-compose.yml` with 2 services:
    - `webclaw-core`: image `ghcr.io/0xmassi/webclaw:latest`
    - `webclaw-gateway`: built from `./services/gateway/`, exposes port `8822:8822`, mounts `./data:/app/data`.
  - [ ] Write `Start_WebClaw.bat`: Script to verify Docker is running, execute `docker-compose up -d --build`, and open `http://localhost:8822`.

---

## 5. API Specifications (Served by Node.js Gateway)

### External: `POST /api/v1/scrape`
- **Request:**
```json
{
  "url": "[https://example.com/product](https://example.com/product)",
  "mode": "auto" // "auto", "fast_only", "playwright_only"
}
Response:

JSON
{
  "status": "success",
  "engine_used": "webclaw_rust | playwright_fallback",
  "data": {
    "title": "Cleaned Title",
    "markdown": "# Cleaned Markdown content...",
  },
  "metrics": {
    "raw_tokens": 12000,
    "cleaned_tokens": 500,
    "tokens_saved": 11500,
    "saved_usd_gpt4o": 0.057
  }
}