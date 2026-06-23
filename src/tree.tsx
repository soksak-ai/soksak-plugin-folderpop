// folderpop 브라우즈 트리 — @pierre/trees(FileTree) 기반. file-tree LazyTree 를 단순화한 포팅:
// 활성 폴더의 자식을 lazy 로딩(펼침 시 app.fs.list) + OS 워처 증분 reconcile. git 레인 없음(폴더팝은
// 파일 탐색만). 파일 클릭 → editor.open 위임(코어 뷰어가 렌더). 테마는 호스트 CSS 변수(계약 A10).
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { FileTree, useFileTree } from "@pierre/trees/react";
import {
  themeToTreeStyles,
  type FileTreeBatchOperation,
  type FileTreeDirectoryHandle,
  type TreeThemeInput,
} from "@pierre/trees";
import type { Disposable, Listing, PluginApi } from "./host";

const PH = "​"; // 빈 폴더를 펼침가능으로 만드는 보이지 않는 placeholder(실제 파일과 충돌 불가)
const EMPTY_PATHS: readonly string[] = [];

const TREE_SCROLLBAR_CSS = `
::-webkit-scrollbar{-webkit-appearance:none;width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(127,127,127,0.22);border-radius:2px}
::-webkit-scrollbar-thumb:hover{background:rgba(127,127,127,0.42)}
::-webkit-scrollbar-corner{background:transparent}
`;

function cssVar(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

// --bg 명도로 다크 여부 추정(file-tree 와 동일). rgb()/hex 모두 처리.
export function detectDark(): boolean {
  const bg = cssVar("--bg", "#1e1e1e");
  const m = bg.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return 0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3] < 128;
  if (/^#([0-9a-f]{6})$/i.test(bg)) {
    const r = parseInt(bg.slice(1, 3), 16);
    const g = parseInt(bg.slice(3, 5), 16);
    const b = parseInt(bg.slice(5, 7), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b < 128;
  }
  return true;
}

// 호스트 테마 변수 → @pierre/trees 테마 입력(file-tree 와 동일 매핑 — 행 모양 동일 보장).
export function treeTheme(isDark: boolean): TreeThemeInput {
  return {
    type: isDark ? "dark" : "light",
    bg: cssVar("--bg", isDark ? "#1e1e1e" : "#ffffff"),
    fg: cssVar("--text", isDark ? "#dddddd" : "#222222"),
  };
}

// ── lazy 브라우즈 트리 ────────────────────────────────────────────────────────
// rootAbs(활성 폴더)의 자식을 바로 그린다(루트 노드 없음). 디렉토리 펼침 시 자식 lazy list,
// OS 워처로 추가/삭제만 증분 reconcile(펼침 상태 유지). 파일 선택 → onOpenFile(절대경로).
export function LazyTree({
  app,
  rootAbs,
  initialChildren,
  onOpenFile,
  theme,
}: {
  app: PluginApi;
  rootAbs: string;
  initialChildren: { name: string; dir: boolean }[];
  onOpenFile: (absPath: string) => void;
  theme: TreeThemeInput;
}) {
  const themeStyles = useMemo(
    () =>
      ({
        ...(themeToTreeStyles(theme) as CSSProperties),
        "--trees-padding-inline-override": "2px",
        "--trees-item-padding-x-override": "2px",
      }) as CSSProperties,
    [theme],
  );

  const loaded = useRef<Set<string>>(new Set());
  const knownDirs = useRef<Set<string>>(new Set());
  const childrenByDir = useRef<Map<string, Set<string>>>(new Map());
  const watchers = useRef<Map<string, Disposable>>(new Map());
  const modelRef = useRef<ReturnType<typeof useFileTree>["model"] | null>(null);
  const rootRef = useRef(rootAbs);
  rootRef.current = rootAbs;
  const openRef = useRef(onOpenFile);
  openRef.current = onOpenFile;
  const appRef = useRef(app);
  appRef.current = app;

  // 선택 → 파일이면 열고 즉시 deselect(선택 상태 비유지). 디렉토리는 펼침 effect 가 처리.
  const onSelectionChange = useCallback((selected: readonly string[]) => {
    for (let i = selected.length - 1; i >= 0; i--) {
      const rel = selected[i];
      if (rel.endsWith(PH)) continue;
      const item = modelRef.current?.getItem(rel);
      if (item && !item.isDirectory()) {
        const r = rootRef.current.replace(/\/+$/, "");
        openRef.current(`${r}/${rel}`);
        item.deselect();
        return;
      }
    }
  }, []);

  const options = useMemo(
    () => ({
      paths: EMPTY_PATHS,
      onSelectionChange,
      unsafeCSS: TREE_SCROLLBAR_CSS,
      density: "compact" as const,
      flattenEmptyDirectories: false,
    }),
    [onSelectionChange],
  );
  const { model } = useFileTree(options);
  modelRef.current = model;

  const absOf = useCallback(
    (rel: string) =>
      rel === ""
        ? rootRef.current.replace(/\/+$/, "")
        : `${rootRef.current.replace(/\/+$/, "")}/${rel}`,
    [],
  );

  const reconcileRef = useRef<(rel: string) => void>(() => {});

  // OS 워처 등록(폴링 없음) — 변경 시 그 디렉토리만 reconcile. dispose=unwatch.
  const watchDir = useCallback(
    (rel: string) => {
      if (watchers.current.has(rel)) return;
      const w = appRef.current.fs?.watch;
      if (!w) return;
      const d = w(absOf(rel), () => reconcileRef.current(rel));
      watchers.current.set(rel, d);
    },
    [absOf],
  );

  const applyChildren = useCallback(
    (rel: string, children: { name: string; dir: boolean }[]) => {
      const model = modelRef.current;
      if (!model) return;
      const ops: FileTreeBatchOperation[] = [];
      if (rel !== "" && children.length > 0) {
        ops.push({ type: "remove", path: `${rel}/${PH}` });
      }
      for (const c of children) {
        const p = rel === "" ? c.name : `${rel}/${c.name}`;
        if (c.dir) {
          ops.push({ type: "add", path: `${p}/${PH}` });
          knownDirs.current.add(p);
        } else {
          ops.push({ type: "add", path: p });
        }
      }
      loaded.current.add(rel);
      childrenByDir.current.set(rel, new Set(children.map((c) => c.name)));
      if (ops.length) model.batch(ops);
      watchDir(rel);
    },
    [watchDir],
  );

  const reconcile = useCallback(
    (rel: string, children: { name: string; dir: boolean }[]) => {
      const model = modelRef.current;
      if (!model) return;
      const prev = childrenByDir.current.get(rel);
      if (!prev) {
        applyChildren(rel, children);
        return;
      }
      const next = new Set(children.map((c) => c.name));
      const ops: FileTreeBatchOperation[] = [];
      const wasEmpty = prev.size === 0;
      const nowEmpty = next.size === 0;
      if (rel !== "" && wasEmpty && !nowEmpty) {
        ops.push({ type: "remove", path: `${rel}/${PH}` });
      }
      for (const c of children) {
        if (prev.has(c.name)) continue;
        const p = rel === "" ? c.name : `${rel}/${c.name}`;
        if (c.dir) {
          ops.push({ type: "add", path: `${p}/${PH}` });
          knownDirs.current.add(p);
        } else {
          ops.push({ type: "add", path: p });
        }
      }
      for (const name of prev) {
        if (next.has(name)) continue;
        const p = rel === "" ? name : `${rel}/${name}`;
        ops.push({ type: "remove", path: p });
        const isPrefix = (x: string) => x === p || x.startsWith(`${p}/`);
        for (const s of [...loaded.current]) if (isPrefix(s)) loaded.current.delete(s);
        for (const s of [...knownDirs.current])
          if (isPrefix(s)) knownDirs.current.delete(s);
        for (const k of [...childrenByDir.current.keys()])
          if (isPrefix(k)) childrenByDir.current.delete(k);
        for (const wrel of [...watchers.current.keys()]) {
          if (isPrefix(wrel)) {
            watchers.current.get(wrel)?.dispose();
            watchers.current.delete(wrel);
          }
        }
      }
      if (rel !== "" && !wasEmpty && nowEmpty) {
        ops.push({ type: "add", path: `${rel}/${PH}` });
      }
      childrenByDir.current.set(rel, next);
      if (ops.length) model.batch(ops);
    },
    [applyChildren],
  );

  // 워처 콜백이 최신 reconcile + 재-list 를 호출(폴링 없음).
  reconcileRef.current = (rel: string) => {
    const list = appRef.current.fs?.list;
    if (!list || !loaded.current.has(rel)) return;
    void list(absOf(rel))
      .then((l) => reconcile(rel, (l as Listing).children))
      .catch(() => {});
  };

  const loadDir = useCallback(
    (rel: string) => {
      if (loaded.current.has(rel)) return;
      loaded.current.add(rel);
      const list = appRef.current.fs?.list;
      if (!list) return;
      void list(absOf(rel))
        .then((l) => applyChildren(rel, (l as Listing).children))
        .catch(() => {});
    },
    [absOf, applyChildren],
  );

  // 최초: 루트 자식 반영.
  useEffect(() => {
    applyChildren("", initialChildren);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 펼침 감지 → 미로드 디렉토리 로드.
  useEffect(() => {
    const handle = () => {
      for (const dir of knownDirs.current) {
        if (loaded.current.has(dir)) continue;
        const item = model.getItem(dir);
        if (item?.isDirectory() && (item as FileTreeDirectoryHandle).isExpanded()) {
          loadDir(dir);
        }
      }
    };
    return model.subscribe(handle);
  }, [model, loadDir]);

  // 언마운트 시 모든 워처 해제.
  useEffect(() => {
    const map = watchers.current;
    return () => {
      for (const d of map.values()) d.dispose();
      map.clear();
    };
  }, []);

  return <FileTree className="fp-tree" style={themeStyles} model={model} />;
}
