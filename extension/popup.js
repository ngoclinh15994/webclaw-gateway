const domainText = document.getElementById("domain-text");
const statusEl = document.getElementById("status");
const copyBtn = document.getElementById("copy-btn");
const syncBtn = document.getElementById("sync-btn");

const GATEWAY_COOKIES_URL = "http://localhost:8822/api/v1/cookies";

let state = {
  domain: "",
  cookies: []
};

function setStatus(message, type = "neutral") {
  statusEl.textContent = message;
  statusEl.className = "";
  if (type === "success") {
    statusEl.classList.add("status-success");
    return;
  }
  if (type === "error") {
    statusEl.classList.add("status-error");
    return;
  }
  statusEl.classList.add("status-neutral");
}

function setButtonsEnabled(enabled) {
  copyBtn.disabled = !enabled;
  syncBtn.disabled = !enabled;
}

function isUnsupportedUrl(urlString) {
  return /^chrome:|^edge:|^about:|^file:|^devtools:/i.test(urlString || "");
}

function normalizeCookieDomain(hostname) {
  return (hostname || "").replace(/^www\./i, "").trim();
}

function dedupeCookies(cookies) {
  const seen = new Set();
  const output = [];
  for (const cookie of cookies) {
    const key = [cookie.name, cookie.domain, cookie.path].join("|");
    if (!seen.has(key)) {
      seen.add(key);
      output.push(cookie);
    }
  }
  return output;
}

function buildPayload() {
  return {
    domain: state.domain,
    cookies: state.cookies
  };
}

function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve((tabs && tabs[0]) || null);
    });
  });
}

function getCookiesForDomain(domain) {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({ domain }, (cookies) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(cookies || []);
    });
  });
}

async function loadActiveSiteCookies() {
  setButtonsEnabled(false);
  setStatus("Loading cookies from active tab...");

  const activeTab = await getActiveTab();
  if (!activeTab || !activeTab.url) {
    throw new Error("No active tab URL found.");
  }

  if (isUnsupportedUrl(activeTab.url)) {
    throw new Error("This page type is not supported. Open a normal website tab first.");
  }

  const parsed = new URL(activeTab.url);
  const domain = normalizeCookieDomain(parsed.hostname);
  if (!domain) {
    throw new Error("Unable to detect domain from active tab.");
  }

  domainText.textContent = `Current Site: ${domain}`;

  const domainVariants = domain.startsWith(".") ? [domain] : [domain, `.${domain}`];
  const cookieBuckets = await Promise.all(domainVariants.map((variant) => getCookiesForDomain(variant)));
  const cookies = dedupeCookies(cookieBuckets.flat());

  state = { domain, cookies };

  if (!cookies.length) {
    setStatus("No cookies found for this site.", "neutral");
    setButtonsEnabled(true);
    return;
  }

  setStatus(`Found ${cookies.length} cookie(s). Ready to copy or sync.`, "success");
  setButtonsEnabled(true);
}

async function copyCookiesToClipboard() {
  try {
    if (!state.domain) {
      throw new Error("No active domain loaded.");
    }
    const payload = buildPayload();
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setStatus("Copied to clipboard.", "success");
  } catch (error) {
    setStatus(`Error: ${error.message || "Unable to copy cookies."}`, "error");
  }
}

async function syncCookiesToGateway() {
  try {
    if (!state.domain) {
      throw new Error("No active domain loaded.");
    }

    const payload = buildPayload();
    const response = await fetch(GATEWAY_COOKIES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gateway returned ${response.status}${body ? `: ${body}` : ""}`);
    }

    setStatus("Successfully synced to Gateway!", "success");
  } catch (error) {
    setStatus("Error: WebClaw Gateway is not running on port 8822", "error");
  }
}

copyBtn.addEventListener("click", copyCookiesToClipboard);
syncBtn.addEventListener("click", syncCookiesToGateway);

loadActiveSiteCookies().catch((error) => {
  domainText.textContent = "Current Site: unavailable";
  setStatus(`Error: ${error.message || "Failed to load active tab cookies."}`, "error");
  setButtonsEnabled(false);
});
