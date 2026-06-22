// folderpop 전역 CSS(1회 주입). 호스트 테마 변수(--fg/--bg/--bd/--acc/--fg3/--inset)만 쓴다(계약 A10).
// 자기 클래스(fp-*)만 스타일링 — 호스트 크롬 셀렉터/변수 덮어쓰기 금지.
export const GLOBAL_CSS = `
.fp-root { display:flex; flex-direction:column; height:100%; font-size:12px; color:var(--fg); }
/* 폴더 선택 탭 줄 — 코어 콘텐츠 뷰 탭 구성/치수와 동일(boxed + 닫기 + 추가). 행 높이는 코어 크롬
   계약(--header-h=33, 콘텐츠 그룹 헤더와 동일 단), 칩은 24px(콘텐츠 뷰 탭과 동일). 자기 fp-* 만. */
.fp-tabs { flex:0 0 auto; height:var(--header-h, 33px); display:flex; align-items:center; gap:2px; padding:0 6px; overflow-x:auto; scrollbar-width:none; border-bottom:1px solid var(--bd); }
.fp-tabs::-webkit-scrollbar { display:none; }
.fp-tab { flex:none; height:24px; display:flex; align-items:center; gap:6px; padding:0 8px; border-radius:6px; font-size:12px; border:1px solid transparent; background:transparent; color:var(--fg2, var(--fg)); cursor:pointer; white-space:nowrap; max-width:160px; box-sizing:border-box; }
.fp-tab:hover { background:var(--inset, rgba(127,127,127,.16)); }
.fp-tab.active { font-weight:600; background:var(--card, rgba(127,127,127,.24)); border-color:var(--bd); color:var(--fg); }
.fp-tab-title { overflow:hidden; text-overflow:ellipsis; }
.fp-tab-x { flex:none; border:none; background:transparent; color:var(--fg3); cursor:pointer; font-size:10px; padding:0 1px; opacity:.55; line-height:1; }
.fp-tab-x:hover { opacity:1; color:var(--fg); }
.fp-tab-add { flex:none; height:24px; border:none; background:transparent; color:var(--fg3); cursor:pointer; font-size:15px; padding:0 6px; line-height:1; }
.fp-tab-add:hover { color:var(--fg); }
.fp-body { flex:1; overflow:auto; padding:4px 0; }
.fp-empty { padding:16px 12px; color:var(--fg3); font-size:11px; line-height:1.6; }
.fp-row { display:flex; align-items:center; gap:4px; padding:2px 6px; cursor:pointer; white-space:nowrap; user-select:none; }
.fp-row:hover { background:rgba(127,127,127,.14); }
.fp-tw { width:12px; text-align:center; color:var(--fg3); flex:none; }
.fp-ic { flex:none; }
.fp-nm { overflow:hidden; text-overflow:ellipsis; }
.fp-add { display:flex; flex-direction:column; gap:4px; padding:6px; border-bottom:1px solid var(--bd-soft, var(--bd)); }
.fp-input { flex:1; min-width:0; border:1px solid var(--bd); border-radius:6px; background:var(--inset, transparent); color:var(--fg); font-size:11px; padding:4px 7px; }
.fp-input:focus { outline:1px solid var(--acc); outline-offset:-1px; }
.fp-tab-rename { flex:none; min-width:0; max-width:160px; border:none; border-radius:6px; background:var(--inset); color:var(--fg); font-size:12px; padding:0 8px; outline:1px solid var(--acc); outline-offset:-1px; }
.fp-err { color:#e66; font-size:11px; padding:0 2px; }
`;
