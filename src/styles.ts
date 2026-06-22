// folderpop 전역 CSS(1회 주입). 호스트 테마 변수(--fg/--bg/--bd/--acc/--fg3/--inset)만 쓴다(계약 A10).
// 자기 클래스(fp-*)만 스타일링 — 호스트 크롬 셀렉터/변수 덮어쓰기 금지.
export const GLOBAL_CSS = `
.fp-root { display:flex; flex-direction:column; height:100%; font-size:12px; color:var(--fg); }
.fp-head { display:flex; align-items:center; gap:4px; padding:5px 6px; border-bottom:1px solid var(--bd-soft, var(--bd)); }
.fp-sel { flex:1; min-width:0; display:flex; gap:4px; overflow-x:auto; scrollbar-width:none; }
.fp-sel::-webkit-scrollbar { display:none; }
.fp-chip { flex:none; border:none; border-radius:6px; background:transparent; color:var(--fg3); padding:3px 8px; font-size:11px; cursor:pointer; white-space:nowrap; }
.fp-chip:hover { background:rgba(127,127,127,.18); color:var(--fg); }
.fp-chip.active { background:rgba(127,127,127,.28); color:var(--fg); }
.fp-gear { flex:none; border:none; background:transparent; color:var(--fg3); cursor:pointer; padding:3px 6px; border-radius:6px; font-size:13px; }
.fp-gear:hover { background:rgba(127,127,127,.18); color:var(--fg); }
.fp-gear.active { color:var(--acc); }
.fp-body { flex:1; overflow:auto; padding:4px 0; }
.fp-empty { padding:16px 12px; color:var(--fg3); font-size:11px; line-height:1.6; }
.fp-row { display:flex; align-items:center; gap:4px; padding:2px 6px; cursor:pointer; white-space:nowrap; user-select:none; }
.fp-row:hover { background:rgba(127,127,127,.14); }
.fp-tw { width:12px; text-align:center; color:var(--fg3); flex:none; }
.fp-ic { flex:none; }
.fp-nm { overflow:hidden; text-overflow:ellipsis; }
.fp-settings { border-bottom:1px solid var(--bd-soft, var(--bd)); padding:6px; display:flex; flex-direction:column; gap:6px; }
.fp-add { display:flex; gap:4px; }
.fp-input { flex:1; min-width:0; border:1px solid var(--bd); border-radius:6px; background:var(--inset, transparent); color:var(--fg); font-size:11px; padding:4px 7px; }
.fp-input:focus { outline:1px solid var(--acc); outline-offset:-1px; }
.fp-btn { flex:none; border:1px solid var(--bd); border-radius:6px; background:transparent; color:var(--fg); font-size:11px; padding:4px 8px; cursor:pointer; }
.fp-btn:hover { background:rgba(127,127,127,.18); }
.fp-flist { display:flex; flex-direction:column; gap:2px; }
.fp-fitem { display:flex; align-items:center; gap:4px; }
.fp-fitem .fp-input { padding:3px 6px; }
.fp-x { flex:none; border:none; background:transparent; color:var(--fg3); cursor:pointer; padding:2px 5px; border-radius:5px; font-size:12px; }
.fp-x:hover { background:rgba(127,127,127,.2); color:var(--fg); }
.fp-err { color:#e66; font-size:11px; padding:0 2px; }
`;
