# Bichon Thunderbird Archiver

<p align="center">
  <img src="./assets/logo-readme.png" alt="Bichon Thunderbird Archiver logo" width="340" />
</p>

<p align="center">
  <strong>Archive Thunderbird emails directly into Bichon using the official API.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Thunderbird-140%2B-0A84FF?style=for-the-badge&logo=thunderbird&logoColor=white" alt="Thunderbird 140+" />
  <img src="https://img.shields.io/badge/Bichon-1.x-2563EB?style=for-the-badge" alt="Bichon 1.x" />
  <img src="https://img.shields.io/badge/API-OpenAPI-85EA2D?style=for-the-badge&logo=openapiinitiative&logoColor=black" alt="OpenAPI" />
  <img src="https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge" alt="MIT License" />
</p>

---

## Overview

**Bichon Thunderbird Archiver** is a Thunderbird WebExtension that lets users archive selected emails directly into a self-hosted [Bichon](https://github.com/rustmailer/bichon) server.

The extension extracts selected Thunderbird emails as raw EML messages, converts them into the Base64 format expected by Bichon, and sends them to the official Bichon import endpoint:

```http
POST /api/v1/import
```

The goal is simple: make Bichon email archiving accessible from Thunderbird with a clean, user-friendly workflow.

---

## What problem does it solve?

Bichon is a powerful self-hosted email archiving solution, but importing messages manually can be less convenient for end users.

This extension allows users to archive emails directly from Thunderbird:

```text
Select email → Click Bichon icon → Archive to Bichon
```

No manual EML export.  
No command-line import.  
No copy/paste workflow.

---

## Features

- Thunderbird 140+ support.
- Direct integration with the Bichon REST API.
- Uses the official Bichon import endpoint.
- Archives one or multiple selected messages.
- Extracts raw EML using Thunderbird WebExtension APIs.
- User-configurable Bichon server URL.
- User-configurable account ID.
- User-configurable archive folder.
- API token authentication.
- User-friendly popup.
- Options page.
- Detailed debug report.
- Custom logo and icons.
- Base64 URL-safe encoding with padding for Bichon compatibility.

---

## Architecture

```text
Thunderbird
    ↓
Selected message(s)
    ↓
browser.messages.getRaw()
    ↓
Raw EML extraction
    ↓
Base64 URL-safe encoding with padding
    ↓
POST /api/v1/import
    ↓
Bichon Server
    ↓
Archived mail
```

---

## Bichon API endpoint

The extension uses:

```http
POST /api/v1/import
Authorization: Bearer <token>
Content-Type: application/json; charset=utf-8
```

Payload example:

```json
{
  "account_id": 8416659527311215,
  "mail_folder": "Thunderbird",
  "emls": [
    "BASE64_URL_SAFE_EML_WITH_PADDING"
  ]
}
```

---

## Important Base64 compatibility note

During testing, Bichon rejected:

- standard Base64 containing `/`;
- URL-safe Base64 without padding.

The working format is:

```text
+  →  -
/  →  _
=  is kept as padding
```

So the extension sends **Base64 URL-safe with padding**.

---

## Requirements

### Client

- Thunderbird 140 or newer.

### Server

- Bichon Server 1.x.
- A configured Bichon account.
- A valid Bichon access token.
- Network access from Thunderbird to the Bichon server.
- Correct CORS configuration.

---

## Installation

### Development / temporary installation

1. Download or clone this repository.
2. Open Thunderbird.
3. Go to:

```text
Tools → Add-ons and Themes → Gear icon → Debug Add-ons
```

4. Click:

```text
Load Temporary Add-on
```

5. Select:

```text
manifest.json
```

---

## Configuration

Open the extension options and configure:

| Field | Example |
|---|---|
| Bichon URL | `http://192.168.1.50:15630` |
| API endpoint | `/api/v1/import` |
| Account ID | `8416659527311215` |
| Folder | `Thunderbird` |
| Token | your Bichon access token |
| Auth mode | `Authorization: Bearer TOKEN` |

Important: when using the Bearer mode, paste only the token itself. Do not paste `Bearer` in the token field.

Correct:

```text
Token: DqqEjFAdskXQL1CZvlSmuYDn
Auth mode: Authorization: Bearer TOKEN
```

Incorrect:

```text
Token: Bearer DqqEjFAdskXQL1CZvlSmuYDn
Auth mode: Authorization: Bearer TOKEN
```

---

## CORS configuration

Bichon must allow the Thunderbird extension origin and the WebUI origin.

Example:

```ini
BICHON_CORS_ORIGINS=http://192.168.1.50:15630,moz-extension://YOUR_EXTENSION_UUID
```

Then restart Bichon:

```bash
sudo systemctl restart bichon
```

### Note about temporary extensions

When loading the extension temporarily, Thunderbird may change the `moz-extension://...` origin after reloads or restarts.

For a more stable setup, install the extension persistently or package/sign it.

---

## Usage

1. Select one or more emails in Thunderbird.
2. Click the Bichon extension icon.
3. Click **Archive selected messages**.
4. Wait for the result notification.
5. Open Bichon WebUI and check the configured folder.

---

## Debugging

The extension includes a detailed debug mode.

The debug report includes:

- selected message metadata;
- EML extraction status;
- EML size;
- Base64 size;
- encoding mode;
- request URL;
- request headers with masked token;
- account ID;
- target folder;
- HTTP status;
- Bichon response body;
- Thunderbird API errors;
- CORS/network errors.

This makes troubleshooting much easier.

---

## Project structure

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
├── assets/
├── docs/
├── LICENSE
├── README.md
└── package-extension.sh
```

---

## Tested environment

| Component | Version |
|---|---|
| Thunderbird | 140 |
| Bichon | 1.x |
| Debian | 13 |
| Installation mode | Native Bichon server |
| API | `/api/v1/import` |

---

## Roadmap

Possible future improvements:

- Stable packaged release.
- Thunderbird Add-ons publication.
- Automatic account discovery.
- Better folder mapping.
- Context menu integration.
- Queue and retry system.
- Archive status indicator.
- Per-folder archive rules.
- Bulk import progress bar.
- OAuth/token helper.
- Optional auto-archive rules.
- Better signed release workflow.
- Internationalization.

---

## Security notes

This extension sends selected email content to the configured Bichon server.

Make sure that:

- you trust the Bichon server;
- you use HTTPS when exposing Bichon outside a trusted LAN;
- you do not expose Bichon directly to the Internet without proper controls;
- your API token is kept private;
- CORS is configured intentionally.

Recommended access patterns:

- LAN only;
- VPN;
- Tailscale;
- reverse proxy with HTTPS and authentication.

---

## Disclaimer

This project is an independent community project.

It is not affiliated with, endorsed by, or sponsored by Mozilla, Thunderbird, or the Bichon project maintainers.

Thunderbird is a trademark of the Mozilla Foundation.  
Bichon belongs to its respective authors.

---

## License

MIT License.

---

## Credits

- Bichon project maintainers.
- Thunderbird team.
- Mozilla WebExtension documentation.
- Open-source and self-hosted communities.
