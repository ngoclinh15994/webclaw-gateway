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
        path: "/"
      };
    })
    .filter(Boolean);
}

/**
 * Playwright accepts sameSite only as Strict | Lax | None (case-sensitive).
 */
function normalizeSameSiteValue(raw) {
  if (raw == null || raw === "") return null;
  const normalized = String(raw).toLowerCase();
  if (normalized === "strict") return "Strict";
  if (normalized === "lax") return "Lax";
  if (normalized === "none") return "None";
  return null;
}

/**
 * Incoming POST /api/v1/cookies: normalize manual cookie_string rows and strip
 * invalid attributes from extension-synced objects before persisting.
 */
function normalizeCookiesForStorage(entries) {
  if (!Array.isArray(entries)) return [];
  const out = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;

    if (entry.domain && entry.cookie_string) {
      out.push(...parseCookieString(entry.domain, entry.cookie_string));
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(entry, "name") && entry.value != null && entry.domain) {
      const row = {
        name: String(entry.name),
        value: String(entry.value),
        domain: String(entry.domain).replace(/^\./, "").toLowerCase(),
        path: entry.path ? String(entry.path) : "/"
      };
      const ss = normalizeSameSiteValue(entry.sameSite);
      if (ss) row.sameSite = ss;
      if (entry.secure !== undefined) row.secure = Boolean(entry.secure);
      if (entry.httpOnly !== undefined) row.httpOnly = Boolean(entry.httpOnly);
      if (entry.expires !== undefined && Number.isFinite(Number(entry.expires))) {
        row.expires = Math.round(Number(entry.expires));
      }
      out.push(row);
    }
  }
  return out;
}

/**
 * Strict whitelist for context.addCookies — fixes invalid/lowercase sameSite and strips junk.
 * @param {string} [fallbackHost] - hostname from target URL when cookie.domain is missing
 */
function sanitizeCookiesForPlaywright(cookies, fallbackHost) {
  if (!Array.isArray(cookies)) return [];
  const host = fallbackHost ? String(fallbackHost).replace(/^\./, "").toLowerCase() : "";
  return cookies
    .map((c) => {
      if (!c || typeof c !== "object" || !c.name || !Object.prototype.hasOwnProperty.call(c, "value")) {
        return null;
      }
      const domainRaw = c.domain || host;
      if (!domainRaw) return null;
      const validCookie = {
        name: String(c.name),
        value: String(c.value),
        domain: String(domainRaw).replace(/^\./, "").toLowerCase(),
        path: c.path || "/"
      };

      if (c.sameSite != null && c.sameSite !== "") {
        const normalized = String(c.sameSite).toLowerCase();
        if (normalized === "strict") validCookie.sameSite = "Strict";
        else if (normalized === "lax") validCookie.sameSite = "Lax";
        else if (normalized === "none") validCookie.sameSite = "None";
      }

      if (c.secure !== undefined) validCookie.secure = Boolean(c.secure);
      if (c.httpOnly !== undefined) validCookie.httpOnly = Boolean(c.httpOnly);
      if (c.expires !== undefined && Number.isFinite(Number(c.expires))) {
        validCookie.expires = Number(c.expires);
      }

      if (validCookie.sameSite === "None") {
        validCookie.secure = true;
      }

      return validCookie;
    })
    .filter(Boolean);
}

module.exports = {
  readCookies,
  writeCookies,
  filterCookiesForUrl,
  ensureCookiesFile,
  normalizeCookiesForStorage,
  sanitizeCookiesForPlaywright
};
