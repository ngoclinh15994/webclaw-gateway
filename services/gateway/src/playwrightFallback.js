const { chromium } = require("playwright-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const { filterCookiesForUrl, readCookies, sanitizeCookiesForPlaywright } = require("./cookies");

chromium.use(stealthPlugin());

const NAV_TIMEOUT_MS = 30000;
const ECOMMERCE_SCROLL_MS = 8000;
const ECOMMERCE_POST_SCROLL_WAIT_MS = 2000;
const ECOMMERCE_FINGERPRINT_MS = 10000;
const ARTICLE_POST_GOTO_WAIT_MS = 1200;

/** Known anti-bot fingerprint noise (e.g. Akamai-style traps) */
const FINGERPRINT_TEXT_MARKERS = ["mmMwWLliI0fiflO&1"];

function isPlaywrightTimeoutError(error) {
  if (!error) return false;
  if (error.name === "TimeoutError") return true;
  const msg = String(error.message || "");
  return /timeout\s+\d+ms\s+exceeded/i.test(msg) || /waiting until/i.test(msg);
}

function isCriticalNavigationError(error) {
  const msg = String(error?.message || error || "");
  return (
    /net::ERR_NAME_NOT_RESOLVED/i.test(msg) ||
    /net::ERR_CONNECTION_REFUSED/i.test(msg) ||
    /net::ERR_INTERNET_DISCONNECTED/i.test(msg) ||
    /net::ERR_ADDRESS_UNREACHABLE/i.test(msg) ||
    /ENOTFOUND/i.test(msg) ||
    /ECONNREFUSED/i.test(msg) ||
    /ERR_NAME_NOT_RESOLVED/i.test(msg)
  );
}

function raceWithTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    })
  ]);
}

async function runFingerprintDomCleanup(page) {
  await page.evaluate((markers) => {
    const allElements = Array.from(document.querySelectorAll("*"));
    for (const el of allElements) {
      if (!el.isConnected) continue;
      let style;
      try {
        style = window.getComputedStyle(el);
      } catch {
        continue;
      }
      const text = el.textContent || "";
      const left = parseInt(style.left, 10);
      const top = parseInt(style.top, 10);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0" ||
        (!Number.isNaN(left) && left < -1000) ||
        (!Number.isNaN(top) && top < -1000) ||
        markers.some((m) => text.includes(m))
      ) {
        el.remove();
      }
    }
  }, FINGERPRINT_TEXT_MARKERS);
}

async function extractHtmlFromPage(page) {
  const rawHtml = await page.evaluate(() => {
    try {
      const contentNode =
        document.querySelector("main") ||
        document.querySelector("#main") ||
        document.querySelector('[role="main"]') ||
        document.body;

      if (!contentNode) {
        return "<html><body><p>Extraction failed: DOM body is empty or inaccessible.</p></body></html>";
      }

      const fragment =
        contentNode.innerHTML || contentNode.outerHTML || "";

      if (fragment.trim()) {
        return fragment;
      }

      const root = document.documentElement;
      if (root && root.outerHTML) {
        return root.outerHTML;
      }
      return "<html><body><p>Extraction failed: empty content.</p></body></html>";
    } catch (e) {
      const msg = e && e.message ? String(e.message) : String(e);
      return "<html><body><p>Extraction error: " + msg + "</p></body></html>";
    }
  });
  return rawHtml;
}

/**
 * @param {string} targetUrl
 * @param {{ extractMode?: "article" | "ecommerce" }} [options]
 */
async function scrapeWithPlaywright(targetUrl, options = {}) {
  const extractMode = options.extractMode || "article";
  const isEcommerce = extractMode === "ecommerce";

  let browser;
  let context;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"]
    });

    context = await browser.newContext();
    const cookies = await readCookies();
    const scopedCookies = filterCookiesForUrl(cookies, targetUrl);
    const targetHost = new URL(targetUrl).hostname;
    const sanitizedCookies = sanitizeCookiesForPlaywright(scopedCookies, targetHost);
    if (sanitizedCookies.length > 0) {
      await context.addCookies(sanitizedCookies);
    }

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
    page.setDefaultTimeout(NAV_TIMEOUT_MS);

    if (isEcommerce) {
      await page.route("**/*", (route) => {
        const type = route.request().resourceType();
        if (["image", "media"].includes(type)) {
          route.abort();
        } else {
          route.continue();
        }
      });
    } else {
      await page.route("**/*", (route) => {
        const type = route.request().resourceType();
        if (["image", "stylesheet", "media", "font"].includes(type)) {
          route.abort();
        } else {
          route.continue();
        }
      });
    }

    const gotoOptions = {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT_MS
    };

    try {
      await page.goto(targetUrl, gotoOptions);
    } catch (gotoError) {
      if (isCriticalNavigationError(gotoError)) {
        throw gotoError;
      }
      if (isPlaywrightTimeoutError(gotoError)) {
        console.warn(
          "[Playwright] Navigation timeout reached, but forcing extraction on current DOM..."
        );
      } else {
        throw gotoError;
      }
    }

    if (isEcommerce) {
      try {
        await raceWithTimeout(
          page.evaluate(() => window.scrollBy(0, window.innerHeight)),
          ECOMMERCE_SCROLL_MS,
          "ecommerce scroll"
        );
      } catch {
        // Salvage: partial DOM is still useful
      }
      try {
        await raceWithTimeout(
          new Promise((resolve) => setTimeout(resolve, ECOMMERCE_POST_SCROLL_WAIT_MS)),
          ECOMMERCE_POST_SCROLL_WAIT_MS + 500,
          "ecommerce post-scroll wait"
        );
      } catch {
        // ignore
      }
      try {
        await raceWithTimeout(runFingerprintDomCleanup(page), ECOMMERCE_FINGERPRINT_MS, "fingerprint cleanup");
      } catch {
        // ignore
      }
    } else {
      try {
        await raceWithTimeout(
          new Promise((resolve) => setTimeout(resolve, ARTICLE_POST_GOTO_WAIT_MS)),
          ARTICLE_POST_GOTO_WAIT_MS + 500,
          "article post-goto wait"
        );
      } catch {
        // ignore
      }
    }

    return await extractHtmlFromPage(page);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Playwright extraction failed: ${msg}`);
  } finally {
    try {
      if (context) {
        await context.close();
      }
    } catch {
      // ignore
    }
    try {
      if (browser) {
        await browser.close();
      }
    } catch {
      // ignore
    }
  }
}

module.exports = { scrapeWithPlaywright };
