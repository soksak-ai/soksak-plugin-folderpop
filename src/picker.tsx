// folderpop 중첩 폴더 선택기 — @pierre/trees(FileTree) 기반 *폴더 전용* 트리(브라우즈 트리와 동일 룩).
// 프로젝트 루트에 뿌리내리고, 펼치면 그 폴더의 하위 *디렉토리만* lazy list 한다(app.fs.list →
// c.dir 필터). 임의 깊이의 폴더를 골라 선택 상태로 두고, 상위가 "추가" 로 folder.add(절대경로) 한다.
// 이미 등록된 폴더는 선택해도 pick 으로 surface 하지 않는다(추가 버튼 비활성 유지).
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
import type { Listing, PluginApi } from "./host";

const PH = "​"; // 빈 폴더를 펼침가능으로 만드는 보이지 않는 placeholder
const EMPTY_PATHS: readonly string[] = [];

const PICKER_SCROLLBAR_CSS = `
::-webkit-scrollbar{-webkit-appearance:none;width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(127,127,127,0.22);border-radius:2px}
::-webkit-scrollbar-thumb:hover{background:rgba(127,127,127,0.42)}
::-webkit-scrollbar-corner{background:transparent}
`;

// 프로젝트 루트의 하위 디렉토리를 임의 깊이로 펼쳐 고른다. 선택된 폴더 절대경로를 onPick 으로
// surface(이미 등록된 경로는 surface 안 함 → null). rootAbs/registered 변경 시 key 로 remount.
export function FolderPicker({
  app,
  rootAbs,
  registered,
  theme,
  onPick,
}: {
  app: PluginApi;
  rootAbs: string;
  registered: Set<string>;
  theme: TreeThemeInput;
  onPick: (absPath: string | null) => void;
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
  const modelRef = useRef<ReturnType<typeof useFileTree>["model"] | null>(null);
  const rootRef = useRef(rootAbs);
  rootRef.current = rootAbs;
  const registeredRef = useRef(registered);
  registeredRef.current = registered;
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const appRef = useRef(app);
  appRef.current = app;

  const absOf = useCallback(
    (rel: string) =>
      rel === ""
        ? rootRef.current.replace(/\/+$/, "")
        : `${rootRef.current.replace(/\/+$/, "")}/${rel}`,
    [],
  );

  // 폴더 선택 → 절대경로 surface. 등록된 폴더면 null(추가 비활성). 선택 상태는 유지(시각 강조).
  const onSelectionChange = useCallback((selected: readonly string[]) => {
    for (let i = selected.length - 1; i >= 0; i--) {
      const rel = selected[i];
      if (rel.endsWith(PH)) continue;
      const abs = absOf(rel);
      pickRef.current(registeredRef.current.has(abs) ? null : abs);
      return;
    }
    pickRef.current(null);
  }, [absOf]);

  const options = useMemo(
    () => ({
      paths: EMPTY_PATHS,
      onSelectionChange,
      unsafeCSS: PICKER_SCROLLBAR_CSS,
      density: "compact" as const,
      flattenEmptyDirectories: false,
    }),
    [onSelectionChange],
  );
  const { model } = useFileTree(options);
  modelRef.current = model;

  // rel 디렉토리의 하위 *디렉토리만* 반영(파일 제외 — 폴더 전용 선택기).
  const applyDirs = useCallback(
    (rel: string, dirs: { name: string }[]) => {
      const model = modelRef.current;
      if (!model) return;
      const ops: FileTreeBatchOperation[] = [];
      if (rel !== "" && dirs.length > 0) {
        ops.push({ type: "remove", path: `${rel}/${PH}` });
      }
      for (const d of dirs) {
        const p = rel === "" ? d.name : `${rel}/${d.name}`;
        ops.push({ type: "add", path: `${p}/${PH}` });
        knownDirs.current.add(p);
      }
      loaded.current.add(rel);
      if (ops.length) model.batch(ops);
    },
    [],
  );

  const loadDir = useCallback(
    (rel: string) => {
      if (loaded.current.has(rel)) return;
      loaded.current.add(rel);
      const list = appRef.current.fs?.list;
      if (!list) return;
      void list(absOf(rel))
        .then((l) =>
          applyDirs(
            rel,
            (l as Listing).children.filter((c) => c.dir),
          ),
        )
        .catch(() => {});
    },
    [absOf, applyDirs],
  );

  // 최초: 루트의 하위 디렉토리 반영(브라우즈 트리의 initialChildren 와 동치 — 루트는 펼침 없이 바로 로드).
  useEffect(() => {
    const list = appRef.current.fs?.list;
    if (!list) return;
    let cancelled = false;
    void list(rootRef.current)
      .then((l) => {
        if (cancelled) return;
        loaded.current.add("");
        applyDirs(
          "",
          (l as Listing).children.filter((c) => c.dir),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 펼침 감지 → 미로드 디렉토리의 하위 디렉토리 로드.
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

  // FileTree 단일 자식 — .fp-modal-tree(flex:1, min-height:120) 가 정의된 높이를 주어 내부 스크롤러가
  // 높이를 얻는다. 형제 노드를 끼우면 height:100% 가 풀려 스크롤러가 0 높이로 접힌다(행은 있어도 비표시).
  return <FileTree className="fp-tree" style={themeStyles} model={model} />;
}
