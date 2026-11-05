# Contributing

Thanks for taking a look at MD Editor.

## Development setup

```bash
npm ci
npm run tauri dev
```

Run the checks before opening a pull request:

```bash
npm test
npm run typecheck
cd src-tauri && cargo fmt --check && cargo clippy -- -D warnings && cargo test
```

## Pull requests

- Keep changes focused and explain the user-facing effect.
- Add or update tests for behavior changes.
- Update the README when commands or features change.
- Do not commit build output, local paths, or editor scratch files.

## Reporting bugs

Open an issue with the bug report template. Include the operating system, app
version, reproduction steps, and any relevant console output. Do not include
personal file contents.
