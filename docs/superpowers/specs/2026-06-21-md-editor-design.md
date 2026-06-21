# MD Editor — Design Specification

**Date:** 2026-06-21  
**Status:** Approved  
**Version:** 0.1.0  

---

## 1. Overview

A lightweight, fast desktop Markdown editor with live preview. Built for technical writers and developers who want a focused editing experience with optional workspace/file-tree navigation.

### Core Principles

- **Linux-first**, architecturally cross-platform (Tauri enables easy porting)
- **Split-pane editing** — Markdown source on the left, rendered preview on the right
- **No surprises** — autosave by default, manual save on demand, clear error recovery
- **Security by design** — all file I/O goes through the Rust backend, never the WebView

---

## 2. Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|---|
| Desktop framework | **Tauri 2** | ^2.11 | Small bundles (~5MB), native performance, mobile-capable in future |
| Backend | **Rust** | stable (edition 2024) | File I/O, system commands, IPC security |
| Frontend | **React** | ^19 | UseActionState, useOptimistic, React Compiler built-in |
| Language | **TypeScript** | ^5.7 | Type safety for editor state, IPC calls |
| Build tool | **Vite** | ^8 (via Tauri template) | Rolldown-based (Rust bundler), 10-30x faster builds |
| Editor | **CodeMirror 6** | ^6.0 + @codemirror/lang-markdown ^6.5 | Industry standard, Markdown language support, syntax highlighting |
| Markdown parser | **marked** | ^18 | Fastest GFM parser, 36.8k ★, good extension API |
| HTML sanitizer | **DOMPurify** | ^3 | XSS protection — marked does not sanitize output |
| State management | **Zustand** | ^5 | ~1KB, async-native, no boilerplate |
| Styling | **Tailwind CSS** | ^4 | CSS-native config (no JS config file), 5-10x faster builds |
| Layout | **react-resizable-panels** | ^4.11 | Accessible resizable split pane |
| Syntax highlight | **highlight.js** | ^11.9 | Code block syntax coloring in preview |
| Plugins | `@tauri-apps/plugin-dialog` | — | Native file picker dialogs |
| | `@tauri-apps/plugin-fs` | — | Base filesystem access |

---

## 3. Project Structure

```
md-editor/
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # Entry point, plugin registration
│   │   ├── lib.rs                # App builder, command registration
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── file.rs           # open_file, save_file, open_directory
│   │   │   └── app.rs            # app metadata, version
│   │   └── models.rs             # FileEntry, FileState
│   ├── tauri.conf.json           # Tauri configuration
│   ├── Cargo.toml
│   └── icons/
├── src/                          # React frontend
│   ├── components/
│   │   ├── App.tsx               # Root component, mode detection
│   │   ├── SplitPane.tsx         # Resizable editor/preview layout
│   │   ├── Editor.tsx            # CodeMirror 6 wrapper
│   │   ├── Preview.tsx           # Markdown rendered preview
│   │   ├── Sidebar.tsx           # File tree (folder mode only)
│   │   ├── TitleBar.tsx          # Path, save status, menus
│   │   └── Toast.tsx             # Notification toasts
│   ├── stores/
│   │   └── useEditorStore.ts     # Zustand store (v5 — `create` named export)
│   ├── lib/
│   │   ├── markdown.ts           # marked parser + DOMPurify config
│   │   ├── ipc.ts                # Tauri invoke wrappers
│   │   └── utils.ts              # Shared helpers
│   ├── styles/
│   │   ├── globals.css           # @import "tailwindcss"; @theme { ... }
│   │   └── preview.css           # Markdown preview theme
│   ├── main.tsx                  # React entry point
│   └── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts                # @tailwindcss/vite plugin (no PostCSS)
└── postcss.config.js             # NOT USED — Tailwind v4 is a Vite plugin
```

---

## 4. Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Tauri App                             │
│                                                           │
│  ┌───────────────────────────────────────┐               │
│  │       Rust Backend                    │               │
│  │                                       │               │
│  │  Commands:   IPC Bus:                 │               │
│  │  open_file()                          │               │
│  │  save_file()  ◄── invoke/handle ──►   │               │
│  │  open_dir()                           │               │
│  │  check_status()                       │               │
│  └─────────────────┬─────────────────────┘               │
│                    │                                     │
│  ┌─────────────────┴─────────────────────┐               │
│  │       WebView (React + TypeScript)    │               │
│  │                                       │               │
│  │  Zustand Store ──► Editor (CM6)       │               │
│  │       │              │                │               │
│  │       │              ▼                │               │
│  │       └──────────► Preview (marked)   │               │
│  └───────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### Key principle

The Rust backend **owns all file I/O**. The frontend never touches the filesystem directly. This is Tauri's recommended security model and ensures predictable cross-platform behavior.

---

## 5. Rust Backend — IPC Commands

### Data Models

```rust
// models.rs

#[derive(Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_markdown: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FileState {
    pub path: String,
    pub content: String,
    pub is_modified: bool,
}
```

### Commands

| Command | Signature | Description |
|---|---|---|
| `open_file` | `(path: String) → FileState` | Read file content from disk |
| `save_file` | `(path: String, content: String) → ()` | Write content to disk |
| `open_directory` | `(path: String) → Vec<FileEntry>` | Scan directory for .md files and subdirectories |
| `check_file_status` | `(path: String) → { exists: bool, mtime: u64 }` | Check if file was modified externally |

### Security

- `tauri-plugin-dialog` for native file pickers
- No `dangerousAllowDirectoryAccess` — all filesystem access is via Rust commands
- CSP configured in `tauri.conf.json` to restrict WebView content sources

---

## 6. React Frontend — Components & State

### Zustand Store Shape (v5)

```typescript
import { create } from 'zustand';   // named export in v5 (no default export)
import { useShallow } from 'zustand/shallow';

interface EditorStore {
  // File
  currentFilePath: string | null;
  currentContent: string;
  savedContent: string;
  isModified: boolean;

  // Workspace
  workspacePath: string | null;
  fileTree: FileEntry[];

  // UI
  isSidebarOpen: boolean;
  isAutosaveEnabled: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';

  // Actions
  openFile: (path: string) => Promise<void>;
  saveFile: () => Promise<void>;
  openDirectory: (path: string) => Promise<void>;
  updateContent: (content: string) => void;
  setSidebarOpen: (open: boolean) => void;
}
```

### Component Responsibilities

| Component | Responsibility |
|---|---|
| `App` | Detect file vs folder mode on open, mount root layout |
| `TitleBar` | Display current file path, modified indicator (`*`), save status dot |
| `Sidebar` | Render file tree (folder mode only), `Ctrl+B` toggle, click to open file |
| `SplitPane` | `react-resizable-panels` v4 — `<Group>`/`<Separator>` components, two panels with draggable divider |
| `Editor` | CodeMirror 6 instance, markdown language mode, sync content ↔ store |
| `Preview` | `marked` render of content, code syntax highlighting |
| `Toast` | Notification bar for errors and status messages |

### Autosave Logic

```
On every editor change:
  → isModified = true
  → Clear existing autosave timer
  → Start new 1500ms timer
  → Timer fires: invoke('save_file', { path, content })

On Ctrl+S (manual save):
  → Cancel pending autosave timer
  → invoke('save_file', ...) immediately
  → Show "saved" status for 2 seconds
```

**React 19 optimization path (v2):** Use `useOptimistic` to show "saved" immediately during the save operation, and `useActionState` to manage save status transitions declaratively.

### Preview Debounce

```
Editor content changes → 200ms debounce → re-render preview
```

This keeps typing smooth while the preview stays responsive.

---

## 7. Markdown Rendering Pipeline

```
Markdown source string
       │
       ▼
    marked.parse(content)
       │  options: { gfm: true, breaks: true }
       │  highlight: hljs.highlight(code, lang)
       ▼
    HTML string
       │
       ▼
    DOMPurify.sanitize(html)
       │  Prevents XSS from raw HTML in markdown
       ▼
    Sanitized HTML string
       │
       ▼
    React dangerouslySetInnerHTML
       │  (in a <div class="md-preview">)
       ▼
    Styled preview with GFM theme
```

### Security: DOMPurify

`marked` does **not** sanitize its HTML output. Malicious markdown (e.g., `<script>alert('xss')</script>`) would execute in the preview pane. We use `DOMPurify` to strip dangerous tags and attributes before rendering:

```typescript
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function renderMarkdown(source: string): string {
  const raw = marked.parse(source);
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['p','br','strong','em','a','ul','ol','li',
                   'h1','h2','h3','h4','h5','h6','code','pre',
                   'blockquote','hr','table','thead','tbody','tr',
                   'th','td','img','input','del','ins','sup','sub'],
    ALLOWED_ATTR: ['href','src','alt','title','width','height',
                   'class','target','rel','checked','type'],
  });
}
```

### Preview CSS

- White background (light mode) or slate-900 (dark mode)
- GFM-compliant styling: tables with borders, blockquotes with left border, code blocks with dark background
- Images: max-width 100%, centered
- Links: colored, underlined on hover

---

## 8. File Opening Modes

| User Action | Detection | Mode |
|---|---|---|
| File > Open File (Ctrl+O) | File picked → single file | Single-file mode |
| File > Open Folder (Ctrl+Shift+O) | Directory picked | Folder mode |
| Drag & drop `.md` file | File extension check | Single-file mode |
| Drag & drop folder | Directory detection | Folder mode |
| CLI: `md-editor path/to/file.md` | File exists → file | Single-file mode |
| CLI: `md-editor path/to/dir/` | Directory | Folder mode |

**Single-file mode:** No sidebar. Just editor + preview. Title bar shows filename.
**Folder mode:** Sidebar visible with file tree. Title bar shows workspace-relative path.

---

## 9. Error Handling

### File I/O Errors

| Scenario | UX |
|---|---|
| File not found | Toast: "File not found at [path]" |
| Permission denied | Toast: "Permission denied" |
| External file change conflict | Dialog: "File was modified outside the app. Overwrite?" |
| Binary / non-UTF-8 file | Error: "Cannot open binary file" |
| Very large file (>5MB) | Warning: "Large file — editing may be slow" |

### State Recovery

- **Rust backend panic** — Tauri shows a native error dialog, app restarts
- **Autosave failure** — save status changes to `'error'` (red indicator in title bar)
- **App close with unsaved changes** — Tauri `on_window_event` triggers native "Save changes?" dialog

---

## 10. Testing

### Rust Backend (unit tests)

- `cargo test` with `tempfile` crate for isolated filesystem tests
- Test cases per command: success, file-not-found, permission-denied, empty-file, binary-file

### React Frontend (component tests)

- **Vitest** + **React Testing Library**
- Editor component: renders CM6, propagates content changes
- Preview component: renders markdown as HTML, handles empty/malformed content
- Sidebar: renders file tree, click handler
- Store: Zustand actions tested with mocked `invoke`

### Out of scope for v1

- E2E tests (Tauri's WebDriver integration is heavy)
- Integration tests across IPC boundary

---

## 11. Build & Distribution

### Development

```bash
npm run tauri dev     # Vite hot-reload + Tauri window
```

### Production

```bash
npm run tauri build   # Optimized Rust binary + bundled React build
```

### Linux Artifacts (v1)

| Format | Target |
|---|---|
| `.deb` | Debian/Ubuntu |
| `.AppImage` | Universal Linux |
| `.rpm` | Fedora/RHEL |

### Future Cross-Platform

The same codebase builds for macOS (`.dmg`) and Windows (`.msi`/`.exe`) by running `tauri build` on those platforms with zero code changes to the frontend or Rust backend. Requires platform-specific Tauri prerequisites.

---

## 12. v1 Feature Summary

| Feature | Status |
|---|---|
| Open single `.md` file | ✅ |
| Open folder as workspace | ✅ |
| Split pane (editor + preview) | ✅ |
| Resizable panes | ✅ |
| GFM Markdown rendering | ✅ |
| Code block syntax highlighting | ✅ |
| Autosave (1.5s debounce) | ✅ |
| Manual save (Ctrl+S) | ✅ |
| Dark editor theme | ✅ |
| Light preview theme | ✅ |
| File tree sidebar (folder mode) | ✅ |
| Drag & drop files/folders | ✅ |
| Native file picker dialogs | ✅ |
| Unsaved changes prompt on close | ✅ |
| CLI argument support | ✅ |
| Git integration | ❌ (v2) |
| Image paste/drag | ❌ (v2) |
| Custom themes | ❌ (v2) |
| Tabs / multi-file | ❌ (v2) |
| Search & replace | ❌ (v2) |

---

## 13. Future Directions (v2+)

- Git integration: file status, staging, commit, diff view
- Multi-tab editing
- Image paste support (via Tauri plugin)
- Custom CSS themes for preview
- Search & replace across files
- Vim keybindings mode
- Mobile app (Tauri 2 supports iOS/Android)
- Plugin system

---

## 14. Git Strategy

### Branching Model

```
main          ← stable, always releasable
  └── dev     ← integration branch for ongoing work
       ├── feature/v1-editor-core
       ├── feature/v1-file-tree
       └── ...
```

### Workflow

| Concept | Approach |
|---|---|
| **Main branch** | `main` — always releasable. Only merge from `dev` after review. Tags: `v0.1.0`, `v0.2.0`, etc. |
| **Development branch** | `dev` — feature branches merge here and are tested together before promoting to `main`. |
| **Feature branches** | `feature/<name>` — one per discrete feature. Branch from `dev`, merge back via PR/review. Short-lived (days, not weeks). |
| **Bug fixes** | Branch from `dev` as `fix/<name>`, merge back to `dev`. For critical patches to a release, branch from the tag as `hotfix/<name>`. |
| **Experiments** | `experiment/<name>` — branch from `dev`, delete if discarded. |
| **Commit style** | Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:` — enables auto-changelog generation later. |

### Rationale

For a single-developer project, this structure still pays off:

- **Interruptions**: Pause feature work to fix a bug → fix on `dev`, no half-done feature in the way.
- **Experimentation**: Try an approach in `experiment/xyz` — if it fails, delete the branch. No impact on working code.
- **Release isolation**: Ship `v0.1.0`, then start `v0.2.0` work while `v0.1.0` gets a critical patch → `main` tagged at `v0.1.0`, `dev` moves forward, hotfix branches from tag.

### First Commit

```bash
git init
git add .
git commit -m "chore: initial Tauri scaffold"
git branch dev
```

Start working on the first feature:
```bash
git checkout dev
git checkout -b feature/v1-editor-core
```

---

*End of specification.*
