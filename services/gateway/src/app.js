process.env.CRAWLEE_LOG_LEVEL = process.env.CRAWLEE_LOG_LEVEL || "WARNING";

const express = require("express");
const path = require("path");
const os = require("os");
const fs = require("fs/promises");
const fsSync = require("fs");
const { PORT } = require("./config");
const { runOrchestrator } = require("./orchestrator");
const { ensureCookiesFile, writeCookies, readCookies, normalizeCookiesForStorage } = require("./cookies");
const { ensureSettingsFile, readSettings, writeSettings, isExcludedUrl } = require("./settings");
const {
  runMigrations,
  insertScrapeHistory,
  listScrapeHistory,
  countScrapeHistory,
  getAggregateStats
} = require("./db");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.resolve(__dirname, "../ui")));

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.post("/api/v1/scrape", async (req, res) => {
  try {
    const { url, mode = "auto", extract_mode = "article" } = req.body || {};
    if (!url) {
      return res.status(400).json({ status: "error", message: "url is required" });
    }

    const settings = await readSettings();
    if (isExcludedUrl(url, settings.exclude_urls)) {
      return res.status(400).json({
        status: "error",
        message: "EXCLUDED_BY_USER: This URL is blacklisted by user settings. Please use your default browser tool."
      });
    }

    if (!["auto", "fast_only", "playwright_only"].includes(mode)) {
      return res.status(400).json({ status: "error", message: "invalid mode" });
    }
    if (!["article", "ecommerce"].includes(extract_mode)) {
      return res.status(400).json({ status: "error", message: "invalid extract_mode" });
    }
    const result = await runOrchestrator({ url, mode, extract_mode });
    if (result.status === "success" && result.metrics) {
      insertScrapeHistory({
        url,
        engine_used: result.engine_used || "",
        raw_tokens: Number(result.metrics.raw_tokens || 0),
        cleaned_tokens: Number(result.metrics.cleaned_tokens || 0),
        tokens_saved: Number(result.metrics.tokens_saved || 0),
        reduction_percentage: Number(result.metrics.reduction_percentage || 0)
      });
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message || "Unexpected error"
    });
  }
});

app.get("/api/v1/history", (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit || 50);
    const requestedOffset = Number(req.query.offset || 0);
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 50, 1), 200);
    const offset = Math.max(Number.isFinite(requestedOffset) ? requestedOffset : 0, 0);

    const items = listScrapeHistory(limit, offset);
    const total = countScrapeHistory();

    return res.json({
      status: "success",
      items,
      pagination: { limit, offset, total }
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/api/v1/stats", (_, res) => {
  try {
    const stats = getAggregateStats();
    return res.json({ status: "success", stats });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/api/v1/integrate/openclaw/status", (_, res) => {
  try {
    const homeDir = os.homedir();
    const openclawRoot = path.join(homeDir, ".openclaw");
    const skillPath = path.join(openclawRoot, "skills", "webclaw_scraper", "SKILL.md");
    const installed = fsSync.existsSync(skillPath);
    const openclawRootExists = fsSync.existsSync(openclawRoot);
    return res.json({ status: "success", installed, openclawRootExists });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

app.post("/api/v1/integrate/openclaw", async (_, res) => {
  try {
    const homeDir = os.homedir();
    const openclawRoot = path.join(homeDir, ".openclaw");
    const targetDirectory = path.join(openclawRoot, "skills", "webclaw_scraper");
    const targetFile = path.join(targetDirectory, "SKILL.md");
    const templatePath = path.resolve(__dirname, "./templates/openclaw-skill.md");

    try {
      await fs.access(openclawRoot);
    } catch {
      return res.status(404).json({
        status: "error",
        message: "OpenClaw is not installed on this machine."
      });
    }

    await fs.mkdir(targetDirectory, { recursive: true });
    const templateContent = await fs.readFile(templatePath, "utf8");
    await fs.writeFile(targetFile, templateContent, "utf8");

    return res.json({
      status: "success",
      message: "WebClaw Skill successfully installed into OpenClaw!"
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/api/v1/settings", async (_, res) => {
  try {
    const settings = await readSettings();
    return res.json({ status: "success", settings });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

app.post("/api/v1/settings", async (req, res) => {
  try {
    const payload = req.body || {};
    if (!Array.isArray(payload.exclude_urls)) {
      return res.status(400).json({ status: "error", message: "exclude_urls must be an array" });
    }
    const settings = await writeSettings(payload);
    return res.json({ status: "success", settings });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/api/v1/cookies", async (_, res) => {
  try {
    const cookies = await readCookies();
    return res.json({ status: "success", cookies });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

app.post("/api/v1/cookies", async (req, res) => {
  try {
    const { cookies } = req.body || {};
    if (!Array.isArray(cookies)) {
      return res.status(400).json({ status: "error", message: "cookies must be an array" });
    }
    const normalized = normalizeCookiesForStorage(cookies);
    await writeCookies(normalized);
    return res.json({ status: "success", count: normalized.length });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

async function start() {
  await ensureCookiesFile();
  await ensureSettingsFile();
  runMigrations();
  app.listen(PORT, () => {
    console.log(`webclaw-hybrid-engine-ln listening on :${PORT}`);
    console.log(`Ready on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start gateway:", err);
  process.exit(1);
});
