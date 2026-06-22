# soksak-plugin-folderpop

soksak 좌측 사이드바 폴더 탐색기. 여러 폴더를 등록하고(각 이름 변경 가능) 선택한 폴더의
파일·폴더를 탐색한다. 파일 열기는 코어 `editor.open` 으로 위임 — 등록된 에디터/미디어 뷰어가 렌더.

## 기능

- 절대경로로 여러 루트 폴더 등록; 각 폴더에 표시명(기본=폴더명).
- 헤더의 chip 으로 활성 폴더 전환.
- lazy 폴더 트리(디렉터리는 클릭 시 펼침; 폴더 우선, 파일 후).
- 설정 패널(⚙)에서 폴더 이름 변경·제거.
- 상태(폴더 목록·이름·활성 폴더)는 `app.data` 에 영속, 멀티창 일관
  (`app.data.kv.watch` 로 live 반영, 폴링 0).

## 커맨드

모든 기능이 커맨드로 노출됩니다(`sok plugin.soksak-plugin-folderpop.<name>` / MCP):

- `folder.list` — 등록 폴더 + 활성 폴더
- `folder.add` `{path, name?}` — 폴더 등록(디렉터리 검증)
- `folder.remove` `{path}` — 등록 해제
- `folder.rename` `{path, name}` — 이름 변경(빈 값=폴더명 복귀)
- `folder.select` `{path}` — 활성 폴더 선택
- `ping` — 적재/버전 확인

## 권한

`ui`, `fs:read`, `data`, `commands`.

## 빌드

```
npm install
npm run build   # → main.js (esbuild 단일 ESM)
```
