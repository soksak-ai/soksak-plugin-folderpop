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

- `folder.list` — registered folders + active folder
- `folder.add` `{path, name?}` — register a folder (validated as a directory)
- `folder.remove` `{path}` — unregister
- `folder.rename` `{path, name}` — rename (empty resets to the folder name)
- `folder.select` `{path}` — set the active folder
- `ping` — load/version check

## Permissions

`ui`, `fs:read`, `data`, `commands`.

## Build

```
npm install
npm run build   # → main.js (esbuild single ESM)
```
