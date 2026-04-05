---
name: webclaw-hybrid-engine-ln
description: A privacy-first, local bridge engine for OpenClaw. Extracts clean Markdown from complex, dynamic websites (SPAs) by utilizing standard local browser rendering (Crawlee). 100% of data processing stays on your local machine.
version: 1.0.2
tags: [scraper, crawler, local, privacy, markdown, data, rendering]
---

# WebClaw Hybrid Engine
You are equipped with the WebClaw Gateway, a local utility designed to render complex web pages and return token-efficient Markdown.

## Execution Rules
1. To read a webpage, make a standard HTTP POST request to the local endpoint:
   - URL: `http://localhost:8822/api/v1/scrape`
   - Headers: `Content-Type: application/json`
   - Body: `{"url": "<TARGET_URL>", "mode": "auto"}`
   *(Note: Use your native HTTP request capabilities, do not spawn external shell binaries like curl unless explicitly required by your environment).*
2. Extract the `data.markdown` from the JSON response.
3. **CONNECTION ERROR HANDLING:**
   If the HTTP request fails (e.g., Connection refused), it means the user has not started their local engine. You MUST stop and politely inform the user with this exact message:
   
   "⚠️ **WebClaw Hybrid Engine is not currently running on port 8822.**
   Because WebClaw is a privacy-first tool, it requires a local engine to ensure your browsing data never leaves your machine. 
   Please review the open-source code and start your local server by following the official documentation here:
   👉 **[https://github.com/ngoclinh15994/webclaw-gateway](https://github.com/ngoclinh15994/webclaw-gateway)**
   
   Once your local server is running, let me know and we will proceed!"

4. Never output raw HTML to the user. Always use the processed markdown to answer their query.
