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

function el(id) {
  return document.getElementById(id);
}

function setStatus(text, klass = "") {
  const s = el("status");
  s.textContent = text;
  s.className = klass;
}

function normalize(data) {
  data.bichonBaseUrl = String(data.bichonBaseUrl || "").trim().replace(/\/+$/, "");
  data.apiPath = String(data.apiPath || "/api/v1/import").trim();
  if (!data.apiPath.startsWith("/")) data.apiPath = "/" + data.apiPath;
  data.accountId = String(data.accountId || "1").trim();
  data.mailFolder = String(data.mailFolder || "Thunderbird").trim();
  data.token = String(data.token || "").trim();
  return data;
}

async function readForm() {
  const data = {};
  for (const key of Object.keys(DEFAULTS)) {
    const input = el(key);
    if (!input) continue;
    data[key] = input.type === "checkbox" ? input.checked : input.value;
  }
  return normalize(data);
}

function updatePayloadPreviewFromData(data) {
  const preview = el("payloadPreview");
  if (!preview) return;

  const accountIdNumber = Number(data.accountId);
  const accountIdPreview = Number.isFinite(accountIdNumber) ? accountIdNumber : data.accountId;

  preview.textContent = JSON.stringify({
    account_id: accountIdPreview,
    mail_folder: data.mailFolder || "Thunderbird",
    emls: ["BASE64_EML"]
  }, null, 2);
}

async function updatePayloadPreview() {
  const data = await readForm();
  updatePayloadPreviewFromData(data);
}

async function save() {
  const data = await readForm();
  await browser.storage.local.set(data);
  updatePayloadPreviewFromData(data);
  setStatus(
    `Configuration enregistrée. Account ID actif : ${data.accountId} | Dossier : ${data.mailFolder}`,
    "ok"
  );
}

async function restore() {
  const settings = await browser.storage.local.get(DEFAULTS);
  for (const [key, value] of Object.entries(settings)) {
    const input = el(key);
    if (!input) continue;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = value ?? "";
  }
  updatePayloadPreviewFromData(normalize(settings));
}

async function test() {
  await save();
  setStatus("Test de connexion en cours...");
  try {
    const result = await browser.runtime.sendMessage({ action: "test-connection" });
    setStatus(`Connexion OK avec Bichon. HTTP ${result.status}`, "ok");
  } catch (e) {
    setStatus(`Échec de connexion : ${e.message}`, "bad");
  }
}

async function accounts() {
  await save();
  setStatus("Récupération des comptes...");
  try {
    const result = await browser.runtime.sendMessage({ action: "list-accounts" });
    setStatus(JSON.stringify(result, null, 2), "ok");
  } catch (e) {
    setStatus(`Impossible de lister les comptes : ${e.message}`, "bad");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await restore();

  for (const key of Object.keys(DEFAULTS)) {
    const input = el(key);
    if (!input) continue;
    input.addEventListener("input", updatePayloadPreview);
    input.addEventListener("change", updatePayloadPreview);
  }

  el("save").addEventListener("click", save);
  el("test").addEventListener("click", test);
  el("accounts").addEventListener("click", accounts);
});