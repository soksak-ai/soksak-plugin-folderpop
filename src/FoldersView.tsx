// folderpop 좌측 사이드바 뷰 — 등록 폴더 선택(chips) + 추가(중첩 폴더 선택기) + 활성 폴더 lazy 트리.
// 트리/선택기는 @pierre/trees(file-tree 와 동일 라이브러리) — 행 모양 동일. 데이터는 folders.ts
// (app.data 단일진실). app.data.kv.watch 로 멀티창/커맨드 변경을 자동 반영.
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { PluginApi, PluginViewContext } from "./host";
import {
  type Folder,
  listFolders,
  activeFolder,
  addFolder,
  renameFolder,
  removeFolder,
  selectFolder,
  nodeKey,
} from "./folders";
import { LazyTree, detectDark, treeTheme } from "./tree";
import { FolderPicker } from "./picker";

// 활성 폴더의 초기 자식(루트 직속). LazyTree 가 lazy 펼침을 이어받는다.
function ActiveTree({
  app,
  rootAbs,
  isDark,
}: {
  app: PluginApi;
  rootAbs: string;
  isDark: boolean;
}) {
  const [children, setChildren] = useState<
    { name: string; dir: boolean }[] | null
  >(null);
  const theme = useMemo(() => treeTheme(isDark), [isDark]);

  useEffect(() => {
    let cancelled = false;
    const list = app.fs?.list;
    if (!list) {
      setChildren([]);
      return;
    }
    setChildren(null);
    void (list(rootAbs) as Promise<{ children: { name: string; dir: boolean }[] }>)
      .then((l) => {
        if (!cancelled) setChildren(l.children);
      })
      .catch(() => {
        if (!cancelled) setChildren([]);
      });
    return () => {
      cancelled = true;
    };
  }, [app, rootAbs]);

  const onOpenFile = useCallback(
    (absPath: string) => {
      void app.commands?.execute("editor.open", { path: absPath });
    },
    [app],
  );

  if (children === null) {
    return <div className="fp-msg">…</div>;
  }
  return (
    <LazyTree
      key={rootAbs}
      app={app}
      rootAbs={rootAbs}
      initialChildren={children}
      onOpenFile={onOpenFile}
      theme={theme}
    />
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
  const [isDark, setIsDark] = useState(detectDark);
  // 추가 모달에서 선택된 폴더 절대경로(임의 깊이). null = 선택 없음/등록됨 → 추가 비활성.
  const [pick, setPick] = useState<string | null>(null);
  // 제거 확인 모달 대상 폴더. null = 모달 닫힘.
  const [removing, setRemoving] = useState<Folder | null>(null);
  // 활성 칩 DOM 참조 — 활성 폴더 변경(및 마운트) 시 칩 줄을 가로 중앙으로 스크롤.
  const activeChipRef = useRef<HTMLDivElement | null>(null);

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

  // 호스트 테마 추종 — @pierre/trees 테마 입력 갱신(행 색 동기화).
  useEffect(() => {
    const off = app.events.on("theme.changed", (p) => {
      const mode = (p as { mode?: string })?.mode;
      if (mode === "dark" || mode === "light") setIsDark(mode === "dark");
    });
    return () => off.dispose();
  }, [app]);

  // 활성 칩을 가로 중앙으로 — 폴더 전환(및 마운트/목록 변경) 시 칩 줄을 스크롤.
  // 모두 보이면(넘침 없음) 무해한 no-op. 애니메이션 불필요(behavior:auto).
  useEffect(() => {
    activeChipRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "auto",
    });
  }, [active?.path, folders]);

  // + 모달에서 고른 폴더(임의 깊이)를 등록 후 그 폴더를 활성으로 — 칩 포커스 + ActiveTree 가 바로 새 폴더를
  // 비춘다(chip 클릭과 동일 selectFolder). addFolder 는 첫 폴더만 자동 활성이라 둘째 이후엔 직접 선택 필요.
  // 실패(중복 등)는 모달 안에 표시.
  const onAddPath = async (path: string) => {
    setErr(null);
    try {
      await addFolder(app, path);
      await selectFolder(app, path);
      setAdding(false);
      setPick(null);
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
  // 확인된 제거 — 데이터 레이어 removeFolder(=remove 커맨드와 동일 경로). 활성이던 폴더면
  // removeFolder 가 활성을 첫 폴더로 보정. app.data 동기화로 칩은 reactively 사라진다(수동 splice 금지).
  const onRemove = async (path: string) => {
    await removeFolder(app, path);
    setRemoving(null);
    await reload();
  };

  const openModal = () => {
    setErr(null);
    setPick(null);
    setAdding(true);
  };
  const closeModal = () => {
    setAdding(false);
    setPick(null);
  };

  const registered = useMemo(
    () => new Set(folders.map((f) => f.path)),
    [folders],
  );
  const pickerTheme = useMemo(() => treeTheme(isDark), [isDark]);

  return (
    <div className="fp-root">
      {/* 폴더 선택 탭 줄 — 코어 콘텐츠 뷰 탭 구성과 동일: boxed 탭 + 끝에 추가.
          더블클릭 = 이름 인라인 편집(박스 안 박스 금지), + = 폴더 추가(중첩 선택기 모달). */}
      <div className="fp-tabs">
        {folders.map((f) =>
          editingPath === f.path ? (
            <input
              key={f.path}
              className="fp-tab-rename"
              data-node={`rename/${nodeKey(f.path)}`}
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
              // 활성 칩에만 ref 부착 — 중앙 스크롤 대상.
              ref={active?.path === f.path ? activeChipRef : undefined}
              className={`fp-tab${active?.path === f.path ? " active" : ""}`}
              data-node={`chip/${nodeKey(f.path)}`}
              title={f.path}
              onClick={() => void onSelect(f.path)}
              onDoubleClick={() => setEditingPath(f.path)}
              // 칩 = 폴더 선택(클릭)/이름변경(더블클릭). 끝의 × = 제거 확인 모달(stopPropagation 으로
              // 칩 선택·더블클릭과 분리). 실제 제거는 확인 후 onRemove → removeFolder.
            >
              <span className="fp-tab-title">{f.name}</span>
              <button
                className="fp-tab-x"
                data-node={`chip-remove/${nodeKey(f.path)}`}
                title="폴더 제거"
                // × 클릭은 칩 select/rename 으로 새지 않게 차단 — 제거 확인 모달만 연다.
                onClick={(e) => {
                  e.stopPropagation();
                  setRemoving(f);
                }}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                ×
              </button>
            </div>
          ),
        )}
        <button
          className="fp-tab-add"
          data-node="add-btn"
          title="폴더 추가"
          onClick={openModal}
        >
          +
        </button>
      </div>

      {adding && (
        // 작은 모달 — 프로젝트 루트에서 *임의 깊이*의 폴더를 펼쳐 골라 등록. 배경 클릭/Esc 로 닫힘.
        <div
          className="fp-modal-backdrop"
          data-node="add-modal"
          onClick={closeModal}
        >
          <div
            className="fp-modal"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Escape") closeModal();
            }}
          >
            <div className="fp-modal-head">폴더 선택</div>
            <div className="fp-modal-tree" data-node="add-tree">
              {ctx.root ? (
                <FolderPicker
                  key={`${ctx.root}|${folders.length}`}
                  app={app}
                  rootAbs={ctx.root}
                  registered={registered}
                  theme={pickerTheme}
                  onPick={setPick}
                />
              ) : (
                <div className="fp-modal-empty">프로젝트 폴더가 없습니다.</div>
              )}
            </div>
            {err && (
              <div className="fp-err" data-node="add-err">
                {err}
              </div>
            )}
            <div className="fp-modal-foot">
              <span className="fp-modal-pick" title={pick ?? undefined}>
                {pick ?? "폴더를 선택하세요"}
              </span>
              <button
                className="fp-modal-add"
                data-node="add-confirm"
                disabled={!pick}
                onClick={() => pick && void onAddPath(pick)}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {removing && (
        // 제거 확인 모달 — 추가 모달과 동일한 fp-modal-* 크롬 재사용. 배경 클릭/Esc/취소 = 닫기(미제거).
        // 제거 = onRemove → removeFolder(파괴적). 표시명 + 경로를 함께 보여 오제거 방지.
        <div
          className="fp-modal-backdrop"
          data-node="remove-modal"
          onClick={() => setRemoving(null)}
        >
          <div
            className="fp-modal"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Escape") setRemoving(null);
            }}
          >
            <div className="fp-modal-head">폴더 제거</div>
            <div className="fp-modal-confirm">
              <div className="fp-modal-confirm-name">{removing.name}</div>
              <div className="fp-modal-confirm-path" title={removing.path}>
                {removing.path}
              </div>
              <div className="fp-modal-confirm-msg">
                목록에서 이 폴더를 제거합니다. (파일은 삭제되지 않습니다)
              </div>
            </div>
            <div className="fp-modal-foot fp-modal-foot-end">
              <button
                className="fp-modal-cancel"
                data-node="remove-cancel"
                onClick={() => setRemoving(null)}
              >
                취소
              </button>
              <button
                className="fp-modal-danger"
                data-node="remove-confirm"
                onClick={() => void onRemove(removing.path)}
              >
                제거
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fp-body">
        {active ? (
          // 활성 폴더의 자식을 바로 그린다(루트 노드 없음). key=path: 폴더 전환 시 remount.
          <ActiveTree
            key={active.path}
            app={app}
            rootAbs={active.path}
            isDark={isDark}
          />
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
