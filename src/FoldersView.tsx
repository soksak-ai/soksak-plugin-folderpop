// folderpop 좌측 사이드바 뷰 — 등록 폴더 선택(chips) + 설정(추가/이름변경/제거) + 활성 폴더 lazy 트리.
// 데이터는 folders.ts(app.data 단일진실). app.data.kv.watch 로 멀티창/커맨드 변경을 자동 반영.
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import type { PluginApi, PluginViewContext, Listing } from "./host";
import {
  type Folder,
  listFolders,
  activeFolder,
  addFolder,
  removeFolder,
  renameFolder,
  selectFolder,
} from "./folders";

type Child = { name: string; dir: boolean };

// 한 디렉터리 노드(lazy) — 펼치면 app.fs.list 로 자식 로드. 파일 클릭 → editor.open.
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
  const [open, setOpen] = useState(depth === 0); // 루트는 기본 펼침
  const [children, setChildren] = useState<Child[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!app.fs?.list) return;
    setLoading(true);
    try {
      const l = (await app.fs.list(path)) as Listing;
      // 코어 list_children 가 이미 정렬(dir 우선 + 소문자 바이트순) — file-tree 와 동일하게 그대로 쓴다.
      // 재정렬(localeCompare 등)하면 file-tree 와 순서가 달라진다(한글/라틴 collation 차이).
      setChildren(l.children);
    } catch {
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }, [app, path]);

  useEffect(() => {
    if (open && children === null) void load();
  }, [open, children, load]);

  const join = (p: string, n: string) => `${p.replace(/\/+$/, "")}/${n}`;
  const openFile = (filePath: string) => {
    void app.commands?.execute("editor.open", { path: filePath });
  };

  return (
    <>
      <div
        className="fp-row"
        style={{ paddingLeft: 6 + depth * 12 }}
        data-node={`tree/${depth === 0 ? "root" : name}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="fp-tw">{open ? "▾" : "▸"}</span>
        <span className="fp-ic">📁</span>
        <span className="fp-nm">{name}</span>
      </div>
      {open &&
        (loading && children === null ? (
          <div className="fp-row" style={{ paddingLeft: 6 + (depth + 1) * 12 }}>
            <span className="fp-nm" style={{ color: "var(--fg3)" }}>…</span>
          </div>
        ) : (
          (children ?? []).map((c) =>
            c.dir ? (
              <DirNode
                key={c.name}
                app={app}
                path={join(path, c.name)}
                name={c.name}
                depth={depth + 1}
              />
            ) : (
              <div
                key={c.name}
                className="fp-row"
                style={{ paddingLeft: 6 + (depth + 1) * 12 }}
                onClick={() => openFile(join(path, c.name))}
              >
                <span className="fp-tw" />
                <span className="fp-ic">📄</span>
                <span className="fp-nm">{c.name}</span>
              </div>
            ),
          )
        ))}
    </>
  );
}

export function FoldersView({ app }: { app: PluginApi; ctx: PluginViewContext }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [active, setActive] = useState<Folder | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [newPath, setNewPath] = useState("");
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

  const onAdd = async () => {
    setErr(null);
    try {
      await addFolder(app, newPath);
      setNewPath("");
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
  const onRemove = async (path: string) => {
    await removeFolder(app, path);
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
            >
              <span className="fp-tab-title">{f.name}</span>
              <button
                className="fp-tab-x"
                data-node={`remove/${f.name}`}
                title="폴더 제거"
                onClick={(e) => {
                  e.stopPropagation();
                  void onRemove(f.path);
                }}
              >
                ✕
              </button>
            </div>
          ),
        )}
        <button
          className="fp-tab-add"
          data-node="add-btn"
          title="폴더 추가"
          onClick={() => {
            setErr(null);
            setAdding((a) => !a);
          }}
        >
          +
        </button>
      </div>

      {adding && (
        <div className="fp-add">
          <input
            className="fp-input"
            data-node="add-path"
            placeholder="폴더 절대경로 붙여넣기"
            autoFocus
            value={newPath}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPath(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") void onAdd();
              else if (e.key === "Escape") setAdding(false);
            }}
          />
          {err && <div className="fp-err" data-node="add-err">{err}</div>}
        </div>
      )}

      <div className="fp-body">
        {active ? (
          // key=path: 활성 폴더 전환 시 루트를 remount(캐시된 children 초기화).
          <DirNode key={active.path} app={app} path={active.path} name={active.name} depth={0} />
        ) : (
          <div className="fp-empty">
            등록된 폴더가 없습니다.
            <br />⚙ 를 눌러 폴더를 추가하세요.
          </div>
        )}
      </div>
    </div>
  );
}
