const DEFAULTS = {
  bichonBaseUrl: "http://127.0.0.1:15630",
  apiPath: "/api/v1/import",
  token: "",
  authMode: "bearer",
  accountId: "1",
  mailFolder: "Thunderbird",
  markAsReadAfterArchive: false,
  batchMode: true,
  debugMode: true
};

let lastDebugReport = {
  created_at: new Date().toISOString(),
  events: []
};

function resetDebug() {
  lastDebugReport = {
    created_at: new Date().toISOString(),
    extension: "Bichon Archiver API Thunderbird 140",
    version: "1.0.4-base64url-padding",
    events: []
  };
}

function addDebug(step, data = {}) {
  const event = {
    at: new Date().toISOString(),
    step,
    ...sanitizeDebugData(data)
  };
  lastDebugReport.events.push(event);
  console.log("[Bichon Archiver DEBUG]", step, event);
  return event;
}

function sanitizeDebugData(data) {
  const clone = {};
  for (const [k, v] of Object.entries(data || {})) {
    if (k.toLowerCase().includes("token") || k.toLowerCase().includes("authorization")) {
      clone[k] = maskSecret(String(v || ""));
    } else if (v instanceof Error) {
      clone[k] = serializeError(v);
    } else {
      clone[k] = v;
    }
  }
  return clone;
}

function serializeError(error) {
  if (!error) return null;
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    fileName: error.fileName,
    lineNumber: error.lineNumber,
    columnNumber: error.columnNumber
  };
}

function maskSecret(value) {
  if (!value) return "";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}...${value.slice(-4)} (len=${value.length})`;
}

async function getSettings() {
  const settings = await browser.storage.local.get(DEFAULTS);
  addDebug("settings-loaded", {
    bichonBaseUrl: settings.bichonBaseUrl,
    apiPath: settings.apiPath,
    authMode: settings.authMode,
    accountId: settings.accountId,
    mailFolder: settings.mailFolder,
    token: settings.token,
    markAsReadAfterArchive: settings.markAsReadAfterArchive
  });
  return settings;
}

function cleanBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function normalizePath(path) {
  path = String(path || "").trim();
  if (!path.startsWith("/")) path = "/" + path;
  return path;
}

function buildHeaders(settings) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8"
  };

  const token = String(settings.token || "").trim();
  if (!token || settings.authMode === "none") {
    addDebug("auth-header", { mode: settings.authMode || "none", authorization: "" });
    return headers;
  }

  switch (settings.authMode) {
    case "bearer":
      headers["Authorization"] = `Bearer ${token}`;
      break;
    case "x-api-token":
      headers["X-API-Token"] = token;
      break;
    case "x-auth-token":
      headers["X-Auth-Token"] = token;
      break;
    case "raw-authorization":
      headers["Authorization"] = token;
      break;
    default:
      headers["Authorization"] = `Bearer ${token}`;
      break;
  }

  addDebug("auth-header", {
    mode: settings.authMode,
    authorization: headers["Authorization"] || "",
    xApiToken: headers["X-API-Token"] || "",
    xAuthToken: headers["X-Auth-Token"] || ""
  });

  return headers;
}

function notify(title, message) {
  browser.notifications.create({
    type: "basic",
    iconUrl: "icons/bichon-48.png",
    title,
    message
  }).catch(console.error);
}

async function getCurrentTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  addDebug("current-tab", {
    tabId: tab?.id,
    url: tab?.url,
    title: tab?.title,
    type: tab?.type
  });
  return tab;
}

async function getSelectedMessages(tab) {
  try {
    addDebug("selected-messages-start", { tabId: tab?.id });
    if (browser.mailTabs?.getSelectedMessages) {
      const selected = await browser.mailTabs.getSelectedMessages(tab.id);
      addDebug("mailTabs.getSelectedMessages-result", {
        count: selected?.messages?.length || 0,
        pageInfo: selected?.id ? "has-id" : "no-id"
      });
      if (selected?.messages?.length) {
        return selected.messages;
      }
    }
  } catch (e) {
    addDebug("mailTabs.getSelectedMessages-error", { error: e });
  }

  try {
    addDebug("displayed-message-start", { tabId: tab?.id });
    if (browser.messageDisplay?.getDisplayedMessage) {
      const displayed = await browser.messageDisplay.getDisplayedMessage(tab.id);
      addDebug("messageDisplay.getDisplayedMessage-result", {
        hasMessage: Boolean(displayed),
        id: displayed?.id,
        subject: displayed?.subject
      });
      if (displayed) return [displayed];
    }
  } catch (e) {
    addDebug("messageDisplay.getDisplayedMessage-error", { error: e });
  }

  return [];
}

async function messageToBase64(message) {
  addDebug("message-to-base64-start", {
    id: message?.id,
    subject: message?.subject,
    author: message?.author,
    date: message?.date,
    folder: message?.folder?.name,
    accountId: message?.folder?.accountId
  });

  let raw;
  try {
    raw = await browser.messages.getRaw(message.id, {
      data_format: "File",
      decrypt: true
    });
    addDebug("messages.getRaw-file-ok", {
      rawType: Object.prototype.toString.call(raw),
      isBlob: raw instanceof Blob,
      isFile: raw instanceof File,
      size: raw?.size,
      type: raw?.type,
      name: raw?.name
    });
  } catch (e1) {
    addDebug("messages.getRaw-file-error", { error: e1 });
    try {
      raw = await browser.messages.getRaw(message.id);
      addDebug("messages.getRaw-default-ok", {
        rawType: Object.prototype.toString.call(raw),
        typeofRaw: typeof raw,
        length: typeof raw === "string" ? raw.length : undefined
      });
    } catch (e2) {
      addDebug("messages.getRaw-default-error", { error: e2 });
      throw new Error(`Impossible de lire le mail sélectionné avec Thunderbird: ${e2.message || e1.message}`);
    }
  }

  let blob;
  if (raw instanceof Blob) {
    blob = raw;
  } else if (typeof raw === "string") {
    blob = new Blob([raw], { type: "message/rfc822" });
  } else {
    blob = new Blob([String(raw)], { type: "message/rfc822" });
  }

  addDebug("raw-blob-created", {
    blobSize: blob.size,
    blobType: blob.type
  });

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  addDebug("array-buffer-created", {
    byteLength: bytes.length,
    firstBytesHex: Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, "0")).join(" ")
  });

  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }

  const standardB64 = btoa(binary);

  // Bichon 1.x appears to reject standard Base64 characters such as "/".
  // Use URL-safe Base64: "+" -> "-", "/" -> "_", and remove "=" padding.
  // Bichon 1.x appears to expect URL-safe Base64, but still with "=" padding.
  const b64 = standardB64
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  addDebug("base64-created", {
    encoding: "base64url-with-padding",
    standardBase64Length: standardB64.length,
    base64Length: b64.length,
    standardHadSlash: standardB64.includes("/"),
    standardHadPlus: standardB64.includes("+"),
    paddingCount: (b64.match(/=/g) || []).length,
    base64Preview: b64.slice(0, 60) + "..."
  });

  return b64;
}

async function callBichonImport(emlBase64List, settings) {
  const baseUrl = cleanBaseUrl(settings.bichonBaseUrl);
  const apiPath = normalizePath(settings.apiPath || "/api/v1/import");
  const url = new URL(apiPath, baseUrl).toString();

  const accountIdString = String(settings.accountId).trim();
  const accountId = Number(accountIdString);
  if (!Number.isFinite(accountId) || accountId <= 0) {
    throw new Error(`account_id invalide: "${accountIdString}"`);
  }

  const payload = {
    account_id: accountId,
    mail_folder: settings.mailFolder || "Thunderbird",
    emls: emlBase64List
  };

  const body = JSON.stringify(payload);

  addDebug("bichon-import-request", {
    url,
    method: "POST",
    account_id: accountId,
    mail_folder: payload.mail_folder,
    eml_count: emlBase64List.length,
    bodyLength: body.length,
    bodyPreview: body.slice(0, 220) + "...",
    headers: buildHeaders(settings)
  });

  let response;
  let text = "";
  try {
    response = await fetch(url, {
      method: "POST",
      headers: buildHeaders(settings),
      body
    });
    addDebug("fetch-response-received", {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      type: response.type,
      url: response.url,
      redirected: response.redirected
    });
    text = await response.text();
    addDebug("fetch-response-body", {
      length: text.length,
      preview: text.slice(0, 1000)
    });
  } catch (e) {
    addDebug("fetch-network-error", {
      error: e,
      likelyCauses: [
        "CORS/preflight rejected",
        "BICHON_CORS_ORIGINS too restrictive",
        "wrong URL/IP from Thunderbird host",
        "HTTP/HTTPS mixed or blocked",
        "firewall between Thunderbird and Bichon",
        "large payload rejected before response"
      ]
    });
    throw new Error(`NetworkError pendant l'appel POST vers Bichon. Voir diagnostic. Détail: ${e.name}: ${e.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  if (!response.ok) {
    throw new Error(`Bichon a répondu HTTP ${response.status} ${response.statusText}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`);
  }

  return parsed;
}

async function archiveMessages(messages) {
  resetDebug();
  addDebug("archive-start", { messageCount: messages.length });

  const settings = await getSettings();

  if (!messages.length) {
    return { ok: false, message: "Aucun message sélectionné.", debug: lastDebugReport };
  }

  const emls = [];
  for (const msg of messages) {
    emls.push(await messageToBase64(msg));
  }

  const result = await callBichonImport(emls, settings);

  if (settings.markAsReadAfterArchive && browser.messages.update) {
    for (const msg of messages) {
      try {
        await browser.messages.update(msg.id, { read: true });
        addDebug("message-marked-read", { id: msg.id });
      } catch (e) {
        addDebug("message-mark-read-error", { id: msg.id, error: e });
      }
    }
  }

  const success = result?.success ?? emls.length;
  const failed = result?.failed ?? 0;
  const total = result?.total ?? emls.length;

  addDebug("archive-finished", { total, success, failed, result });

  return {
    ok: failed === 0,
    total,
    success,
    failed,
    result,
    debug: lastDebugReport,
    message: failed === 0
      ? `${success}/${total} message(s) archivé(s) dans Bichon.`
      : `${success}/${total} message(s) archivé(s), ${failed} échec(s).`
  };
}

async function archiveCurrentSelection(showNotifications = true) {
  resetDebug();
  try {
    const tab = await getCurrentTab();
    const messages = await getSelectedMessages(tab);

    if (!messages.length) {
      const result = { ok: false, message: "Aucun message sélectionné.", debug: lastDebugReport };
      if (showNotifications) notify("Bichon Archiver", result.message);
      return result;
    }

    if (showNotifications) notify("Bichon Archiver", `Archivage de ${messages.length} message(s)...`);

    const result = await archiveMessages(messages);
    if (showNotifications) notify("Bichon Archiver", result.message);
    return result;
  } catch (error) {
    addDebug("archive-global-error", { error });
    console.error("Bichon archive failed:", error, lastDebugReport);
    const message = `Erreur : ${error.message}`;
    if (showNotifications) notify("Bichon Archiver", message);
    return { ok: false, message, error: serializeError(error), debug: lastDebugReport };
  }
}

async function testBichonConnection() {
  resetDebug();
  const settings = await getSettings();
  const baseUrl = cleanBaseUrl(settings.bichonBaseUrl);
  const url = baseUrl + "/";

  addDebug("test-connection-request", { url });

  const response = await fetch(url, { method: "GET" });
  const text = await response.text();

  addDebug("test-connection-response", {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    bodyPreview: text.slice(0, 300)
  });

  if (!response.ok) {
    throw new Error(`Bichon répond HTTP ${response.status}`);
  }

  return { ok: true, status: response.status, debug: lastDebugReport };
}

async function listBichonAccounts() {
  resetDebug();
  const settings = await getSettings();
  const baseUrl = cleanBaseUrl(settings.bichonBaseUrl);
  const url = baseUrl + "/api/v1/minimal-account-list";

  const headers = buildHeaders(settings);

  addDebug("list-accounts-request", {
    url,
    headers
  });

  const response = await fetch(url, {
    method: "GET",
    headers
  });

  const text = await response.text();

  addDebug("list-accounts-response", {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body: text
  });

  let body;
  try { body = JSON.parse(text); } catch { body = text; }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }

  return { data: body, debug: lastDebugReport };
}

browser.runtime.onMessage.addListener((request) => {
  if (request?.action === "archive-selected") {
    return archiveCurrentSelection(false);
  }

  if (request?.action === "test-connection") {
    return testBichonConnection();
  }

  if (request?.action === "list-accounts") {
    return listBichonAccounts();
  }

  if (request?.action === "get-last-debug") {
    return Promise.resolve(lastDebugReport);
  }
});

browser.menus.create({
  id: "archive-to-bichon",
  title: "Archiver vers Bichon",
  contexts: ["message_list", "page", "browser_action"]
});

browser.menus.create({
  id: "open-bichon-options",
  title: "Configurer Bichon Archiver",
  contexts: ["browser_action"]
});

browser.menus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "archive-to-bichon") {
    await archiveCurrentSelection(true);
  }

  if (info.menuItemId === "open-bichon-options") {
    await browser.runtime.openOptionsPage();
  }
});