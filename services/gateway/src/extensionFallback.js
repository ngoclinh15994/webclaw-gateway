/**
 * Level-3 fallback: optional Chrome extension bridge over WebSocket.
 * Set WEBCLAW_EXTENSION_WS (e.g. ws://127.0.0.1:18765) and have the extension
 * accept `{ "type":"scrape","url":"..." }` and reply `{ "html":"..." }`.
 */
const WebSocket = require("ws");

const EXTENSION_WS = process.env.WEBCLAW_EXTENSION_WS || "";
const EXTENSION_TIMEOUT_MS = Number(process.env.WEBCLAW_EXTENSION_TIMEOUT_MS || 25000);

async function fetchHtmlViaExtensionSocket(url) {
  if (!EXTENSION_WS) return null;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (html) => {
      if (settled) return;
      settled = true;
      resolve(html);
    };

    let ws;
    try {
      ws = new WebSocket(EXTENSION_WS);
    } catch {
      return resolve(null);
    }

    const timer = setTimeout(() => {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      finish(null);
    }, EXTENSION_TIMEOUT_MS);

    ws.on("open", () => {
      try {
        ws.send(JSON.stringify({ type: "scrape", url }));
      } catch {
        clearTimeout(timer);
        finish(null);
      }
    });

    ws.on("message", (buf) => {
      try {
        const msg = JSON.parse(buf.toString());
        if (typeof msg.html === "string" && msg.html.length > 0) {
          clearTimeout(timer);
          try {
            ws.close();
          } catch {
            /* ignore */
          }
          finish(msg.html);
        }
      } catch {
        /* ignore */
      }
    });

    ws.on("error", () => {
      clearTimeout(timer);
      finish(null);
    });

    ws.on("close", () => {
      clearTimeout(timer);
      finish(null);
    });
  });
}

module.exports = { fetchHtmlViaExtensionSocket };
