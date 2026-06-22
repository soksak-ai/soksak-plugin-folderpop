// folderpop 전역 CSS(1회 주입). 호스트 테마 변수(--fg/--bg/--bd/--acc/--fg3/--inset)만 쓴다(계약 A10).
// 자기 클래스(fp-*)만 스타일링 — 호스트 크롬 셀렉터/변수 덮어쓰기 금지.
export const GLOBAL_CSS = `
.fp-root { position:relative; display:flex; flex-direction:column; height:100%; font-size:12px; color:var(--fg); }
/* 폴더 선택 탭 줄 — 코어 콘텐츠 뷰 탭 구성/치수와 동일(boxed 칩 + 끝에 추가). 행 높이는 코어 크롬
   계약(--header-h=33, 콘텐츠 그룹 헤더와 동일 단), 칩은 24px(콘텐츠 뷰 탭과 동일). 자기 fp-* 만. */
.fp-tabs { flex:0 0 auto; height:var(--header-h, 33px); display:flex; align-items:center; gap:2px; padding:0 6px; overflow-x:auto; scrollbar-width:none; border-bottom:1px solid var(--bd); }
.fp-tabs::-webkit-scrollbar { display:none; }
.fp-tab { flex:none; height:24px; display:flex; align-items:center; padding:0 10px; border-radius:6px; font-size:12px; border:1px solid transparent; background:transparent; color:var(--fg2, var(--fg)); cursor:pointer; white-space:nowrap; max-width:160px; box-sizing:border-box; }
.fp-tab:hover { background:var(--inset, rgba(127,127,127,.16)); }
.fp-tab.active { font-weight:600; background:var(--card, rgba(127,127,127,.24)); border-color:var(--bd); color:var(--fg); }
.fp-tab-title { overflow:hidden; text-overflow:ellipsis; }
.fp-tab-rename { flex:none; min-width:0; max-width:160px; border:none; border-radius:6px; background:var(--inset); color:var(--fg); font-size:12px; padding:0 8px; outline:1px solid var(--acc); outline-offset:-1px; }
/* 추가(+) — 정사각 아이콘 버튼(flex 중앙정렬). 누르면 하위폴더 선택 모달. */
.fp-tab-add { flex:none; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border:none; border-radius:6px; background:transparent; color:var(--fg3); cursor:pointer; font-size:16px; line-height:1; padding:0; }
.fp-tab-add:hover { color:var(--fg); background:var(--inset, rgba(127,127,127,.16)); }
.fp-body { flex:1; overflow:auto; padding:4px 0; }
.fp-empty { padding:16px 12px; color:var(--fg3); font-size:11px; line-height:1.6; }
.fp-row { display:flex; align-items:center; gap:4px; padding:2px 6px; cursor:pointer; white-space:nowrap; user-select:none; }
.fp-row:hover { background:rgba(127,127,127,.14); }
.fp-tw { width:12px; text-align:center; color:var(--fg3); flex:none; }
.fp-ic { flex:none; }
.fp-nm { overflow:hidden; text-overflow:ellipsis; }
.fp-err { color:#e66; font-size:11px; padding:6px 12px; }
/* + 모달 — 플러그인 뷰 안 작은 오버레이. 프로젝트 하위폴더 목록에서 선택해 등록. */
.fp-modal-backdrop { position:absolute; inset:0; z-index:20; background:rgba(0,0,0,.35); display:flex; align-items:flex-start; justify-content:center; padding:38px 12px 12px; }
.fp-modal { display:flex; flex-direction:column; width:100%; max-width:280px; max-height:100%; background:var(--bg); border:1px solid var(--bd); border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,.4); overflow:hidden; }
.fp-modal-head { flex:0 0 auto; padding:8px 12px; font-size:12px; font-weight:600; color:var(--fg); border-bottom:1px solid var(--bd); }
.fp-modal-list { flex:1; min-height:0; overflow:auto; padding:4px; display:flex; flex-direction:column; gap:1px; }
.fp-modal-item { display:flex; align-items:center; gap:6px; width:100%; padding:5px 8px; border:none; border-radius:5px; background:transparent; color:var(--fg); cursor:pointer; font-size:12px; text-align:left; }
.fp-modal-item:hover:not(:disabled) { background:var(--inset, rgba(127,127,127,.16)); }
.fp-modal-item:disabled { opacity:.45; cursor:default; }
.fp-modal-tag { margin-left:auto; flex:none; font-size:10px; color:var(--fg3); }
.fp-modal-empty { padding:16px 12px; color:var(--fg3); font-size:11px; text-align:center; line-height:1.6; }
`;
