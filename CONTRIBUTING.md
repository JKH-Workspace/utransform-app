# Contributing to uTransform

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Node.js](https://nodejs.org/) (v18+)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and logged in
- macOS with Apple Silicon

### Setup

```bash
git clone https://github.com/JKH-Workspace/utransform-app.git
cd utransform-app
npm install
npm run tauri dev
```

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/JKH-Workspace/utransform-app/issues) to avoid duplicates
2. Use the **Bug Report** template when creating a new issue
3. Include your macOS version, app version, and steps to reproduce

### Suggesting Features

1. Check [existing issues](https://github.com/JKH-Workspace/utransform-app/issues) first
2. Use the **Feature Request** template
3. Describe the problem your feature would solve

### Submitting Code

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feat/my-feature`
3. **Make your changes** with clear, focused commits
4. **Test** your changes locally with `npm run tauri dev`
5. **Submit a Pull Request** using the PR template

### Branch Naming

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code refactoring |
| `chore/` | Maintenance tasks |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add template import/export
fix: handle UTF-8 boundary in file reader
docs: update installation instructions
```

## Project Structure

```
utransform-app/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and Tauri bridge
│   └── pages/              # Page components
├── src-tauri/              # Rust backend
│   └── src/
│       ├── commands/       # Tauri command handlers
│       ├── services/       # Business logic
│       └── models/         # Data structures
├── package.json
└── src-tauri/tauri.conf.json
```

## Development Tips

- **Frontend only:** `npm run dev` starts the Vite dev server at `http://localhost:1420`
- **Full app:** `npm run tauri dev` launches the Tauri app with hot reload
- **Rust checks:** `cd src-tauri && cargo clippy`
- **TypeScript checks:** `npx tsc --noEmit`

## Code Style

- **Rust:** Follow `cargo clippy` recommendations
- **TypeScript:** Strict mode enabled, no unused variables
- **CSS:** Tailwind CSS utility classes preferred

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
