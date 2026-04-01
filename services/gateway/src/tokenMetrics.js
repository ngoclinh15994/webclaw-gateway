let encoder;

function getEncoder() {
  if (encoder) return encoder;
  try {
    const { get_encoding } = require("tiktoken");
    encoder = get_encoding("cl100k_base");
    return encoder;
  } catch {
    return null;
  }
}

function countTokens(value) {
  const text = String(value || "");
  const enc = getEncoder();
  if (!enc) {
    return Math.ceil(text.length / 4);
  }
  return enc.encode(text).length;
}

function buildMetrics(rawInput, markdownOutput) {
  const rawTokens = countTokens(rawInput);
  const cleanedTokens = countTokens(markdownOutput);
  const tokensSaved = Math.max(rawTokens - cleanedTokens, 0);
  const reductionPercentage =
    rawTokens > 0 ? Number((((rawTokens - cleanedTokens) / rawTokens) * 100).toFixed(2)) : 0;

  return {
    raw_tokens: rawTokens,
    cleaned_tokens: cleanedTokens,
    tokens_saved: tokensSaved,
    reduction_percentage: reductionPercentage
  };
}

module.exports = {
  buildMetrics
};
