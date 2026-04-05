const { CheerioCrawler, PlaywrightCrawler, Configuration } = require("crawlee");
const { purifyHtmlToMarkdown } = require("./markdown");
const { buildMetrics } = require("./tokenMetrics");
const { readCookies, filterCookiesForUrl, sanitizeCookiesForPlaywright } = require("./cookies");
const { fetchHtmlViaExtensionSocket } = require("./extensionFallback");

const BLOCK_MARKERS = ["cloudflare", "captcha", "access denied"];
const SPA_MARKERS = ['id="root"', 'id="app"', "__next", 'type="module"'];

const REQUEST_TIMEOUT_SECS = 30;
const MIN_BODY_CHARS = 600;

function ephemeralConfiguration() {
  return new Configuration({ persistStorage: false });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function hasBlockMarkers(text) {
  const lowered = String(text || "").toLowerCase();
  return BLOCK_MARKERS.some((m) => lowered.includes(m));
}

function looksLikeSpaShell(html) {
  const lowered = String(html || "").toLowerCase();
  return SPA_MARKERS.some((m) => lowered.includes(m));
}

function bodyHtmlLengthApprox(html) {
  const m = String(html || "").match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1].length : String(html || "").length;
}

function shouldFallbackCheerioHtml(html, extractMode) {
  if (!html || html.length < 200) return true;
  if (hasBlockMarkers(html)) return true;
  const bl = bodyHtmlLengthApprox(html);
  if (bl < MIN_BODY_CHARS) return true;
  if (extractMode === "article" && looksLikeSpaShell(html)) return true;
  return false;
}

async function loadPlaywrightCookies(targetUrl) {
  const rows = await readCookies();
  let host = "";
  try {
    host = new URL(targetUrl).hostname;
  } catch {
    /* ignore */
  }
  return sanitizeCookiesForPlaywright(filterCookiesForUrl(rows, targetUrl), host);
}

async function cheerioFetchHtml(url) {
  const state = { html: null, status: 0, err: null };
  const crawler = new CheerioCrawler(
    {
      maxRequestsPerCrawl: 1,
      maxConcurrency: 1,
      maxRequestRetries: 1,
      requestHandlerTimeoutSecs: REQUEST_TIMEOUT_SECS,
      navigationTimeoutSecs: REQUEST_TIMEOUT_SECS,
      async requestHandler({ $, response }) {
        const sc = response.statusCode;
        state.status = sc;
        if (sc >= 400) {
          throw new Error(`HTTP ${sc}`);
        }
        state.html = $.root().html() || $.html() || "";
      },
      failedRequestHandler({ error }) {
        state.err = error;
      }
    },
    ephemeralConfiguration()
  );

  await crawler.run([url]);
  if (state.err) throw state.err;
  if (!state.html) throw new Error("Empty Cheerio HTML");
  return { html: state.html, statusCode: state.status };
}

async function playwrightFetchHtml(url, extractMode) {
  const cookies = await loadPlaywrightCookies(url);
  const state = { html: null, err: null };

  const crawler = new PlaywrightCrawler(
    {
      headless: true,
      maxRequestsPerCrawl: 1,
      maxConcurrency: 1,
      maxRequestRetries: 0,
      requestHandlerTimeoutSecs: REQUEST_TIMEOUT_SECS,
      navigationTimeoutSecs: REQUEST_TIMEOUT_SECS,
      launchContext: {
        launchOptions: {
          headless: true,
          args: ["--no-sandbox", "--disable-dev-shm-usage"]
        }
      },
      preNavigationHooks: [
        async ({ page }) => {
          if (!cookies.length) return;
          try {
            await page.context().addCookies(cookies);
          } catch {
            /* ignore */
          }
        }
      ],
      async requestHandler({ page, response }) {
        const sc = response && typeof response.status === "function" ? response.status() : null;
        if (sc != null && sc >= 400) {
          throw new Error(`HTTP ${sc}`);
        }
        await page.waitForLoadState("domcontentloaded", { timeout: REQUEST_TIMEOUT_SECS * 1000 }).catch(() => {});
        if (extractMode === "ecommerce") {
          await page.evaluate(() => window.scrollBy(0, window.innerHeight)).catch(() => {});
          await delay(1500);
        } else {
          await delay(500);
        }
        state.html = await page.content();
      },
      failedRequestHandler({ error }) {
        state.err = error;
      }
    },
    ephemeralConfiguration()
  );

  await crawler.run([url]);
  if (state.err) throw state.err;
  if (!state.html) throw new Error("Empty Playwright HTML");
  return state.html;
}

const ENGINE_LABEL_DEFAULT = "Crawlee Hybrid (Cheerio + Playwright)";
const ENGINE_LABEL_EXT = "Extension WebSocket fallback";

async function runOrchestrator({ url, mode = "auto", extract_mode = "article" }) {
  const extractMode = extract_mode === "ecommerce" ? "ecommerce" : "article";

  if (extractMode === "ecommerce" && mode === "fast_only") {
    throw new Error(
      "extract_mode 'ecommerce' cannot be used with mode 'fast_only'. Use 'auto' or 'playwright_only'."
    );
  }

  let html = "";
  let engine_used = "crawlee_cheerio";
  let engine_label = ENGINE_LABEL_DEFAULT;

  if (mode === "playwright_only") {
    try {
      html = await playwrightFetchHtml(url, extractMode);
      engine_used = "crawlee_playwright";
    } catch (e1) {
      const extHtml = await fetchHtmlViaExtensionSocket(url);
      if (!extHtml) throw e1;
      html = extHtml;
      engine_used = "extension_ws";
      engine_label = ENGINE_LABEL_EXT;
    }
  } else if (mode === "fast_only") {
    const { html: h } = await cheerioFetchHtml(url);
    html = h;
    if (shouldFallbackCheerioHtml(html, extractMode)) {
      throw new Error(
        'Cheerio fast path returned insufficient HTML (SPA or blocked). Use mode "auto" or "playwright_only".'
      );
    }
  } else {
    try {
      const { html: h } = await cheerioFetchHtml(url);
      html = h;
      if (shouldFallbackCheerioHtml(html, extractMode)) {
        throw new Error("cheerio_fallback");
      }
    } catch {
      try {
        html = await playwrightFetchHtml(url, extractMode);
        engine_used = "crawlee_playwright";
      } catch (e2) {
        const extHtml = await fetchHtmlViaExtensionSocket(url);
        if (!extHtml) throw e2;
        html = extHtml;
        engine_used = "extension_ws";
        engine_label = ENGINE_LABEL_EXT;
      }
    }
  }

  const purified = purifyHtmlToMarkdown(html, url, { extractMode });
  return {
    status: "success",
    extract_mode: extractMode,
    engine_used,
    engine_label,
    data: purified,
    metrics: buildMetrics(html, purified.markdown)
  };
}

module.exports = {
  runOrchestrator
};
