# soksak-plugin-folderpop

Left sidebar folder explorer for soksak. Register multiple folders (each renamable),
pick one, and browse its files and folders. Opening a file is delegated to the core
`editor.open` command — the registered editor / media viewers render it.

## Features

- Register multiple root folders by absolute path; each has a display name (default = folder name).
- Switch the active folder by clicking a chip; rename it by double-clicking the chip.
- Lazy folder tree (directories expand on click; folders first, then files).
- Remove folders only from the settings panel (⚙) — chips carry no destructive action.
- State (folder list, names, active folder) persists in `app.data` and is consistent
  across windows (live updates via `app.data.kv.watch`, no polling).

## Commands

Every feature is exposed as a command (`sok plugin.soksak-plugin-folderpop.<name>` / MCP):

- `list` — registered folders + active folder
- `add` `{path, name?}` — register a folder (validated as a directory)
- `remove` `{path}` — unregister
- `rename` `{path, name}` — rename (empty resets to the folder name)
- `select` `{path}` — set the active folder
- `ping` — load/version check

### Breaking change: `folder.*` prefix dropped

The full command name `plugin.soksak-plugin-folderpop.<name>` already states the
domain once. The `folder.` namespace restated it (a truncation of the id token
`folderpop`), so it is removed. Update any saved invocations:

| Old | New |
|-----|-----|
| `folder.list` | `list` |
| `folder.add` | `add` |
| `folder.remove` | `remove` |
| `folder.rename` | `rename` |
| `folder.select` | `select` |

## Permissions

`ui`, `fs:read`, `data`, `commands`.

## Build

```
npm install
npm run build   # → main.js (esbuild single ESM)
```
