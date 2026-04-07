#!/usr/bin/env node
const { execSync, spawnSync } = require("child_process");
const path = require("path");

const SERVICE_NAME = "webclaw-gateway";

const argv = process.argv.slice(2);
const wantsService = argv.includes("--service");
const wantsStop = argv.includes("--stop");
const wantsStatus = argv.includes("--status");

const modeFlags = [wantsService, wantsStop, wantsStatus].filter(Boolean).length;
if (modeFlags > 1) {
  console.error("Use only one of: --service, --stop, --status");
  process.exit(1);
}

function packageRoot() {
  return path.join(__dirname, "..");
}

function gatewayAppPath() {
  return path.join(packageRoot(), "services", "gateway", "src", "app.js");
}

/**
 * @returns {{ kind: 'pm2', args: string[] } | null}
 */
function resolvePm2Invoker() {
  if (spawnSync("pm2", ["-v"], { stdio: "ignore" }).status === 0) {
    return { kind: "pm2", args: [] };
  }
  if (
    spawnSync("npx", ["--yes", "pm2", "-v"], { stdio: "ignore", shell: true }).status === 0
  ) {
    return { kind: "npx", args: ["--yes", "pm2"] };
  }
  return null;
}

/**
 * @param {string[]} pmArgs arguments after `pm2` (e.g. ['start', 'file.js', '--name', 'x'])
 * @param {{ stdio?: import('child_process').StdioOptions }} [opts]
 */
function runPm2(pmArgs, opts = {}) {
  const invoker = resolvePm2Invoker();
  if (!invoker) {
    console.error("PM2 is not available. Install it globally, then try again:");
    console.error("  npm install -g pm2");
    process.exit(1);
  }
  const { stdio = "inherit" } = opts;
  if (invoker.kind === "pm2") {
    return spawnSync("pm2", pmArgs, { stdio });
  }
  return spawnSync("npx", [...invoker.args, ...pmArgs], { stdio, shell: true });
}

function runPlaywrightChromiumInstall() {
  try {
    execSync("npx playwright install chromium", {
      cwd: packageRoot(),
      stdio: "ignore"
    });
  } catch {
    console.warn(
      "⚠️ Note: Could not auto-install Playwright browser. If scraping fails, manually run: npx playwright install chromium"
    );
  }
}

function pm2ProcessList() {
  const invoker = resolvePm2Invoker();
  if (!invoker) return null;
  const args = ["jlist"];
  const r =
    invoker.kind === "pm2"
      ? spawnSync("pm2", args, { encoding: "utf8" })
      : spawnSync("npx", [...invoker.args, ...args], { encoding: "utf8", shell: true });
  if (r.status !== 0) return null;
  try {
    return JSON.parse(r.stdout || "[]");
  } catch {
    return null;
  }
}

function isServiceOnline() {
  const list = pm2ProcessList();
  if (!Array.isArray(list)) return false;
  const app = list.find((p) => p && p.name === SERVICE_NAME);
  return Boolean(app && app.pm2_env && app.pm2_env.status === "online");
}

function isServiceRegistered() {
  const list = pm2ProcessList();
  if (!Array.isArray(list)) return false;
  return list.some((p) => p && p.name === SERVICE_NAME);
}

function startBackgroundService() {
  runPlaywrightChromiumInstall();
  process.env.WEBCLAW_OPEN_BROWSER = "0";

  const root = packageRoot();
  const entry = gatewayAppPath();
  const startArgs = ["start", entry, "--name", SERVICE_NAME, "--cwd", root, "--update-env"];

  if (isServiceOnline()) {
    console.log(`"${SERVICE_NAME}" is already online in PM2. Restarting...`);
    const restart = runPm2(["restart", SERVICE_NAME, "--update-env"]);
    if ((restart.status ?? 1) === 0) {
      console.log(`✅ "${SERVICE_NAME}" restarted.`);
    }
    process.exit(restart.status ?? 1);
  }

  if (isServiceRegistered()) {
    console.log(`"${SERVICE_NAME}" exists in PM2 but is not online. Starting...`);
    const startExisting = runPm2(["start", SERVICE_NAME]);
    if ((startExisting.status ?? 1) === 0) {
      console.log(`✅ PM2 process "${SERVICE_NAME}" is online.`);
      console.log(`   Tip: pm2 logs ${SERVICE_NAME}  |  pm2 monit`);
    }
    process.exit(startExisting.status ?? 1);
  }

  console.log(`Starting "${SERVICE_NAME}" with PM2...`);
  const started = runPm2(startArgs);
  if ((started.status ?? 1) !== 0) {
    process.exit(started.status ?? 1);
  }
  console.log(`✅ Background service "${SERVICE_NAME}" started.`);
  console.log(`   Tip: pm2 logs ${SERVICE_NAME}  |  pm2 monit`);
  process.exit(0);
}

function stopBackgroundService() {
  const deleted = runPm2(["delete", SERVICE_NAME]);
  if ((deleted.status ?? 1) === 0) {
    console.log(`✅ Stopped and removed PM2 process "${SERVICE_NAME}".`);
    process.exit(0);
  }
  const stopped = runPm2(["stop", SERVICE_NAME]);
  if ((stopped.status ?? 1) === 0) {
    console.log(`✅ Stopped PM2 process "${SERVICE_NAME}".`);
    process.exit(0);
  }
  console.error(`Could not stop "${SERVICE_NAME}". It may not be running.`);
  console.error(`Check with: npx webclaw-hybrid-engine-ln --status`);
  process.exit(deleted.status ?? stopped.status ?? 1);
}

function showBackgroundStatus() {
  if (!resolvePm2Invoker()) {
    console.error("PM2 is not available. Install it globally:");
    console.error("  npm install -g pm2");
    process.exit(1);
  }
  if (!isServiceRegistered()) {
    console.log(`"${SERVICE_NAME}" is not running (no PM2 process with that name).`);
    process.exit(0);
  }
  const r = runPm2(["describe", SERVICE_NAME], { stdio: "inherit" });
  process.exit(r.status === 0 ? 0 : 1);
}

if (wantsStop) {
  stopBackgroundService();
} else if (wantsStatus) {
  showBackgroundStatus();
} else if (wantsService) {
  startBackgroundService();
} else {
  console.log("🚀 Booting WebClaw Hybrid Engine...");
  runPlaywrightChromiumInstall();
  console.log("✅ Engine dependencies verified. Starting Gateway...");

  require(gatewayAppPath());
}
