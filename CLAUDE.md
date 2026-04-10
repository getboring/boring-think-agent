# boring-think-agent

## What is this?
BoringWorks Think Agent. A Cloudflare Workers AI coding assistant with persistent virtual filesystem, sandboxed code execution, and git integration.

Built on Cloudflare's @cloudflare/think (extends Think<Env>), @cloudflare/shell, @cloudflare/codemode, and @cloudflare/shell/git.

## Stack
- **Runtime:** Cloudflare Workers (Durable Objects with SQLite)
- **AI:** Workers AI (@cf/moonshotai/kimi-k2.5 via workers-ai-provider)
- **Agent:** @cloudflare/think (Think<Env> base class with session management)
- **Frontend:** React 19 + Tailwind v4 + @cloudflare/kumo UI
- **Build:** Vite 8 + @cloudflare/vite-plugin
- **State:** Workspace (SQLite + R2 hybrid filesystem)
- **Sandbox:** DynamicWorkerExecutor (isolate-backed JS execution)
- **Git:** isomorphic-git via @cloudflare/shell/git

## Development
```bash
npm install
npm run types     # generate worker-configuration.d.ts (run after changing wrangler.jsonc)
npm run dev       # starts local dev with remote AI binding
npm run deploy    # build + deploy to Cloudflare
```

## Architecture
- `src/server.ts` — WorkspaceChatAgent extends Think<Env> (Durable Object). Handles chat, filesystem tools, git tools, sandboxed code execution. Think provides session persistence, message history, and lifecycle hooks.
- `src/client.tsx` — React frontend. Mobile-responsive file browser sidebar (drawer on mobile, static on desktop), chat interface, theme toggle, streaming markdown. File delete UI with trash icon (always visible on mobile, hover-revealed on desktop). r2FileCount and storage stats in sidebar footer.
- `wrangler.jsonc` — Cloudflare config: AI binding, WorkerLoader, DO migrations, SPA routing.

## Key bindings (wrangler.jsonc)
- `AI` — Workers AI (remote mode for local dev)
- `LOADER` — WorkerLoader for DynamicWorkerExecutor
- `WorkspaceChatAgent` — Durable Object namespace

## UI Patterns
- Sidebar: `fixed md:static md:inset-auto` with `translate-x-full` for mobile drawer
- Root layout: `h-dvh overflow-hidden` (iOS Safari safe — no `h-screen`)
- File rows: two sibling `<button>` elements (no nested interactive controls) — a11y compliant
- Delete is disabled during AI streaming (`status === "streaming"`)
- Escape key closes mobile drawer; selecting a file also closes it

## Conventions
- Integer cents for money (never floating point)
- All AI-generated content must be labeled
- No secrets in code
