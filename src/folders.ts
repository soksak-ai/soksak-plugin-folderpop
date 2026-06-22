// folderpop 데이터 레이어 — 등록 폴더 목록 + 활성 폴더. 단일 진실 = app.data.kv.
//  - "folders" : Folder[] (path 고유, name 표시명 = 기본 폴더명)
//  - "active"  : 활성 폴더 path("" = 첫 폴더). 멀티창 일관(app.data broadcast).
// 순수 변환(add/remove/rename/select)은 여기 한곳. UI·커맨드가 공유한다.

import type { PluginApi } from "./host";

export interface Folder {
  path: string;
  name: string;
}

const KEY_FOLDERS = "folders";
const KEY_ACTIVE = "active";

// 경로의 기본 표시명(마지막 세그먼트). 빈 경로면 경로 그대로.
export function baseName(path: string): string {
  const parts = path.replace(/[\\/]+$/, "").split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

// path 정규화 — 끝 슬래시 제거(중복 등록 방지). 빈 입력은 빈 문자열.
export function normalizePath(p: string): string {
  return p.trim().replace(/[\\/]+$/, "");
}

export async function listFolders(app: PluginApi): Promise<Folder[]> {
  const raw = (await app.data?.kv.get(KEY_FOLDERS)) as Folder[] | null;
  return Array.isArray(raw) ? raw : [];
}

export async function getActive(app: PluginApi): Promise<string> {
  const a = (await app.data?.kv.get(KEY_ACTIVE)) as string | null;
  return typeof a === "string" ? a : "";
}

async function saveFolders(app: PluginApi, folders: Folder[]): Promise<void> {
  await app.data?.kv.set(KEY_FOLDERS, folders);
}

async function saveActive(app: PluginApi, path: string): Promise<void> {
  await app.data?.kv.set(KEY_ACTIVE, path);
}

// 폴더 등록(중복 path 거부, 이름 기본=폴더명). 첫 등록이면 자동 활성. 반환=등록된 Folder.
export async function addFolder(
  app: PluginApi,
  rawPath: string,
  name?: string,
): Promise<Folder> {
  const path = normalizePath(rawPath);
  if (!path) throw new Error("빈 경로");
  // 디렉터리 검증(존재·디렉터리) — 코어 fs.list 가 비 디렉터리면 throw.
  if (!app.fs?.list) throw new Error("fs:read 권한 없음");
  await app.fs.list(path);
  const folders = await listFolders(app);
  if (folders.some((f) => f.path === path)) {
    throw new Error(`이미 등록된 폴더: ${path}`);
  }
  const folder: Folder = { path, name: (name ?? "").trim() || baseName(path) };
  const next = [...folders, folder];
  await saveFolders(app, next);
  if (folders.length === 0) await saveActive(app, path);
  return folder;
}

// 폴더 제거. 활성이던 폴더면 활성을 첫 폴더로 보정.
export async function removeFolder(app: PluginApi, path: string): Promise<void> {
  const p = normalizePath(path);
  const folders = await listFolders(app);
  const next = folders.filter((f) => f.path !== p);
  await saveFolders(app, next);
  const active = await getActive(app);
  if (active === p) await saveActive(app, next[0]?.path ?? "");
}

// 폴더 이름 변경(빈 이름 = 폴더명으로 복귀).
export async function renameFolder(
  app: PluginApi,
  path: string,
  name: string,
): Promise<Folder | null> {
  const p = normalizePath(path);
  const folders = await listFolders(app);
  let updated: Folder | null = null;
  const next = folders.map((f) => {
    if (f.path !== p) return f;
    updated = { ...f, name: name.trim() || baseName(p) };
    return updated;
  });
  if (updated) await saveFolders(app, next);
  return updated;
}

// 활성 폴더 선택(등록된 path 만).
export async function selectFolder(app: PluginApi, path: string): Promise<boolean> {
  const p = normalizePath(path);
  const folders = await listFolders(app);
  if (!folders.some((f) => f.path === p)) return false;
  await saveActive(app, p);
  return true;
}

// 활성 폴더 객체(없으면 첫 폴더, 비면 null).
export async function activeFolder(app: PluginApi): Promise<Folder | null> {
  const folders = await listFolders(app);
  if (folders.length === 0) return null;
  const active = await getActive(app);
  return folders.find((f) => f.path === active) ?? folders[0];
}
