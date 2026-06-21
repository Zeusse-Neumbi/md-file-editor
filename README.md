# MD Editor

A lightweight, fast desktop Markdown editor with live preview. Built for technical writers and developers who want a focused editing experience with optional workspace/file-tree navigation.

![Tauri](https://img.shields.io/badge/Tauri-2.11-FFC131?logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Rust](https://img.shields.io/badge/Rust-1.96-000000?logo=rust)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Download

Grab the latest release for your platform — no build tools required.

### Linux

| Format | Install |
|---|---|
| **`.deb`** (Debian/Ubuntu) | `sudo dpkg -i MD\ Editor_*.deb` |
| **`.rpm`** (Fedora/RHEL) | `sudo rpm -i MD\ Editor-*.rpm` |
| **`.AppImage`** (any distro) | `chmod +x MD\ Editor-*.AppImage && ./MD\ Editor-*.AppImage` |

### macOS

Open the `.dmg` and drag MD Editor to your Applications folder.

### Windows

Run the `.msi` installer or double-click the `.exe`.

> All releases are published on the [Releases page](https://github.com/Zeusse-Neumbi/md-file-editor/releases).  
> To build from source instead, see [Building](#building).

---

## Features

- **Split-pane editing** — Markdown source on the left, rendered preview on the right
- **Live preview** — GitHub Flavored Markdown with code syntax highlighting, updated in real time
- **Autosave** — Automatically saves 1.5 seconds after you stop typing
- **Manual save** — Ctrl+S to save immediately
- **File/folder modes** — Open a single `.md` file or an entire workspace folder
- **File tree sidebar** — Browse and open files when working in folder mode
- **Drag & drop** — Drop `.md` files or folders onto the window
- **Dark editor theme** — Easy on the eyes for long writing sessions
- **Light preview theme** — GitHub-style rendered output
- **XSS protection** — All HTML output sanitized via DOMPurify
- **Unsaved changes prompt** — Never lose work by accident

## Screenshots

*(Coming soon)*

## Prerequisites

- **Node.js** 20+ and **npm**
- **Rust** toolchain (install via [rustup](https://rustup.rs/))
- **System dependencies** (Linux):

```bash
sudo apt update && sudo apt install \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

For macOS or Windows, see the [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/).

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Zeusse-Neumbi/md-file-editor.git
cd md-file-editor

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev
```

This will start the Vite dev server and open a Tauri window with hot-reload enabled.

## Building

```bash
# Production build (optimized)
npm run tauri build

# Debug build (larger binary, retains debug symbols)
npm run tauri build --debug
```

Build artifacts are written to `src-tauri/target/release/` (or `debug/`).

### Linux Packages

| Format | Path |
|---|---|
| `.deb` | `src-tauri/target/release/bundle/deb/` |
| `.rpm` | `src-tauri/target/release/bundle/rpm/` |
| `.AppImage` | `src-tauri/target/release/bundle/appimage/` |

The same codebase builds for macOS (`.dmg`) and Windows (`.msi`/`.exe`) by running `tauri build` on those platforms with zero code changes.

## Usage

### Single-file mode

Open a single Markdown file to get a clean two-pane editor: editor on the left, preview on the right.

**Ways to open a file:**
- `File > Open File` (Ctrl+O)
- Drag and drop a `.md` file onto the window
- CLI: `md-editor path/to/file.md`

### Folder/Workspace mode

Open a folder to browse its contents in a sidebar and edit any Markdown file within.

**Ways to open a folder:**
- `File > Open Folder` (Ctrl+Shift+O)
- Drag and drop a folder onto the window
- CLI: `md-editor path/to/directory/`

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+S` | Save current file |
| `Ctrl+O` | Open file |
| `Ctrl+Shift+O` | Open folder |
| `Ctrl+B` | Toggle sidebar (folder mode) |

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Desktop framework | [Tauri 2](https://v2.tauri.app/) | ^2.11 |
| Backend | [Rust](https://www.rust-lang.org/) | edition 2024 |
| Frontend | [React](https://react.dev/) | ^19 |
| Build tool | [Vite](https://vitejs.dev/) | ^8 |
| Language | [TypeScript](https://www.typescriptlang.org/) | ^5.7 |
| Editor | [CodeMirror 6](https://codemirror.net/) | ^6.0 |
| Markdown parser | [marked](https://marked.js.org/) | ^18 |
| HTML sanitizer | [DOMPurify](https://github.com/cure53/DOMPurify) | ^3 |
| State management | [Zustand](https://zustand.docs.pmnd.rs/) | ^5 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | ^4 |
| Layout | [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) | ^4.11 |
| Syntax highlight | [highlight.js](https://highlightjs.org/) | ^11.9 |

## Project Structure

```
md-editor/
├── src-tauri/              # Rust backend (Tauri)
│   ├── src/
│   │   ├── commands/
│   │   │   ├── file.rs     # File I/O IPC commands
│   │   │   └── app.rs      # App metadata commands
│   │   ├── models.rs       # Data models (FileEntry, FileState)
│   │   ├── lib.rs          # Command registration
│   │   └── main.rs         # Entry point
│   ├── tauri.conf.json     # Tauri configuration
│   └── Cargo.toml
├── src/                    # React frontend
│   ├── components/
│   │   ├── App.tsx         # Root component, mode detection, autosave
│   │   ├── SplitPane.tsx   # Resizable editor/preview layout
│   │   ├── Editor.tsx      # CodeMirror 6 editor
│   │   ├── Preview.tsx     # Markdown rendered preview
│   │   ├── Sidebar.tsx     # File tree (folder mode)
│   │   ├── TitleBar.tsx    # Path and save status
│   │   └── Toast.tsx       # Notifications
│   ├── stores/
│   │   └── useEditorStore.ts  # Zustand state management
│   ├── lib/
│   │   ├── ipc.ts          # Typed Tauri invoke wrappers
│   │   ├── markdown.ts     # marked + DOMPurify + highlight.js
│   │   └── utils.ts        # Helpers (debounce)
│   ├── styles/
│   │   ├── globals.css     # Tailwind v4 + theme variables
│   │   └── preview.css     # GFM preview styling
│   ├── __tests__/          # Vitest test suite
│   ├── main.tsx            # React entry point
│   └── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Testing

```bash
# Run all frontend tests
npx vitest run

# Run all Rust tests
cd src-tauri && cargo test

# Run all tests (both)
cd src-tauri && cargo test && cd .. && npx vitest run
```

### Test coverage

| Suite | Tests | Scope |
|---|---|---|
| Frontend | 37 | Markdown rendering, store actions, editor, preview, sidebar |
| Backend | 15 | File read/write, directory listing, error handling |

## Future Plans (v2+)

- Git integration: file status, staging, commit, diff view
- Multi-tab editing
- Image paste/drag support
- Custom CSS themes for preview
- Search & replace across files
- Vim keybindings mode
- Mobile app (Tauri 2 supports iOS/Android)

## License

[MIT](LICENSE)
