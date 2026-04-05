#!/usr/bin/env node
const { execSync } = require("child_process");

execSync("npx playwright install chromium", { stdio: "inherit" });
