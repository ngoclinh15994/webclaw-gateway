const fs = require("fs/promises");
const path = require("path");
const { resolveDbPath } = require("./config");

const defaultSettings = {
  exclude_urls: []
};

function resolveSettingsPath() {
  return path.join(path.dirname(resolveDbPath()), "settings.json");
}

async function ensureSettingsFile() {
  const settingsPath = resolveSettingsPath();
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  try {
    await fs.access(settingsPath);
  } catch {
    await fs.writeFile(settingsPath, JSON.stringify(defaultSettings, null, 2), "utf8");
  }
}

async function readSettings() {
  await ensureSettingsFile();
  const settingsPath = resolveSettingsPath();
  const raw = await fs.readFile(settingsPath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return {
      exclude_urls: Array.isArray(parsed.exclude_urls)
        ? parsed.exclude_urls.filter((x) => typeof x === "string")
        : []
    };
  } catch {
    await writeSettings(defaultSettings);
    return { ...defaultSettings };
  }
}

async function writeSettings(nextSettings) {
  await ensureSettingsFile();
  const settingsPath = resolveSettingsPath();
  const payload = {
    exclude_urls: Array.isArray(nextSettings.exclude_urls)
      ? nextSettings.exclude_urls.filter((x) => typeof x === "string")
      : []
  };
  await fs.writeFile(settingsPath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

function isExcludedUrl(url, excludeUrls) {
  const input = String(url || "").toLowerCase();
  return excludeUrls.some((item) => input.includes(String(item || "").toLowerCase()));
}

module.exports = {
  ensureSettingsFile,
  readSettings,
  writeSettings,
  isExcludedUrl
};
