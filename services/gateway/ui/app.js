const langToggleBtn = document.getElementById("lang-toggle-btn");
const installOpenclawBtn = document.getElementById("install-openclaw-btn");
const integrationMessage = document.getElementById("integration-message");
const serverHost = document.getElementById("server-host");
const serverStatus = document.getElementById("server-status");
const totalRequests = document.getElementById("total-requests");
const overallReductionPercent = document.getElementById("overall-reduction-percent");
const totalTokensSavedSub = document.getElementById("total-tokens-saved-sub");
const openclawModal = document.getElementById("openclaw-modal");
const openclawModalClose = document.getElementById("openclaw-modal-close");
const modalOsInfo = document.getElementById("modal-os-info");
const modalOpenclawStatus = document.getElementById("modal-openclaw-status");
const modalSkillPath = document.getElementById("modal-skill-path");
const modalInstallBtn = document.getElementById("modal-install-btn");
const modalInstallFeedback = document.getElementById("modal-install-feedback");

const INSTALL_BTN_CLASS_DEFAULT =
  "bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded";
const INSTALL_BTN_CLASS_INSTALLED =
  "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded shadow-sm ring-1 ring-emerald-500/30";

let openClawSkillInstalled = false;

const excludeForm = document.getElementById("exclude-form");
const excludeInput = document.getElementById("exclude-input");
const excludeError = document.getElementById("exclude-error");
const excludeList = document.getElementById("exclude-list");
let settingsState = { exclude_urls: [] };

const historyTable = document.getElementById("history-table");
const historyPrev = document.getElementById("history-prev");
const historyNext = document.getElementById("history-next");
const historyPage = document.getElementById("history-page");
const HISTORY_LIMIT = 10;
let historyOffset = 0;
let historyTotal = 0;

const cookieForm = document.getElementById("cookie-form");
const cookieError = document.getElementById("cookie-error");
const cookieTable = document.getElementById("cookie-table");
let cookiesState = [];

const I18N = {
  en: {
    titleMain: "WebClaw Hybrid Engine",
    subtitleKpi: "Primary KPI: token reduction percentage (%)",
    installSkill: "⚡ Install OpenClaw Skill",
    serverStatus: "Server Status",
    host: "Host",
    port: "Port",
    ready: "Ready",
    engineBadge: "Engine: Crawlee Hybrid (Cheerio + Playwright)",
    totalRequests: "Total Requests",
    overallReductionKpi: "Overall Reduction",
    tokensSavedSubLine: "{n} total tokens saved",
    installSkillInstalled: "✅ OpenClaw Skill Installed",
    wizardTitle: "OpenClaw Skill Installation",
    wizardClose: "Close",
    wizardStep1: "[⏳] Initializing WebClaw Hybrid Engine integration...",
    wizardStep2Search: "[⏳] Searching for OpenClaw installation directory (~/.openclaw)...",
    wizardStep2Found: "[✅] OpenClaw directory found.",
    wizardStep2Error: "[❌] Error: OpenClaw directory not found on this machine.",
    wizardStep3: "[⏳] Generating and writing SKILL.md template...",
    wizardStep4: "[✅] Success! Skill successfully registered.",
    wizardPostError: "[❌] Error: {msg}",
    excludeTitle: "Exclude URLs",
    excludePlaceholder: "youtube.com or localhost",
    add: "Add",
    historyTitle: "Recent Scrape History",
    prev: "Prev",
    next: "Next",
    colTime: "Time",
    colEngine: "Engine",
    colSaved: "Saved",
    colReduction: "Reduction",
    colUrl: "URL",
    cookieTitle: "Cookie Manager",
    cookieDomainPh: "domain (example.com)",
    cookieStringPh: "cookie_string (a=1; b=2)",
    addCookie: "Add Cookie Entry",
    cookieColDomain: "Domain",
    cookieColString: "Cookie String",
    cookieColAction: "Action",
    delete: "Delete",
    showing: "Showing",
    of: "of",
    skillInstalled: "WebClaw Skill successfully installed into OpenClaw!"
  },
  vi: {
    titleMain: "WebClaw Hybrid Engine",
    subtitleKpi: "KPI chính: phần trăm giảm token (%)",
    installSkill: "⚡ Cài đặt Skill OpenClaw",
    serverStatus: "Trạng thái Server",
    host: "Host",
    port: "Cổng",
    ready: "Sẵn sàng",
    totalRequests: "Tổng số Request",
    overallReductionKpi: "Tổng mức giảm",
    tokensSavedSubLine: "{n} token đã tiết kiệm",
    installSkillInstalled: "✅ Đã cài Skill OpenClaw",
    wizardTitle: "Cài đặt Skill OpenClaw",
    wizardClose: "Đóng",
    wizardStep1: "[⏳] Đang khởi tạo tích hợp WebClaw Hybrid Engine...",
    wizardStep2Search: "[⏳] Đang tìm thư mục OpenClaw (~/.openclaw)...",
    wizardStep2Found: "[✅] Đã tìm thấy thư mục OpenClaw.",
    wizardStep2Error: "[❌] Lỗi: Không tìm thấy thư mục OpenClaw trên máy này.",
    wizardStep3: "[⏳] Đang tạo và ghi file SKILL.md...",
    wizardStep4: "[✅] Thành công! Skill đã được đăng ký.",
    wizardPostError: "[❌] Lỗi: {msg}",
    excludeTitle: "Loại trừ URL",
    excludePlaceholder: "youtube.com hoặc localhost",
    add: "Thêm",
    historyTitle: "Lịch sử cào dữ liệu gần đây",
    prev: "Trước",
    next: "Sau",
    colTime: "Thời gian",
    colEngine: "Engine",
    colSaved: "Tiết kiệm",
    colReduction: "Giảm",
    colUrl: "URL",
    cookieTitle: "Quản lý Cookie",
    cookieDomainPh: "domain (example.com)",
    cookieStringPh: "cookie_string (a=1; b=2)",
    addCookie: "Thêm Cookie",
    cookieColDomain: "Domain",
    cookieColString: "Chuỗi Cookie",
    cookieColAction: "Hành động",
    delete: "Xóa",
    showing: "Hiển thị",
    of: "trên",
    skillInstalled: "Đã cài đặt thành công WebClaw Skill vào OpenClaw!"
  }
};

let currentLang = localStorage.getItem("webclaw_lang") || "en";
if (!I18N[currentLang]) currentLang = "en";

function t(key) {
  return I18N[currentLang][key] || key;
}

function formatNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString(currentLang === "vi" ? "vi-VN" : "en-US");
}

function applyInstallButtonState() {
  if (openClawSkillInstalled) {
    installOpenclawBtn.textContent = t("installSkillInstalled");
    installOpenclawBtn.className = INSTALL_BTN_CLASS_INSTALLED;
  } else {
    installOpenclawBtn.textContent = t("installSkill");
    installOpenclawBtn.className = INSTALL_BTN_CLASS_DEFAULT;
  }
}

async function loadOpenClawStatus() {
  try {
    const res = await fetch("/api/v1/integrate/openclaw/status");
    const json = await res.json();
    if (res.ok && json.status === "success") {
      openClawSkillInstalled = !!json.installed;
    } else {
      openClawSkillInstalled = false;
    }
  } catch {
    openClawSkillInstalled = false;
  }
  applyInstallButtonState();
}

async function loadSystemInfo() {
  try {
    const res = await fetch("/api/v1/system-info");
    const json = await res.json();
    if (!res.ok || json.status !== "success") {
      throw new Error(json.message || "Failed to load system info");
    }
    modalOsInfo.textContent = `Hệ điều hành: ${json.osType || "Không xác định"}`;
    modalOpenclawStatus.textContent = json.isOpenClawInstalled
      ? "🟢 Tìm thấy thư mục OpenClaw"
      : "🔴 Không tìm thấy thư mục OpenClaw";
    modalSkillPath.value = json.suggestedSkillPath || "";
  } catch (err) {
    modalInstallFeedback.textContent = err.message;
    modalInstallFeedback.className = "text-sm text-rose-400";
  }
}

async function installSkillToPath() {
  const targetPath = modalSkillPath.value.trim();
  if (!targetPath) {
    modalInstallFeedback.textContent = "Vui lòng nhập đường dẫn cài đặt Skill.";
    modalInstallFeedback.className = "text-sm text-rose-400";
    return;
  }

  modalInstallBtn.disabled = true;
  modalInstallFeedback.textContent = "";
  try {
    const res = await fetch("/api/v1/install-skill", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetPath })
    });
    const json = await res.json();
    if (!res.ok || json.status !== "success") {
      throw new Error(json.message || "Install failed");
    }
    modalInstallFeedback.textContent = "✅ Đã cài đặt Skill thành công! Vui lòng khởi động lại OpenClaw.";
    modalInstallFeedback.className = "text-sm text-emerald-400";
    alert("✅ Đã cài đặt Skill thành công! Vui lòng khởi động lại OpenClaw.");
    openclawModal.classList.add("hidden");
    await loadOpenClawStatus();
  } catch (err) {
    modalInstallFeedback.textContent = err.message;
    modalInstallFeedback.className = "text-sm text-rose-400";
  } finally {
    modalInstallBtn.disabled = false;
  }
}

function renderLanguage() {
  document.getElementById("title-main").textContent = t("titleMain");
  document.getElementById("subtitle-kpi").textContent = t("subtitleKpi");
  document.getElementById("label-server-status").textContent = t("serverStatus");
  document.getElementById("label-host").textContent = t("host");
  document.getElementById("label-port").textContent = t("port");
  serverStatus.textContent = t("ready");
  const engineBadgeEl = document.getElementById("engine-badge");
  if (engineBadgeEl) engineBadgeEl.textContent = t("engineBadge");
  document.getElementById("label-total-requests").textContent = t("totalRequests");
  document.getElementById("label-overall-reduction").textContent = t("overallReductionKpi");
  document.getElementById("exclude-title").textContent = t("excludeTitle");
  excludeInput.placeholder = t("excludePlaceholder");
  document.getElementById("exclude-add-btn").textContent = t("add");
  document.getElementById("history-title").textContent = t("historyTitle");
  historyPrev.textContent = t("prev");
  historyNext.textContent = t("next");
  document.getElementById("history-col-time").textContent = t("colTime");
  document.getElementById("history-col-engine").textContent = t("colEngine");
  document.getElementById("history-col-saved").textContent = t("colSaved");
  document.getElementById("history-col-reduction").textContent = t("colReduction");
  document.getElementById("history-col-url").textContent = t("colUrl");
  document.getElementById("cookie-title").textContent = t("cookieTitle");
  document.getElementById("cookie-domain").placeholder = t("cookieDomainPh");
  document.getElementById("cookie-string").placeholder = t("cookieStringPh");
  document.getElementById("cookie-add-btn").textContent = t("addCookie");
  document.getElementById("cookie-col-domain").textContent = t("cookieColDomain");
  document.getElementById("cookie-col-string").textContent = t("cookieColString");
  document.getElementById("cookie-col-action").textContent = t("cookieColAction");
  document.getElementById("openclaw-modal-title").textContent = "Cài đặt Skill OpenClaw";
  modalOsInfo.textContent = "Hệ điều hành: Đang phát hiện...";
  modalOpenclawStatus.textContent = "Đang kiểm tra thư mục OpenClaw...";
  document.querySelector('label[for="modal-skill-path"]').textContent = "Đường dẫn cài đặt Skill:";
  modalInstallBtn.textContent = "Xác nhận Cài đặt";
  openclawModalClose.textContent = "✕";
  applyInstallButtonState();
  langToggleBtn.textContent = currentLang.toUpperCase();
  renderCookies();
  renderExcludeList();
  updateHistoryPageLabel();
  loadStats().catch(() => {});
}

function updateHistoryPageLabel() {
  if (historyTotal === 0) {
    historyPage.textContent = `${t("showing")} 0-0 ${t("of")} 0`;
  } else {
    historyPage.textContent = `${t("showing")} ${historyOffset + 1}-${Math.min(historyOffset + HISTORY_LIMIT, historyTotal)} ${t("of")} ${historyTotal}`;
  }
}

function renderCookies() {
  cookieTable.innerHTML = "";
  for (const [index, row] of cookiesState.entries()) {
    const tr = document.createElement("tr");
    tr.className = "border-t border-slate-800";
    tr.innerHTML = `
      <td class="py-2 pr-3">${row.domain || ""}</td>
      <td class="py-2 pr-3 break-all">${row.cookie_string || ""}</td>
      <td class="py-2"><button data-index="${index}" class="text-rose-400">${t("delete")}</button></td>
    `;
    cookieTable.appendChild(tr);
  }
}

function renderExcludeList() {
  excludeList.innerHTML = "";
  for (const [index, value] of settingsState.exclude_urls.entries()) {
    const li = document.createElement("li");
    li.className = "flex items-center justify-between gap-2 bg-slate-900 border border-slate-700 rounded px-3 py-2";
    li.innerHTML = `
      <span class="break-all">${value}</span>
      <button data-index="${index}" class="text-rose-400">${t("delete")}</button>
    `;
    excludeList.appendChild(li);
  }
}

function stripLeadingDot(domain) {
  return String(domain || "").replace(/^\./, "").trim();
}

/**
 * Server stores either manual rows { domain, cookie_string } or Chrome API objects
 * { name, value, domain, path, ... }. The UI table only shows domain + cookie_string,
 * so we normalize Chrome entries for display and for round-trip save.
 */
function normalizeStoredCookiesForUi(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const manualRows = [];
  const chromeByDomain = new Map();

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;

    if (entry.cookie_string && entry.domain) {
      manualRows.push({
        domain: stripLeadingDot(entry.domain),
        cookie_string: entry.cookie_string
      });
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(entry, "name") && entry.value != null && entry.domain) {
      const dom = stripLeadingDot(entry.domain).toLowerCase();
      if (!dom) continue;
      const pair = `${entry.name}=${entry.value}`;
      if (!chromeByDomain.has(dom)) chromeByDomain.set(dom, []);
      chromeByDomain.get(dom).push(pair);
    }
  }

  const chromeRows = [];
  for (const [dom, pairs] of chromeByDomain) {
    chromeRows.push({ domain: dom, cookie_string: pairs.join("; ") });
  }

  return [...manualRows, ...chromeRows];
}

async function loadCookies() {
  const res = await fetch("/api/v1/cookies");
  const json = await res.json();
  cookiesState = normalizeStoredCookiesForUi(json.cookies);
  renderCookies();
}

async function saveCookies() {
  const res = await fetch("/api/v1/cookies", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cookies: cookiesState })
  });
  const json = await res.json();
  if (!res.ok || json.status !== "success") throw new Error(json.message || "Save cookies failed");
}

async function loadSettings() {
  const res = await fetch("/api/v1/settings");
  const json = await res.json();
  if (!res.ok || json.status !== "success") throw new Error(json.message || "Failed to load settings");
  settingsState = {
    exclude_urls: Array.isArray(json.settings?.exclude_urls) ? json.settings.exclude_urls : []
  };
  renderExcludeList();
}

async function saveSettings() {
  const res = await fetch("/api/v1/settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(settingsState)
  });
  const json = await res.json();
  if (!res.ok || json.status !== "success") throw new Error(json.message || "Failed to save settings");
}

async function loadStats() {
  const res = await fetch("/api/v1/stats");
  const json = await res.json();
  if (!res.ok || json.status !== "success") throw new Error(json.message || "Failed to load stats");
  totalRequests.textContent = String(json.stats?.total_requests || 0);
  const pct = Number(json.stats?.overall_reduction_percentage ?? 0);
  const totalSaved = Number(json.stats?.total_tokens_saved ?? 0);
  overallReductionPercent.textContent = `${Number.isFinite(pct) ? pct.toFixed(1) : "0.0"}%`;
  totalTokensSavedSub.textContent = t("tokensSavedSubLine").replace("{n}", formatNumber(totalSaved));
}

function renderHistory(items) {
  historyTable.innerHTML = "";
  for (const item of items) {
    const tr = document.createElement("tr");
    tr.className = "border-t border-slate-800";
    tr.innerHTML = `
      <td class="py-2 pr-3 whitespace-nowrap">${item.timestamp || ""}</td>
      <td class="py-2 pr-3">${item.engine_used || ""}</td>
      <td class="py-2 pr-3">${item.tokens_saved ?? 0}</td>
      <td class="py-2 pr-3">${item.reduction_percentage ?? 0}%</td>
      <td class="py-2 pr-3 break-all">${item.url || ""}</td>
    `;
    historyTable.appendChild(tr);
  }
  historyPrev.disabled = historyOffset === 0;
  historyNext.disabled = historyOffset + HISTORY_LIMIT >= historyTotal;
  updateHistoryPageLabel();
}

async function loadHistory() {
  const res = await fetch(`/api/v1/history?limit=${HISTORY_LIMIT}&offset=${historyOffset}`);
  const json = await res.json();
  if (!res.ok || json.status !== "success") throw new Error(json.message || "Failed to load history");
  historyTotal = Number(json.pagination?.total || 0);
  renderHistory(Array.isArray(json.items) ? json.items : []);
}

langToggleBtn.addEventListener("click", () => {
  currentLang = currentLang === "en" ? "vi" : "en";
  localStorage.setItem("webclaw_lang", currentLang);
  renderLanguage();
});

excludeList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-index]");
  if (!button) return;
  const index = Number(button.dataset.index);
  settingsState.exclude_urls.splice(index, 1);
  try {
    await saveSettings();
    renderExcludeList();
  } catch (err) {
    excludeError.textContent = err.message;
  }
});

excludeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  excludeError.textContent = "";
  const value = excludeInput.value.trim();
  if (!value) return;
  settingsState.exclude_urls.push(value);
  settingsState.exclude_urls = [...new Set(settingsState.exclude_urls)];
  try {
    await saveSettings();
    renderExcludeList();
    excludeForm.reset();
  } catch (err) {
    excludeError.textContent = err.message;
  }
});

cookieTable.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-index]");
  if (!button) return;
  const index = Number(button.dataset.index);
  cookiesState.splice(index, 1);
  try {
    await saveCookies();
    renderCookies();
  } catch (err) {
    cookieError.textContent = err.message;
  }
});

cookieForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  cookieError.textContent = "";
  const domain = document.getElementById("cookie-domain").value.trim();
  const cookieString = document.getElementById("cookie-string").value.trim();
  cookiesState.push({ domain, cookie_string: cookieString });
  try {
    await saveCookies();
    renderCookies();
    cookieForm.reset();
  } catch (err) {
    cookieError.textContent = err.message;
  }
});

historyPrev.addEventListener("click", async () => {
  if (historyOffset === 0) return;
  historyOffset = Math.max(0, historyOffset - HISTORY_LIMIT);
  await loadHistory();
});

historyNext.addEventListener("click", async () => {
  if (historyOffset + HISTORY_LIMIT >= historyTotal) return;
  historyOffset += HISTORY_LIMIT;
  await loadHistory();
});

installOpenclawBtn.addEventListener("click", () => {
  modalInstallFeedback.textContent = "";
  modalInstallFeedback.className = "text-sm";
  openclawModal.classList.remove("hidden");
  loadSystemInfo();
});
modalInstallBtn.addEventListener("click", () => {
  installSkillToPath();
});

openclawModalClose.addEventListener("click", () => {
  openclawModal.classList.add("hidden");
});

openclawModal.addEventListener("click", (event) => {
  if (event.target === openclawModal) {
    openclawModal.classList.add("hidden");
  }
});

serverHost.textContent = window.location.hostname || "localhost";
renderLanguage();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  loadCookies().catch(() => {});
  loadStats().catch(() => {});
});

Promise.all([loadCookies(), loadSettings(), loadStats(), loadHistory(), loadOpenClawStatus()]).catch((err) => {
  integrationMessage.textContent = err.message;
  integrationMessage.className = "text-sm mt-2 text-rose-400";
});
