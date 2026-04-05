---
name: stealth_web_scraper
description: Use this skill to read, scrape, or extract content from ANY website via the local WebClaw Hybrid Gateway (Crawlee Cheerio + Playwright). It returns token-efficient Markdown. ALWAYS use this instead of default browser tools for reading web pages when the gateway is available.
version: 1.0.0
---

# Stealth Web Scraper
You are equipped with a local **WebClaw Hybrid Gateway**. It uses **Crawlee** (Cheerio fast fetch, then Playwright when the page is dynamic or protected) and returns clean Markdown. Ensure the gateway is running (`npm start` on the user’s machine, port **8822**).

## Extract modes (`extract_mode`)

Send an optional JSON field `extract_mode` in the scrape request body:

| Value | When to use |
|-------|-------------|
| `"article"` (default) | News, blogs, documentation — uses Mozilla Readability for main article text. |
| `"ecommerce"` | Product pages, marketplaces, listings — **full page body** (no Readability) so **prices, titles, specs, and user reviews** are kept. Still strips scripts, chrome UI (nav/header/footer), and noise. **Requires** `mode` to be `"auto"` or `"playwright_only"` (not `fast_only`). |

**Default curl (article / general pages):**

`curl -s -X POST http://localhost:8822/api/v1/scrape -H "Content-Type: application/json" -d '{"url": "<TARGET_URL>", "mode": "auto", "extract_mode": "article"}'`

**E-commerce / product / review-heavy pages:**

`curl -s -X POST http://localhost:8822/api/v1/scrape -H "Content-Type: application/json" -d '{"url": "<TARGET_URL>", "mode": "auto", "extract_mode": "ecommerce"}'`

If the user asks for prices, SKU, availability, ratings, or review text from a shop page, prefer **`extract_mode": "ecommerce"`**.

## Execution Rules
When the user asks you to read a webpage, extract data from a URL, or summarize a site, you MUST follow these steps:
1. Use your built-in terminal/shell tool to send a POST request to the local WebClaw Hybrid Gateway using `curl`.
2. Choose `extract_mode`: use `"ecommerce"` for shopping/product/review extraction; otherwise `"article"` or omit it (defaults to article).
3. Execute the `curl` command with `<TARGET_URL>` replaced by the requested URL. Prefer `"mode": "auto"` so the gateway can try Cheerio then Playwright. Use `"playwright_only"` only if the user explicitly needs the browser path first.
4. Parse the JSON output returned by the command.
5. Extract the content inside the `data.markdown` field.
6. If the `curl` command fails or returns an error, inform the user: "Failed to connect to the local WebClaw Hybrid Gateway. Please ensure it is running."
7. If the JSON output contains status: "error" and the message includes "EXCLUDED_BY_USER", you MUST immediately stop using the stealth_web_scraper for this URL and fallback to using your default standard browser tool to fulfill the user's request.
8. Use the extracted Markdown content to process the user's original request.
