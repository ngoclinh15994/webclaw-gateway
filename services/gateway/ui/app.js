const langToggleBtn = document.getElementById("lang-toggle-btn");
const installOpenclawBtn = document.getElementById("install-openclaw-btn");
const integrationMessage = document.getElementById("integration-message");
const serverHost = document.getElementById("server-host");
const serverStatus = document.getElementById("server-status");
const totalRequests = document.getElementById("total-requests");
const totalTokensSaved = document.getElementById("total-tokens-saved");

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
    titleMain: "WebClaw Hybrid Gateway",
    subtitleKpi: "Primary KPI: token reduction percentage (%)",
    installSkill: "⚡ Install OpenClaw Skill",
    serverStatus: "Server Status",
    host: "Host",
    port: "Port",
    ready: "Ready",
    totalRequests: "Total Requests",
    totalTokensSaved: "Total Tokens Saved",
    excludeTitle: "Exclude URLs (Blacklist)",
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
    titleMain: "WebClaw Hybrid Gateway",
    subtitleKpi: "KPI chính: phần trăm giảm token (%)",
    installSkill: "⚡ Cài đặt Skill OpenClaw",
    serverStatus: "Trạng thái Server",
    host: "Host",
    port: "Cổng",
    ready: "Sẵn sàng",
    totalRequests: "Tổng số Request",
    totalTokensSaved: "Tổng token đã tiết kiệm",
    excludeTitle: "Exclude URLs (Blacklist)",
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

function renderLanguage() {
  document.getElementById("title-main").textContent = t("titleMain");
  document.getElementById("subtitle-kpi").textContent = t("subtitleKpi");
  document.getElementById("label-server-status").textContent = t("serverStatus");
  document.getElementById("label-host").textContent = t("host");
  document.getElementById("label-port").textContent = t("port");
  serverStatus.textContent = t("ready");
  document.getElementById("label-total-requests").textContent = t("totalRequests");
  document.getElementById("label-total-tokens-saved").textContent = t("totalTokensSaved");
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
  installOpenclawBtn.textContent = t("installSkill");
  langToggleBtn.textContent = currentLang.toUpperCase();
  renderCookies();
  renderExcludeList();
  updateHistoryPageLabel();
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

async function loadCookies() {
  const res = await fetch("/api/v1/cookies");
  const json = await res.json();
  cookiesState = Array.isArray(json.cookies) ? json.cookies.filter((x) => x.domain && x.cookie_string) : [];
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
  totalTokensSaved.textContent = String(json.stats?.total_tokens_saved || 0);
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

installOpenclawBtn.addEventListener("click", async () => {
  integrationMessage.textContent = "";
  integrationMessage.className = "text-sm mt-2";
  try {
    const res = await fetch("/api/v1/integrate/openclaw", { method: "POST" });
    const json = await res.json();
    if (!res.ok || json.status !== "success") throw new Error(json.message || "Integration failed");
    integrationMessage.textContent = json.message;
    integrationMessage.classList.add("text-emerald-400");
    alert(t("skillInstalled"));
  } catch (err) {
    integrationMessage.textContent = err.message;
    integrationMessage.classList.add("text-rose-400");
    alert(err.message);
  }
});

serverHost.textContent = window.location.hostname || "localhost";
renderLanguage();

Promise.all([loadCookies(), loadSettings(), loadStats(), loadHistory()]).catch((err) => {
  integrationMessage.textContent = err.message;
  integrationMessage.className = "text-sm mt-2 text-rose-400";
});
