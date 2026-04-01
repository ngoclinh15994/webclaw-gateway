const { chromium } = require("playwright-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const { filterCookiesForUrl, readCookies } = require("./cookies");

chromium.use(stealthPlugin());

async function scrapeWithPlaywright(targetUrl) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });

  try {
    const context = await browser.newContext();
    const cookies = await readCookies();
    const scopedCookies = filterCookiesForUrl(cookies, targetUrl);
    if (scopedCookies.length > 0) {
      await context.addCookies(scopedCookies);
    }

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (["image", "stylesheet", "media", "font"].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Many news/SPA pages keep background requests alive indefinitely.
    // Load DOM quickly, then attempt a short idle wait as best-effort.
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    try {
      await page.waitForLoadState("networkidle", { timeout: 8000 });
    } catch {
      // Continue with currently rendered DOM when network never goes idle.
    }
    await page.waitForTimeout(1200);
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    return html;
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeWithPlaywright };
