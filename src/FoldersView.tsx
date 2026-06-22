// folderpop 좌측 사이드바 뷰 — 등록 폴더 선택(chips) + 추가(프로젝트 하위폴더 선택 모달) + 활성 폴더 lazy 트리.
// 데이터는 folders.ts(app.data 단일진실). app.data.kv.watch 로 멀티창/커맨드 변경을 자동 반영.
import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";
import type { PluginApi, PluginViewContext, Listing } from "./host";
import {
  type Folder,
  listFolders,
  activeFolder,
  addFolder,
  renameFolder,
  selectFolder,
} from "./folders";

type Child = { name: string; dir: boolean };

const joinPath = (p: string, n: string) => `${p.replace(/\/+$/, "")}/${n}`;

// 한 디렉터리의 자식들(lazy 로딩) — 디렉터리=DirNode(접기), 파일=행. 정렬은 코어 순서(file-tree 동일).
// [RULE] 루트(활성 폴더)는 자기 노드 없이 자식을 *바로* 그린다(file-tree: project1 헤더 + 자식 직접).
function FolderChildren({
  app,
  path,
  depth,
}: {
  app: PluginApi;
  path: string;
  depth: number;
}) {
  const [children, setChildren] = useState<Child[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const list = app.fs?.list;
    if (!list) {
      setChildren([]);
      return;
    }
    void (list(path) as Promise<Listing>)
      .then((l) => {
        if (!cancelled) setChildren(l.children);
      })
      .catch(() => {
        if (!cancelled) setChildren([]);
      });
    return () => {
      cancelled = true;
    };
  }, [app, path]);

  const openFile = (filePath: string) => {
    void app.commands?.execute("editor.open", { path: filePath });
  };

  if (children === null) {
    return (
      <div className="fp-row" style={{ paddingLeft: 6 + depth * 12 }}>
        <span className="fp-nm" style={{ color: "var(--fg3)" }}>…</span>
      </div>
    );
  }
  return (
    <>
      {children.map((c) =>
        c.dir ? (
          <DirNode key={c.name} app={app} path={joinPath(path, c.name)} name={c.name} depth={depth} />
        ) : (
          <div
            key={c.name}
            className="fp-row"
            style={{ paddingLeft: 6 + depth * 12 }}
            onClick={() => openFile(joinPath(path, c.name))}
          >
            <span className="fp-tw" />
            <span className="fp-ic">📄</span>
            <span className="fp-nm">{c.name}</span>
          </div>
        ),
      )}
    </>
  );
}

// 하위 디렉터리 노드 — 폴더 행(접기) + 펼치면 자식(FolderChildren). 클릭=토글. 파일 열기는 editor.open.
function DirNode({
  app,
  path,
  name,
  depth,
}: {
  app: PluginApi;
  path: string;
  name: string;
  depth: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="fp-row"
        style={{ paddingLeft: 6 + depth * 12 }}
        data-node={`tree/${name}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="fp-tw">{open ? "▾" : "▸"}</span>
        <span className="fp-ic">📁</span>
        <span className="fp-nm">{name}</span>
      </div>
      {open && <FolderChildren app={app} path={path} depth={depth + 1} />}
    </>
  );
}

// 프로젝트 루트의 *하위 디렉터리*만 나열해 고른다(+ 모달 본문). 이미 등록된 폴더는 비활성.
function SubfolderPicker({
  app,
  root,
  registered,
  onPick,
}: {
  app: PluginApi;
  root: string | null;
  registered: Set<string>;
  onPick: (path: string) => void;
}) {
  const [dirs, setDirs] = useState<Child[] | null>(null);

  useEffect(() => {
    if (!root) {
      setDirs([]);
      return;
    }
    let cancelled = false;
    const list = app.fs?.list;
    if (!list) {
      setDirs([]);
      return;
    }
    void (list(root) as Promise<Listing>)
      .then((l) => {
        if (!cancelled) setDirs(l.children.filter((c) => c.dir));
      })
      .catch(() => {
        if (!cancelled) setDirs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [app, root]);

  if (!root) return <div className="fp-modal-empty">프로젝트 폴더가 없습니다.</div>;
  if (dirs === null) return <div className="fp-modal-empty">…</div>;
  if (dirs.length === 0)
    return <div className="fp-modal-empty">하위 폴더가 없습니다.</div>;

  return (
    <div className="fp-modal-list">
      {dirs.map((d) => {
        const path = joinPath(root, d.name);
        const already = registered.has(path);
        return (
          <button
            key={d.name}
            className="fp-modal-item"
            data-node={`add-pick/${d.name}`}
            disabled={already}
            onClick={() => onPick(path)}
          >
            <span className="fp-ic">📁</span>
            <span className="fp-nm">{d.name}</span>
            {already && <span className="fp-modal-tag">등록됨</span>}
          </button>
        );
      })}
    </div>
  );
}

export function FoldersView({
  app,
  ctx,
}: {
  app: PluginApi;
  ctx: PluginViewContext;
}) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [active, setActive] = useState<Folder | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const list = await listFolders(app);
    setFolders(list);
    setActive(await activeFolder(app));
  }, [app]);

  useEffect(() => {
    void reload();
    // 같은 ns(folderpop) 변경을 watch — 커맨드/다른 창의 폴더 변경 자동 반영.
    const un = app.data?.kv.watch?.(() => void reload());
    return () => un?.dispose();
  }, [reload, app]);

  // + 모달에서 고른 하위폴더를 등록. 실패(중복 등)는 모달 안에 표시.
  const onAddPath = async (path: string) => {
    setErr(null);
    try {
      await addFolder(app, path);
      setAdding(false);
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const onRename = async (path: string, name: string) => {
    await renameFolder(app, path, name);
    await reload();
  };
  const onSelect = async (path: string) => {
    await selectFolder(app, path);
    await reload();
  };

  return (
    <div className="fp-root">
      {/* 폴더 선택 탭 줄 — 코어 콘텐츠 뷰 탭 구성과 동일: boxed 탭 + 닫기 + 끝에 추가.
          더블클릭 = 이름 인라인 편집(박스 안 박스 금지), + = 폴더 추가(경로 입력 행 토글). */}
      <div className="fp-tabs">
        {folders.map((f) =>
          editingPath === f.path ? (
            <input
              key={f.path}
              className="fp-tab-rename"
              data-node={`rename/${f.name}`}
              defaultValue={f.name}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                void onRename(f.path, e.target.value);
                setEditingPath(null);
              }}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                else if (e.key === "Escape") setEditingPath(null);
              }}
            />
          ) : (
            <div
              key={f.path}
              className={`fp-tab${active?.path === f.path ? " active" : ""}`}
              data-node={`chip/${f.name}`}
              title={f.path}
              onClick={() => void onSelect(f.path)}
              onDoubleClick={() => setEditingPath(f.path)}
              // 칩은 폴더 *선택/이름변경(더블클릭)*만 — 제거 기능 없음(파괴적 동작 미제공).
            >
              <span className="fp-tab-title">{f.name}</span>
            </div>
          ),
        )}
        <button
          className="fp-tab-add"
          data-node="add-btn"
          title="폴더 추가"
          onClick={() => {
            setErr(null);
            setAdding(true);
          }}
        >
          +
        </button>
      </div>

      {adding && (
        // 작은 모달 — 프로젝트 폴더의 *하위 폴더*를 골라 등록한다. 배경 클릭/Esc 로 닫힘.
        <div
          className="fp-modal-backdrop"
          data-node="add-modal"
          onClick={() => setAdding(false)}
        >
          <div
            className="fp-modal"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Escape") setAdding(false);
            }}
          >
            <div className="fp-modal-head">프로젝트 하위 폴더 선택</div>
            <SubfolderPicker
              app={app}
              root={ctx.root}
              registered={new Set(folders.map((f) => f.path))}
              onPick={(p) => void onAddPath(p)}
            />
            {err && <div className="fp-err" data-node="add-err">{err}</div>}
          </div>
        </div>
      )}

      <div className="fp-body">
        {active ? (
          // 활성 폴더의 자식을 *바로* 그린다(루트 노드 없음 — file-tree 와 동일 구조). key=path: 폴더
          // 전환 시 remount.
          <FolderChildren key={active.path} app={app} path={active.path} depth={0} />
        ) : (
          <div className="fp-empty">
            등록된 폴더가 없습니다.
            <br />+ 를 눌러 폴더를 추가하세요.
          </div>
        )}
      </div>
    </div>
  );
}
