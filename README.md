<p align="center">
  <img src=".me/app-icon.png" alt="uTransform" width="128" height="128">
</p>

<h1 align="center">uTransform</h1>

<p align="center">
  <strong>Transform any data into structured JSON with local AI</strong>
</p>

<p align="center">
  <a href="https://github.com/JKH-Workspace/utransform-app/releases/latest"><img src="https://img.shields.io/github/v/release/JKH-Workspace/utransform-app?style=flat-square&color=6366f1" alt="Latest Release"></a>
  <a href="https://github.com/JKH-Workspace/utransform-app/releases"><img src="https://img.shields.io/github/downloads/JKH-Workspace/utransform-app/total?style=flat-square&color=6366f1" alt="Downloads"></a>
  <a href="https://github.com/JKH-Workspace/utransform-app/blob/main/LICENSE"><img src="https://img.shields.io/github/license/JKH-Workspace/utransform-app?style=flat-square" alt="License"></a>
  <a href="https://github.com/JKH-Workspace/utransform-app/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/JKH-Workspace/utransform-app/ci.yml?style=flat-square&label=CI" alt="CI"></a>
</p>

<p align="center">
  Paste emails, Slack messages, images, web pages, or any unstructured data — uTransform converts it into your predefined JSON templates using local Claude Code. No servers, no API keys.
</p>

---

## Features

- **Universal Input** — Text, files (PDF, Excel, images), URLs, clipboard — anything goes
- **Custom JSON Templates** — Define your own output schemas with a visual editor
- **Parallel Processing** — Run multiple templates simultaneously on the same input
- **100% Local** — Powered by [Claude Code](https://docs.anthropic.com/en/docs/claude-code) running on your machine
- **Privacy First** — Your data never leaves your computer
- **Transform History** — Auto-saved results for easy reference

## Installation

### One-line Install (Recommended)

```bash
curl -fsSL https://github.com/JKH-Workspace/utransform-app/releases/latest/download/uTransform_macos_aarch64.tar.gz \
  | tar -xz -C /Applications/
```

### DMG Installer

Download the latest `.dmg` from the [Releases](https://github.com/JKH-Workspace/utransform-app/releases/latest) page and drag to Applications.

> **Note:** Since the app is not notarized, macOS may show a Gatekeeper warning. To allow it:
> 1. Try opening the app (it will be blocked)
> 2. Go to **System Settings > Privacy & Security**
> 3. Click **"Open Anyway"**

### Build from Source

Requires [Rust](https://www.rust-lang.org/tools/install) and [Node.js](https://nodejs.org/) (v18+).

```bash
git clone https://github.com/JKH-Workspace/utransform-app.git
cd utransform-app
npm install
npm run tauri build
```

Build outputs:
- **App bundle:** `src-tauri/target/release/bundle/macos/uTransform.app`
- **DMG installer:** `src-tauri/target/release/bundle/dmg/uTransform_*.dmg`

## Prerequisites

- **macOS** (Apple Silicon only)
- **Claude Code** installed and logged in
- Verify with: `claude -p "hello"`

## How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Any Input   │ --> │   Template   │ --> │ Structured   │
│  (text, file,│     │  (your JSON  │     │    JSON      │
│   URL, image)│     │    schema)   │     │   Output     │
└──────────────┘     └──────────────┘     └──────────────┘
                           |
                    Claude Code (local)
```

1. **Add inputs** — Paste text, drag files, or enter URLs
2. **Select templates** — Choose one or more JSON schemas
3. **Transform** — Hit Cmd+Enter and get structured JSON instantly

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS 4 |
| Backend | Rust + [Tauri v2](https://tauri.app/) |
| Build | Vite 7 |
| AI | Claude Code CLI (local) |

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

```bash
# Development
npm install
npm run tauri dev

# Run frontend only
npm run dev
```

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Made with Rust, React, and Claude Code
</p>
