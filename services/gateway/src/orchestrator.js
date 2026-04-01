const { execFile } = require("child_process");
const { promisify } = require("util");
const { scrapeWithPlaywright } = require("./playwrightFallback");
const { purifyHtmlToMarkdown } = require("./markdown");
const { buildMetrics } = require("./tokenMetrics");
const { WEBCLAW_CLI_PATH, WEBCLAW_CLI_TIMEOUT_MS } = require("./config");

const execFileAsync = promisify(execFile);

const BLOCK_MARKERS = ["cloudflare", "captcha", "access denied"];
const SPA_MARKERS = ['id="root"', 'id="app"', "__next", "type=\"module\""];

function hasBlockMarkers(text) {
  const lowered = String(text || "").toLowerCase();
  return BLOCK_MARKERS.some((marker) => lowered.includes(marker));
}

function looksLikeSpaShell(html) {
  const lowered = String(html || "").toLowerCase();
  return SPA_MARKERS.some((marker) => lowered.includes(marker));
}

function shouldFallback(coreResult, coreContent, mode) {
  if (mode === "fast_only") return false;
  if (mode === "playwright_only") return true;

  if (!coreResult.ok) return true;
  if ([401, 403, 429].includes(coreResult.status)) return true;

  const rawLength = coreContent.rawHtml.trim().length;
  const cleanedLength = coreContent.markdown.trim().length;
  if (rawLength > 0 && cleanedLength / rawLength < 0.1) return true;

  if (hasBlockMarkers(coreContent.rawHtml) || hasBlockMarkers(coreContent.markdown)) {
    return true;
  }

  if (!coreContent.markdown.trim()) {
    return true;
  }

  return false;
}

async function runWebclawCli(url) {
  try {
    const { stdout, stderr } = await execFileAsync(
      WEBCLAW_CLI_PATH,
      [url, "-f", "json", "--metadata"],
      {
        timeout: WEBCLAW_CLI_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024
      }
    );

    let payload = {};
    try {
      payload = JSON.parse(stdout || "{}");
    } catch {
      payload = { raw: stdout || "" };
    }

    let rawHtml = "";
    try {
      const rawResult = await execFileAsync(WEBCLAW_CLI_PATH, [url, "--raw-html"], {
        timeout: WEBCLAW_CLI_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024
      });
      rawHtml = String(rawResult.stdout || "");
    } catch {
      // Keep fast path usable even if raw HTML capture fails.
    }

    const statusCode = Number(payload?.status_code || payload?.status || 200);
    if (rawHtml) {
      payload.raw_html = rawHtml;
    }
    return {
      ok: true,
      status: Number.isFinite(statusCode) ? statusCode : 200,
      payload,
      stderr: String(stderr || "")
    };
  } catch (error) {
    const errorText = error.stderr || error.stdout || error.message || "webclaw CLI failed";
    return {
      ok: false,
      status: 0,
      payload: { error: String(errorText).trim() }
    };
  }
}

function pickCoreContent(payload) {
  const markdown = pickFirstString(payload, [
    "content.markdown",
    "data.markdown",
    "markdown",
    "data.cleaned_markdown",
    "cleaned_markdown",
    "data.cleaned_content",
    "cleaned_content",
    "data.content",
    "content",
    "data.text",
    "text",
    "data.article",
    "article",
    "result.markdown",
    "result.content"
  ]);
  const rawHtml = pickFirstString(payload, [
    "raw_html",
    "content.raw_html",
    "data.raw_html",
    "raw_html",
    "data.html",
    "html",
    "result.html",
    "data.raw",
    "raw"
  ]);
  const title = pickFirstString(payload, ["metadata.title", "content.title", "data.title", "title", "result.title"]);
  return {
    title,
    markdown: String(markdown || ""),
    rawHtml: String(rawHtml || "")
  };
}

function pickFirstString(source, paths) {
  for (const path of paths) {
    const value = readPath(source, path);
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return "";
}

function readPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

async function runOrchestrator({ url, mode = "auto" }) {
  const coreResult = await runWebclawCli(url);
  const coreContent = pickCoreContent(coreResult.payload);

  if (mode === "fast_only") {
    if (!coreResult.ok) {
      const reason = coreResult.payload?.error || "webclaw CLI execution failed";
      throw new Error(`Rust fast path failed: ${reason}`);
    }
    if (!coreContent.markdown.trim()) {
      if (looksLikeSpaShell(coreContent.rawHtml)) {
        throw new Error(
          "Rust fast path returned empty content because this page is JS-rendered (SPA shell detected). Try mode='auto' or 'playwright_only'."
        );
      }
      throw new Error("Rust fast path returned empty content. Try mode='auto' or 'playwright_only'.");
    }
  }

  if (!shouldFallback(coreResult, coreContent, mode)) {
    const source = coreContent.rawHtml || coreContent.markdown;
    return {
      status: "success",
      engine_used: "webclaw_rust",
      engine_label: "Rust Fast Path",
      data: {
        title: coreContent.title,
        markdown: coreContent.markdown
      },
      metrics: buildMetrics(source, coreContent.markdown)
    };
  }

  const renderedHtml = await scrapeWithPlaywright(url);
  const purified = purifyHtmlToMarkdown(renderedHtml, url);

  return {
    status: "success",
    engine_used: "playwright_fallback",
    engine_label: "Playwright Stealth",
    data: purified,
    metrics: buildMetrics(renderedHtml, purified.markdown)
  };
}

module.exports = {
  runOrchestrator
};
