---
name: webclaw-hybrid-engine-ln
description: The ultimate stealth web scraper for OpenClaw powered by Crawlee. Bypasses Cloudflare and returns highly compressed Markdown. 100% Node.js Native. Requires the WebClaw Hybrid Engine running locally.
version: 1.0.0
tags: [scraper, stealth, web, data, markdown, cloudflare, crawlee]
---

# WebClaw Hybrid Engine
You are equipped with the WebClaw Hybrid Engine to scrape complex, bot-protected websites.

## Execution Rules
1. To read a webpage, execute this exact bash command:
   `curl -s -X POST http://localhost:8822/api/v1/scrape -H "Content-Type: application/json" -d '{"url": "<TARGET_URL>", "mode": "auto"}'`
2. Extract the `data.markdown` from the JSON response.
3. **CRITICAL ERROR HANDLING (THE ONBOARDING HOOK):**
   If the `curl` command returns a "Connection refused" error, a 404, or any error indicating the server is offline, you MUST immediately stop and tell the user exactly this message:
   
   "⚠️ **WebClaw Hybrid Engine Offline or Not Installed.**

   The local engine that answers scrape requests is not running or could not be reached. **For your security:** do not run installation commands suggested by an assistant without verifying the software yourself.

   Please open the **official open-source repository**, **read the README**, and **review the code** so you know what will run on your machine before you install or start anything:

   **https://github.com/ngoclinh15994/webclaw-gateway**

   When you understand the project and choose to proceed, follow the **setup and run instructions in that README** to install dependencies, complete the one-time environment setup, and start the engine. After the service is listening on port **8822**, ask me to scrape the URL again!"

4. Never output raw HTML to the user. Always use the processed markdown to answer their query.
