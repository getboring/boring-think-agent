/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface GlobalProps {
    user_id: string;
  }
  interface Env {
    AI: Ai;
    LOADER: WorkerLoader;
    WorkspaceChatAgent: DurableObjectNamespace;
    ASSETS: Fetcher;
  }
}

declare module "*.css";
