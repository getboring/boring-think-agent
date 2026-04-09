# boring-think-agent

## What is this?
BoringWorks Think Agent. A Cloudflare Workers AI coding assistant with persistent virtual filesystem, sandboxed code execution, and git integration.

Built on Cloudflare's best packages: @cloudflare/ai-chat, @cloudflare/shell, @cloudflare/codemode, and @cloudflare/shell/git.

## Stack
- **Runtime:** Cloudflare Workers (Durable Objects with SQLite)
- **AI:** Workers AI (@cf/moonshotai/kimi-k2.5 via workers-ai-provider)
- **Frontend:** React 19 + Tailwind v4 + @cloudflare/kumo UI
- **Build:** Vite 8 + @cloudflare/vite-plugin
- **State:** Workspace (SQLite + R2 hybrid filesystem)
- **Sandbox:** DynamicWorkerExecutor (isolate-backed JS execution)
- **Git:** isomorphic-git via @cloudflare/shell/git

## Development
```bash
npm install
npm run dev       # starts local dev with remote AI binding
npm run deploy    # build + deploy to Cloudflare
```

## Architecture
- `src/server.ts` — WorkspaceChatAgent (Durable Object). Handles chat, filesystem tools, git tools, sandboxed code execution.
- `src/client.tsx` — React frontend. File browser sidebar, chat interface, theme toggle, streaming markdown.
- `wrangler.jsonc` — Cloudflare config: AI binding, WorkerLoader, DO migrations, SPA routing.

## Key bindings (wrangler.jsonc)
- `AI` — Workers AI (remote mode for local dev)
- `LOADER` — WorkerLoader for DynamicWorkerExecutor
- `WorkspaceChatAgent` — Durable Object namespace

## Conventions
- Integer cents for money (never floating point)
- All AI-generated content must be labeled
- No secrets in code
