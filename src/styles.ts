// folderpop 전역 CSS(1회 주입). 호스트 테마 변수(--fg/--bg/--bd/--acc/--fg3/--inset)만 쓴다(계약 A10).
// 자기 클래스(fp-*)만 스타일링 — 호스트 크롬 셀렉터/변수 덮어쓰기 금지. 트리 행은 @pierre/trees 가
// themeToTreeStyles 로 그린다(file-tree 와 동일) — fp-* 는 래퍼/크롬만.
export const GLOBAL_CSS = `
.fp-root { position:relative; display:flex; flex-direction:column; height:100%; font-size:12px; color:var(--fg); }
/* 폴더 선택 탭 줄 — 코어 콘텐츠 뷰 탭 구성/치수와 동일(boxed 칩 + 끝에 추가). 행 높이는 코어 크롬
   계약(--header-h=33, 콘텐츠 그룹 헤더와 동일 단), 칩은 24px(콘텐츠 뷰 탭과 동일). 자기 fp-* 만. */
.fp-tabs { flex:0 0 auto; height:var(--header-h, 33px); display:flex; align-items:center; gap:2px; padding:0 6px; overflow-x:auto; scrollbar-width:none; border-bottom:1px solid var(--bd); }
.fp-tabs::-webkit-scrollbar { display:none; }
.fp-tab { flex:none; height:24px; display:flex; align-items:center; gap:4px; padding:0 6px 0 10px; border-radius:6px; font-size:12px; border:1px solid transparent; background:transparent; color:var(--fg2, var(--fg)); cursor:pointer; white-space:nowrap; max-width:160px; box-sizing:border-box; }
.fp-tab:hover { background:var(--inset, rgba(127,127,127,.16)); }
.fp-tab.active { font-weight:600; background:var(--card, rgba(127,127,127,.24)); border-color:var(--bd); color:var(--fg); }
.fp-tab-title { overflow:hidden; text-overflow:ellipsis; }
/* 칩 제거(×) — 코어 콘텐츠 탭의 닫기 affordance 와 동일: 작고 muted, hover 강조. 칩 끝에 붙는다.
   클릭은 FoldersView 에서 stopPropagation(칩 select/rename 으로 새지 않음). */
.fp-tab-x { flex:none; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border:none; border-radius:4px; background:transparent; color:var(--fg3); cursor:pointer; font-size:13px; line-height:1; padding:0; }
.fp-tab-x:hover { color:var(--fg); background:var(--inset, rgba(127,127,127,.24)); }
.fp-tab-rename { flex:none; min-width:0; max-width:160px; border:none; border-radius:6px; background:var(--inset); color:var(--fg); font-size:12px; padding:0 8px; outline:1px solid var(--acc); outline-offset:-1px; }
/* 추가(+) — 정사각 아이콘 버튼(flex 중앙정렬). 누르면 중첩 폴더 선택기 모달. */
.fp-tab-add { flex:none; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border:none; border-radius:6px; background:transparent; color:var(--fg3); cursor:pointer; font-size:16px; line-height:1; padding:0; }
.fp-tab-add:hover { color:var(--fg); background:var(--inset, rgba(127,127,127,.16)); }
.fp-body { flex:1; min-height:0; overflow:auto; padding:4px 0; }
.fp-empty { padding:16px 12px; color:var(--fg3); font-size:11px; line-height:1.6; }
.fp-msg { padding:12px; color:var(--fg3); font-size:12px; }
/* @pierre/trees 래퍼 — 영역을 채우게만(행 스타일은 themeToTreeStyles 변수가 그린다). */
.fp-tree { display:block; width:100%; height:100%; }
.fp-err { color:#e66; font-size:11px; padding:6px 12px; }
/* + 모달 — 플러그인 뷰 안 작은 오버레이. 중첩 폴더 트리에서 임의 깊이 폴더를 골라 등록. */
.fp-modal-backdrop { position:absolute; inset:0; z-index:20; background:rgba(0,0,0,.35); display:flex; align-items:flex-start; justify-content:center; padding:38px 12px 12px; }
.fp-modal { display:flex; flex-direction:column; width:100%; max-width:280px; max-height:100%; background:var(--bg); border:1px solid var(--bd); border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,.4); overflow:hidden; }
.fp-modal-head { flex:0 0 auto; padding:8px 12px; font-size:12px; font-weight:600; color:var(--fg); border-bottom:1px solid var(--bd); }
/* 모달 안 폴더 트리 영역 — 스크롤 컨테이너(트리는 @pierre/trees). 정의된 height 필수:
   @pierre/trees 의 내부 스크롤러는 host(.fp-tree height:100%) 가 % 높이를 풀 수 있어야 행을 그린다.
   min-height 만 주면 부모 height 가 auto 라 % 가 풀리지 않아 스크롤러가 0 높이로 접힌다(행 비표시). */
.fp-modal-tree { height:280px; overflow:auto; padding:4px 0; }
.fp-modal-empty { padding:16px 12px; color:var(--fg3); font-size:11px; text-align:center; line-height:1.6; }
/* 모달 푸터 — 선택된 폴더 경로 + 추가 버튼. */
.fp-modal-foot { flex:0 0 auto; display:flex; align-items:center; gap:8px; padding:8px 12px; border-top:1px solid var(--bd); }
/* 확인 모달 푸터 — 버튼 2개를 오른쪽 정렬(추가 모달의 pick 스페이서 대신). */
.fp-modal-foot-end { justify-content:flex-end; }
.fp-modal-pick { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; direction:rtl; text-align:left; font-size:11px; color:var(--fg3); }
.fp-modal-add { flex:none; padding:5px 14px; border:1px solid var(--bd); border-radius:6px; background:var(--inset, rgba(127,127,127,.16)); color:var(--fg); cursor:pointer; font-size:12px; }
.fp-modal-add:hover:not(:disabled) { background:var(--card, rgba(127,127,127,.24)); }
.fp-modal-add:disabled { opacity:.45; cursor:default; }
/* 제거 확인 모달 본문 — 표시명(강조) + 경로(muted, ellipsis) + 안내문. fp-modal-* 크롬 재사용. */
.fp-modal-confirm { flex:0 0 auto; padding:12px; display:flex; flex-direction:column; gap:4px; }
.fp-modal-confirm-name { font-size:13px; font-weight:600; color:var(--fg); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fp-modal-confirm-path { font-size:11px; color:var(--fg3); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; direction:rtl; text-align:left; }
.fp-modal-confirm-msg { margin-top:4px; font-size:11px; color:var(--fg3); line-height:1.5; }
/* 취소 = 중립(추가 버튼과 동일 톤). 제거 = 파괴적 강조(danger 텍스트, hover 시 채움). 호스트 var 만. */
.fp-modal-cancel { flex:none; padding:5px 14px; border:1px solid var(--bd); border-radius:6px; background:transparent; color:var(--fg); cursor:pointer; font-size:12px; }
.fp-modal-cancel:hover { background:var(--inset, rgba(127,127,127,.16)); }
.fp-modal-danger { flex:none; padding:5px 14px; border:1px solid var(--danger, #e66); border-radius:6px; background:transparent; color:var(--danger, #e66); cursor:pointer; font-size:12px; font-weight:600; }
.fp-modal-danger:hover { background:var(--danger, #e66); color:var(--bg); }
`;
