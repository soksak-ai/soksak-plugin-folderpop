// 코어 플러그인 API 중 folderpop 이 쓰는 표면만 선언(별도 repo — 코어 소스 비의존, A7).
// soksak-plugin-spec v1 의 app.* 와 동형. 미선언 권한 표면은 런타임에 undefined.

export interface Disposable {
  dispose(): void;
}

// 코어 viewRegistry.PluginViewContext 와 동형.
export interface PluginViewContext {
  projectId: string;
  root: string | null;
  paneId: string | null;
  setBadge: (badge: number | "dot" | null) => void;
}

export interface PluginViewProvider {
  mount(container: HTMLElement, ctx: PluginViewContext): void;
  unmount?(container: HTMLElement): void;
}

export interface ParamSpec {
  type: string;
  description?: string;
  required?: boolean;
}

export interface PluginCommandSpec {
  description: string;
  triggers?: Record<string, string>;
  params?: Record<string, ParamSpec>;
  returns?: string;
  // 성공 데이터로 사람이 읽을 결과 한 문장을 만든다(코어 message 프로토콜).
  message?: (data: any) => string;
  handler: (params: Record<string, unknown>) => Promise<object> | object;
}

export interface CommandOutcome {
  ok: boolean;
  [k: string]: unknown;
}

// app.fs.list 반환(코어 ChildListing 과 동형).
export interface Listing {
  root: string;
  children: { name: string; dir: boolean }[];
}

export interface PluginApi {
  pluginId: string;
  locale: () => string;
  commands?: {
    register: (name: string, spec: PluginCommandSpec) => Disposable;
    execute: (
      name: string,
      params?: Record<string, unknown>,
    ) => Promise<CommandOutcome>;
  };
  events: {
    on: (event: string, fn: (payload: unknown) => void) => Disposable;
  };
  ui?: {
    registerView: (viewId: string, provider: PluginViewProvider) => Disposable;
  };
  fs?: {
    list?: (path: string, opts?: { meta?: boolean }) => Promise<unknown>;
    watch?: (dir: string, cb: (dir: string) => void) => Disposable;
    // 로컬 파일 → webview 로드 가능 URL(코어 표준). 미디어 미리보기 등.
    url?: (path: string) => Promise<string>;
  };
  data?: {
    kv: {
      get: (key: string) => Promise<unknown>;
      set: (key: string, value: unknown) => Promise<void>;
      // 이 플러그인 ns 의 kv 변경 전 창 구독(CLI/MCP·다른 창 반영). 변경된 key 콜백.
      watch?: (cb: (key: string | null) => void) => Disposable;
    };
  };
}

export interface PluginContext {
  app: PluginApi;
  manifest: unknown;
  dir: string;
  subscriptions: Disposable[];
}
