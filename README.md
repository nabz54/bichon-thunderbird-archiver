# Bichon Thunderbird Archiver

<div align="center">

# 📦 Bichon Thunderbird Archiver

### Archive Thunderbird emails directly into Bichon using the official API

<img src="./icons/bichon-128.png" width="128" alt="Bichon Thunderbird Archiver Logo" />

![Thunderbird](https://img.shields.io/badge/Thunderbird-140+-0A84FF?style=for-the-badge\&logo=thunderbird\&logoColor=white)
![Rust](https://img.shields.io/badge/Bichon-Rust-orange?style=for-the-badge\&logo=rust)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Experimental-yellow?style=for-the-badge)
![Self Hosted](https://img.shields.io/badge/self--hosted-ready-blueviolet?style=for-the-badge)

</div>

---

# 🚀 Overview

**Bichon Thunderbird Archiver** is a Thunderbird WebExtension allowing users to archive emails directly into a self-hosted Bichon instance using the official Bichon REST API.

The extension extracts the raw EML content from Thunderbird, converts it into a Bichon-compatible Base64 format, and sends it to:

```http
POST /api/v1/import
```

This project was built while experimenting with:

* self-hosted email archiving;
* Bichon native deployment;
* Thunderbird API integration;
* EML import automation;
* API-driven archival workflows.

---

# ✨ Features

## Current Features

✅ Thunderbird 140+ support
✅ Native Bichon API integration
✅ Multi-mail selection
✅ Direct EML extraction
✅ User-friendly popup UI
✅ Configurable Bichon URL
✅ API token support
✅ Configurable account ID
✅ Configurable archive folder
✅ Detailed debug mode
✅ URL-safe Base64 compatibility for Bichon
✅ Notifications
✅ CORS-compatible architecture

---

# 🏗️ Architecture

```text
Thunderbird
    ↓
messages.getRaw()
    ↓
EML Extraction
    ↓
Base64 URL-safe conversion
    ↓
Bichon REST API
    ↓
/api/v1/import
    ↓
Bichon Server
```

---

# 📸 Screenshots

> Add your screenshots here.

Suggested screenshots:

* Thunderbird popup;
* extension configuration page;
* Bichon WebUI;
* successful import;
* debug mode;
* Thunderbird mail selection.

---

# 🧠 Why this project?

Bichon already exposes a powerful import API, but there was no native Thunderbird integration.

The goal of this project is to:

* simplify mail archival;
* improve interoperability;
* enable one-click archival from Thunderbird;
* provide a lightweight self-hosted archival workflow.

This extension transforms Thunderbird into a direct ingestion source for Bichon.

---

# ⚙️ Requirements

## Thunderbird

* Thunderbird 140 or newer.

## Bichon

* Bichon Server 1.x.
* Configured mail account.
* API access token.
* Correct CORS configuration.

## Server

Works perfectly on:

* Debian 13;
* Ubuntu Server;
* lightweight VMs;
* self-hosted homelab environments.

---

# 🔐 Authentication

The extension supports:

```http
Authorization: Bearer TOKEN
```

Example:

```http
Authorization: Bearer eyJ...
```

---

# 🌐 Bichon CORS Configuration

One of the most important parts of the setup is CORS.

The extension communicates from a Thunderbird origin such as:

```text
moz-extension://xxxxxxxx
```

while the WebUI runs on:

```text
http://YOUR_SERVER_IP:15630
```

Bichon must therefore allow both origins.

Example:

```ini
BICHON_CORS_ORIGINS=http://192.168.1.50:15630,moz-extension://xxxxxxxx
```

Restart Bichon:

```bash
sudo systemctl restart bichon
```

---

# 📥 Installation

# Development Installation

## 1. Clone repository

```bash
git clone https://github.com/YOUR_USERNAME/bichon-thunderbird-archiver.git
```

---

## 2. Open Thunderbird

Go to:

```text
Tools
→ Add-ons and Themes
→ ⚙
→ Debug Add-ons
```

---

## 3. Load extension

```text
Load Temporary Add-on
```

Then select:

```text
manifest.json
```

---

# 📦 Persistent Installation

You can also install the ZIP directly:

```text
Add-ons
→ Install Add-on From File
```

This helps stabilize the `moz-extension://` identifier.

---

# ⚙️ Configuration

| Parameter    | Example                       |
| ------------ | ----------------------------- |
| Bichon URL   | `http://192.168.1.50:15630`   |
| API Endpoint | `/api/v1/import`              |
| Account ID   | `8416659527311215`            |
| Folder       | `Thunderbird`                 |
| Token        | `your_api_token`              |
| Auth Mode    | `Authorization: Bearer TOKEN` |

---

# 📨 Import Payload

The extension sends:

```json
{
  "account_id": 8416659527311215,
  "mail_folder": "Thunderbird",
  "emls": [
    "BASE64_URL_SAFE_EML"
  ]
}
```

---

# 🔬 Technical Discoveries

During development, several interesting behaviors were identified.

## Base64 Compatibility

Bichon rejected:

* standard Base64 containing `/`;
* Base64 URL-safe without padding.

Working encoding:

```text
+ → -
/ → _
keep = padding
```

---

## Thunderbird Raw Message Extraction

The extension uses:

```javascript
browser.messages.getRaw()
```

with:

```javascript
{
  data_format: "File",
  decrypt: true
}
```

This provides native EML extraction.

---

## Debug Mode

The extension includes a complete diagnostic system.

It logs:

* selected message metadata;
* EML size;
* Base64 size;
* HTTP requests;
* API responses;
* network errors;
* CORS issues;
* Thunderbird API failures.

---

# 🛠️ Project Structure

```text
.
├── manifest.json
├── background.js
├── popup.html
├── popup.css
├── popup.js
├── options.html
├── options.css
├── options.js
├── icons/
├── docs/
├── LICENSE
└── README.md
```

---

# 🧪 Tested Environment

| Component      | Version |
| -------------- | ------- |
| Thunderbird    | 140     |
| Bichon         | 1.x     |
| Debian         | 13      |
| Browser Engine | Gecko   |

---

# 🔮 Future Ideas

Potential future improvements:

* automatic folder synchronization;
* background archival;
* drag-and-drop support;
* OAuth authentication;
* mail tagging;
* automatic archival rules;
* Bichon account auto-discovery;
* Thunderbird context menu integration;
* archive status indicators;
* attachment-only import;
* batch queue system;
* signed Thunderbird release;
* Thunderbird Add-ons Store publication.

---

# 🤝 Contributing

Contributions are welcome.

Possible areas:

* UI/UX improvements;
* API compatibility;
* Thunderbird compatibility;
* testing;
* documentation;
* packaging/signing.

---

# 📚 Resources

## Bichon

* [https://github.com/rustmailer/bichon](https://github.com/rustmailer/bichon)

## Thunderbird Extension APIs

* [https://developer.thunderbird.net/](https://developer.thunderbird.net/)
* [https://webextension-api.thunderbird.net/](https://webextension-api.thunderbird.net/)

## Mozilla WebExtensions

* [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

---

# ❤️ Acknowledgements

Huge thanks to:

* the Bichon developers;
* the Thunderbird team;
* the Rust ecosystem;
* the self-hosted/open-source community.

---

# 📜 License

MIT License.

---

# 🦀 Built with Rust ecosystem compatibility in mind

```text
Thunderbird ❤️ Bichon ❤️ Rust
```
