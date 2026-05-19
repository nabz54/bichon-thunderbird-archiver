# Bichon Thunderbird Archiver

**Bichon Thunderbird Archiver** is a Thunderbird 140+ WebExtension that lets users archive selected emails directly into a self-hosted [Bichon](https://github.com/rustmailer/bichon) server through the official Bichon API.

It retrieves the selected Thunderbird message as raw EML, encodes it, and sends it to:

```http
POST /api/v1/import
```

## Features

- Thunderbird 140+ compatible.
- User-friendly popup.
- Configuration page.
- Custom Bichon server URL.
- Custom API endpoint.
- API token support.
- Bichon account ID configuration.
- Target folder configuration.
- Single or multiple selected messages.
- Direct EML import through Bichon API.
- Debug mode with detailed diagnostics.
- Base64 URL-safe encoding with padding for Bichon compatibility.

## How it works

```text
Thunderbird selected email
        ↓
messages.getRaw()
        ↓
EML extraction
        ↓
Base64 URL-safe encoding with padding
        ↓
POST /api/v1/import
        ↓
Bichon Server
```

Payload sent to Bichon:

```json
{
  "account_id": 1,
  "mail_folder": "Thunderbird",
  "emls": ["BASE64_URL_SAFE_EML"]
}
```

## Requirements

- Thunderbird 140 or newer.
- Bichon Server 1.x.
- A valid Bichon API access token.
- A configured Bichon mail account.
- Correct CORS configuration on the Bichon server.

## Bichon CORS configuration

If you use this extension from Thunderbird, Bichon must allow both the WebUI origin and the Thunderbird extension origin.

Example:

```ini
BICHON_CORS_ORIGINS=http://YOUR_BICHON_IP:15630,moz-extension://YOUR_EXTENSION_UUID
```

Restart Bichon after changing `/etc/bichon.env`:

```bash
sudo systemctl restart bichon
```

## Installation for development

1. Clone this repository.
2. Open Thunderbird.
3. Go to:
   ```text
   Tools → Add-ons and Themes → Gear icon → Debug Add-ons
   ```
4. Click:
   ```text
   Load Temporary Add-on
   ```
5. Select `manifest.json`.

## Configuration

Open the extension options and configure:

| Field | Example |
|---|---|
| Bichon URL | `http://X.X.X.X:15630` |
| API endpoint | `/api/v1/import` |
| Account ID | `1` |
| Mail folder | `Thunderbird` |
| Token | your Bichon access token |
| Auth mode | `Authorization: Bearer TOKEN` |

Do not include `Bearer` inside the token field when using the default Bearer mode.

## Usage

1. Select one or more emails in Thunderbird.
2. Click the Bichon icon.
3. Click **Archive selected messages**.
4. Check the result notification.
5. If it fails, copy the debug report and inspect the error.

## Debugging

The extension includes a debug report showing:

- selected message metadata;
- EML size;
- Base64 size;
- API URL;
- account ID;
- target folder;
- HTTP response;
- Bichon response body;
- CORS/network errors.

## Known notes

Thunderbird temporary add-ons may use changing `moz-extension://...` origins. For stable CORS configuration, install the extension persistently or package/sign it properly.

## Project status

Prototype / experimental.

This extension was created while testing native Bichon deployment and API-based email archiving from Thunderbird.

## License

MIT
