// soksak-plugin-folderpop 엔트리 — loader 가 blob-URL 로 import 하는 단일 ESM(esbuild 번들).
// 좌측 사이드바 폴더 탐색기(registerView "folders") + 헤드리스 커맨드. 데이터는 app.data(folders.ts).
// 파일 열기는 코어 editor.open 으로 위임 — 렌더는 등록된 뷰어(에디터/미디어) 몫.
import { createRoot, type Root } from "react-dom/client";
import { FoldersView } from "./FoldersView";
import { GLOBAL_CSS } from "./styles";
import { registerCommands } from "./commands";
import type { PluginContext, PluginViewContext } from "./host";

const STYLE_ID = "sk-folderpop-style";

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

const roots = new WeakMap<HTMLElement, Root>();

function mountInto(container: HTMLElement, node: React.ReactElement): void {
  ensureStyle();
  unmountContainer(container);
  container.style.position = "relative";
  const host = document.createElement("div");
  host.style.position = "absolute";
  host.style.inset = "0";
  container.appendChild(host);
  const root = createRoot(host);
  root.render(node);
  roots.set(container, root);
}

function unmountContainer(container: HTMLElement): void {
  const root = roots.get(container);
  if (root) {
    root.unmount();
    roots.delete(container);
  }
  container.replaceChildren();
}

export default {
  activate(ctx: PluginContext) {
    const app = ctx.app;
    ensureStyle();

    if (app.ui?.registerView) {
      ctx.subscriptions.push(
        app.ui.registerView("folders", {
          mount(container: HTMLElement, vctx: PluginViewContext) {
            mountInto(container, <FoldersView app={app} ctx={vctx} />);
          },
          unmount(container: HTMLElement) {
            unmountContainer(container);
          },
        }),
      );
    }

    registerCommands(ctx);
  },
  deactivate() {
    document.getElementById(STYLE_ID)?.remove();
  },
};
