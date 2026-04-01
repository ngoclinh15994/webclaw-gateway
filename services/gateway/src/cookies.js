const fs = require("fs/promises");
const path = require("path");
const { resolveCookiesPath } = require("./config");

const cookiesPath = resolveCookiesPath();

async function ensureCookiesFile() {
  await fs.mkdir(path.dirname(cookiesPath), { recursive: true });
  try {
    await fs.access(cookiesPath);
  } catch {
    await fs.writeFile(cookiesPath, "[]", "utf8");
  }
}

async function readCookies() {
  await ensureCookiesFile();
  const raw = await fs.readFile(cookiesPath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Keep fallback scraping resilient even when cookie storage is malformed.
    await fs.writeFile(cookiesPath, "[]", "utf8");
    return [];
  }
}

async function writeCookies(cookies) {
  await ensureCookiesFile();
  await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2), "utf8");
}

function filterCookiesForUrl(cookies, targetUrl) {
  const url = new URL(targetUrl);
  const host = url.hostname.toLowerCase();
  const isHttps = url.protocol === "https:";

  return cookies
    .flatMap((cookie) => normalizeCookieEntry(cookie, host))
    .filter((cookie) => {
    if (!cookie || typeof cookie !== "object" || !cookie.name || !cookie.value) {
      return false;
    }

    const domain = (cookie.domain || host).replace(/^\./, "").toLowerCase();
    const domainMatch = host === domain || host.endsWith(`.${domain}`);
    if (!domainMatch) return false;

    if (cookie.secure && !isHttps) return false;
    return true;
  });
}

function normalizeCookieEntry(entry, fallbackDomain) {
  if (!entry || typeof entry !== "object") return [];

  if (entry.name && Object.hasOwn(entry, "value")) {
    return [entry];
  }

  if (entry.domain && entry.cookie_string) {
    return parseCookieString(entry.domain, entry.cookie_string, fallbackDomain);
  }

  return [];
}

function parseCookieString(domain, cookieString) {
  const safeDomain = String(domain || "").replace(/^\./, "").toLowerCase();
  return String(cookieString || "")
    .split(";")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const eqIdx = pair.indexOf("=");
      if (eqIdx <= 0) return null;
      const name = pair.slice(0, eqIdx).trim();
      const value = pair.slice(eqIdx + 1).trim();
      if (!name) return null;
      return {
        name,
        value,
        domain: safeDomain,
        path: "/",
        secure: true,
        httpOnly: false
      };
    })
    .filter(Boolean);
}

module.exports = {
  readCookies,
  writeCookies,
  filterCookiesForUrl,
  ensureCookiesFile
};
