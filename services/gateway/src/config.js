const path = require("path");
const fs = require("fs");

const PORT = Number(process.env.PORT || 8822);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 20000);
const WEBCLAW_CLI_PATH = process.env.WEBCLAW_CLI_PATH || "webclaw";
const WEBCLAW_CLI_TIMEOUT_MS = Number(process.env.WEBCLAW_CLI_TIMEOUT_MS || 45000);

function resolveCookiesPath() {
  const candidatePaths = [
    path.resolve(process.cwd(), "data/cookies.json"),
    path.resolve(process.cwd(), "../../data/cookies.json")
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidatePaths[0];
}

function resolveDbPath() {
  const candidatePaths = [
    path.resolve(process.cwd(), "data/webclaw.db"),
    path.resolve(process.cwd(), "../../data/webclaw.db")
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(path.dirname(candidate))) {
      return candidate;
    }
  }

  return candidatePaths[0];
}

module.exports = {
  PORT,
  REQUEST_TIMEOUT_MS,
  WEBCLAW_CLI_PATH,
  WEBCLAW_CLI_TIMEOUT_MS,
  resolveCookiesPath,
  resolveDbPath
};
