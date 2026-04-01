---
name: stealth_web_scraper
description: Use this skill to read, scrape, or extract content from ANY website. It automatically bypasses anti-bot protections (like Cloudflare) and returns highly compressed Markdown. ALWAYS use this instead of default browser tools for reading web pages.
version: 1.0.0
---

# Stealth Web Scraper
You are equipped with a local WebClaw Hybrid Gateway that can bypass anti-bot protections and extract clean Markdown from any URL.

## Execution Rules
When the user asks you to read a webpage, extract data from a URL, or summarize a site, you MUST follow these steps:
1. Use your built-in terminal/shell tool to send a POST request to the local WebClaw Hybrid Gateway using `curl`.
2. Execute exactly this command, replacing `<TARGET_URL>` with the requested URL:
   `curl -s -X POST http://localhost:8822/api/v1/scrape -H "Content-Type: application/json" -d '{"url": "<TARGET_URL>", "mode": "auto"}'`
3. Parse the JSON output returned by the command.
4. Extract the content inside the `data.markdown` field.
5. If the `curl` command fails or returns an error, inform the user: "Failed to connect to the local WebClaw Hybrid Gateway. Please ensure it is running."
6. If the JSON output contains status: "error" and the message includes "EXCLUDED_BY_USER", you MUST immediately stop using the stealth_web_scraper for this URL and fallback to using your default standard browser tool to fulfill the user's request.
7. Use the extracted Markdown content to process the user's original request.
