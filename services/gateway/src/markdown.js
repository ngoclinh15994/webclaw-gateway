const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const TurndownService = require("turndown");

function purifyHtmlToMarkdown(html, pageUrl) {
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

module.exports = { purifyHtmlToMarkdown };
