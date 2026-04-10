# BoringWorks Think Agent

An AI coding assistant built on Cloudflare Workers with a persistent virtual filesystem, sandboxed code execution, and full git integration.

## Features

- **Persistent Virtual Filesystem** — Files persist across conversations using SQLite + R2 hybrid storage
- **Sandboxed Code Execution** — Run JavaScript safely in an isolate-backed sandbox via `runStateCode`
- **Git Integration** — Init, add, commit, log, diff, status (all via isomorphic-git)
- **Streaming Chat** — Real-time AI responses with markdown rendering
- **File Browser** — Visual sidebar for browsing, viewing, and managing workspace files
- **Dark/Light Theme** — Toggle between themes with persistence

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser. The dev server uses Cloudflare's remote AI binding (free Workers AI access).

## Deploy

```bash
npm run deploy
```

Requires a Cloudflare account with Workers AI enabled.

## Tools Available to the AI

| Tool | Description |
|------|-------------|
| `readFile` | Read file contents |
| `writeFile` | Create/update files (auto-creates parent dirs) |
| `listDirectory` | List files and directories |
| `deleteFile` | Delete files or empty directories |
| `mkdir` | Create directories recursively |
| `glob` | Find files by pattern (e.g. `**/*.ts`) |
| `runStateCode` | Execute JS in sandboxed isolate for multi-file ops |
| `gitInit` | Initialize a git repository |
| `gitStatus` | Show working tree status |
| `gitAdd` | Stage files for commit |
| `gitCommit` | Create a commit |
| `gitLog` | Show commit history |
| `gitDiff` | Show changes since last commit |

## Built With

- [@cloudflare/think](https://www.npmjs.com/package/@cloudflare/think) — Think<Env> agent base class with session persistence and lifecycle hooks
- [@cloudflare/ai-chat](https://www.npmjs.com/package/@cloudflare/ai-chat) — React chat hooks (useAgentChat)
- [@cloudflare/shell](https://www.npmjs.com/package/@cloudflare/shell) — Persistent virtual filesystem (SQLite + R2)
- [@cloudflare/codemode](https://www.npmjs.com/package/@cloudflare/codemode) — Sandboxed code execution in isolates
- [@cloudflare/kumo](https://www.npmjs.com/package/@cloudflare/kumo) — UI component library
- [workers-ai-provider](https://www.npmjs.com/package/workers-ai-provider) — AI SDK provider for Workers AI
- [agents](https://www.npmjs.com/package/agents) — Cloudflare Agents SDK

## License

MIT
