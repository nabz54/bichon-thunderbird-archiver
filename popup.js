let lastDebug = null;

function setStatus(text, klass = "") {
  const el = document.getElementById("status");
  el.textContent = text;
  el.className = "status " + klass;
}

function setDebug(debug) {
  lastDebug = debug;
  document.getElementById("debug").textContent = JSON.stringify(debug, null, 2);
}

document.getElementById("archive").addEventListener("click", async () => {
  setStatus("Archivage en cours...");
  document.getElementById("debug").textContent = "";
  try {
    const result = await browser.runtime.sendMessage({ action: "archive-selected" });
    setStatus(result.message || "Terminé.", result.ok ? "ok" : "bad");
    setDebug(result.debug || result);
  } catch (e) {
    setStatus("Erreur popup : " + e.message, "bad");
    setDebug({ popup_error: { name: e.name, message: e.message, stack: e.stack } });
  }
});

document.getElementById("options").addEventListener("click", async () => {
  await browser.runtime.openOptionsPage();
});

document.getElementById("copyDebug").addEventListener("click", async () => {
  if (!lastDebug) {
    try {
      lastDebug = await browser.runtime.sendMessage({ action: "get-last-debug" });
    } catch {}
  }

  const text = JSON.stringify(lastDebug || { message: "Aucun diagnostic disponible" }, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Diagnostic copié dans le presse-papiers.", "ok");
  } catch (e) {
    setStatus("Impossible de copier automatiquement. Sélectionne le texte du diagnostic.", "bad");
  }
});