const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const TurndownService = require("turndown");

const ECOMMERCE_STRIP_SELECTORS = [
  "script",
  "style",
  "noscript",
  "nav",
  "footer",
  "header",
  "svg",
  "[hidden]",
  '[aria-hidden="true"]'
];

function stripEcommerceNoise(body) {
  ECOMMERCE_STRIP_SELECTORS.forEach((sel) => {
    try {
      body.querySelectorAll(sel).forEach((el) => el.remove());
    } catch {
      // Invalid selector in edge environments — skip
    }
  });

  body.querySelectorAll("[style]").forEach((el) => {
    const s = (el.getAttribute("style") || "").toLowerCase();
    if (/display\s*:\s*none/.test(s) || /visibility\s*:\s*hidden/.test(s)) {
      el.remove();
    }
  });
}

function ecommerceHtmlToMarkdown(html, pageUrl) {
  const dom = new JSDOM(html, { url: pageUrl });
  const doc = dom.window.document;
  const body = doc.body;
  if (!body) {
    return {
      title: doc.title || "",
      markdown: ""
    };
  }

  stripEcommerceNoise(body);

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced"
  });
  turndown.addRule("dropNoscript", {
    filter: ["noscript"],
    replacement: () => ""
  });

  const markdown = turndown.turndown(body.innerHTML).trim();

  return {
    title: doc.title || "",
    markdown
  };
}

function articleHtmlToMarkdown(html, pageUrl) {
  const dom = new JSDOM(html, { url: pageUrl });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced"
  });

  const contentSource = article?.content || dom.window.document.body?.innerHTML || "";
  const markdown = turndown.turndown(contentSource).trim();

  return {
    title: article?.title || dom.window.document.title || "",
    markdown
  };
}

/**
 * @param {string} html
 * @param {string} pageUrl
 * @param {{ extractMode?: "article" | "ecommerce" }} [options]
 */
function purifyHtmlToMarkdown(html, pageUrl, options = {}) {
  const extractMode = options.extractMode || "article";
  if (extractMode === "ecommerce") {
    return ecommerceHtmlToMarkdown(html, pageUrl);
  }
  return articleHtmlToMarkdown(html, pageUrl);
}

module.exports = { purifyHtmlToMarkdown };
