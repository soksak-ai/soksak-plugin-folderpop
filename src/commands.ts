// folderpop 헤드리스 커맨드 — CLI/MCP 노출. 데이터는 folders.ts(app.data 직접)라 뷰 미오픈에도 동작.
// 뷰는 같은 app.data 를 watch 해 자동 반영(별도 알림 불필요).
import type { PluginContext } from "./host";
import {
  listFolders,
  addFolder,
  removeFolder,
  renameFolder,
  selectFolder,
  getActive,
} from "./folders";

export function registerCommands(ctx: PluginContext): void {
  const app = ctx.app;
  const reg = app.commands?.register;
  if (!reg) return;
  const push = (name: string, spec: Parameters<typeof reg>[1]) =>
    ctx.subscriptions.push(reg(name, spec));

  push("ping", {
    description: "Load/version check (E2E).",
    message: (d) => `폴더팝 ${d.version} 적재됨.`,
    handler: async () => ({ ok: true, plugin: "soksak-plugin-folderpop", version: "0.0.1" }),
  });

  push("list", {
    description: "List registered folders and the active folder path.",
    triggers: { ko: "폴더 목록 등록폴더 폴더팝 목록" },
    returns: "{ ok, folders:[{path,name}], active }",
    message: (d) => `${(d.folders ?? []).length}개 폴더가 등록되어 있습니다.`,
    handler: async () => ({
      ok: true,
      folders: await listFolders(app),
      active: await getActive(app),
    }),
  });

  push("add", {
    description: "Register a folder by absolute path (validated as a directory). Name defaults to the folder name.",
    triggers: { ko: "폴더 등록 추가 폴더팝 폴더추가" },
    params: {
      path: { type: "string", description: "Absolute folder path", required: true },
      name: { type: "string", description: "Display name (default: folder name)" },
    },
    returns: "{ ok, folder }",
    message: (d) => `${d.folder?.name}을(를) 등록했습니다.`,
    handler: async (p) => {
      try {
        const folder = await addFolder(app, p.path as string, p.name as string | undefined);
        return { ok: true, folder };
      } catch (e) {
        return { ok: false, code: "INVALID_INPUT", message: e instanceof Error ? e.message : String(e) };
      }
    },
    // 등록만으로는 활성이 되지 않을 수 있음(첫 폴더가 아니면) — 활성 전환을 제시(add→select 사이클).
    hint: (d) =>
      d.ok && (d.folder as { path?: unknown } | undefined)?.path
        ? [
            {
              cmd: `sok plugin.soksak-plugin-folderpop.select {"path":"${(d.folder as { path: string }).path}"}`,
              why: "등록한 폴더를 활성 폴더로 전환할 수 있습니다",
            },
          ]
        : [],
  });

  push("remove", {
    description: "Unregister a folder by path.",
    triggers: { ko: "폴더 제거 삭제 등록해제" },
    params: { path: { type: "string", description: "Folder path", required: true } },
    returns: "{ ok }",
    message: () => "폴더를 제거했습니다.",
    handler: async (p) => {
      await removeFolder(app, p.path as string);
      return { ok: true };
    },
  });

  push("rename", {
    description: "Rename a registered folder's display name (empty resets to the folder name).",
    triggers: { ko: "폴더 이름변경 이름 폴더명" },
    params: {
      path: { type: "string", description: "Folder path", required: true },
      name: { type: "string", description: "New display name; empty resets", required: true },
    },
    returns: "{ ok, folder }",
    message: (d) => `${d.folder?.name}(으)로 이름을 변경했습니다.`,
    handler: async (p) => {
      const folder = await renameFolder(app, p.path as string, p.name as string);
      return folder ? { ok: true, folder } : { ok: false, code: "NOT_FOUND", message: "폴더 없음" };
    },
  });

  push("select", {
    description: "Set the active folder (must be registered).",
    triggers: { ko: "폴더 선택 활성 전환" },
    params: { path: { type: "string", description: "Folder path", required: true } },
    returns: "{ ok }",
    message: () => "활성 폴더를 변경했습니다.",
    handler: async (p) => {
      const ok = await selectFolder(app, p.path as string);
      return ok ? { ok: true } : { ok: false, code: "NOT_FOUND", message: "등록되지 않은 폴더" };
    },
  });
}
