import { createWorkersAI } from "workers-ai-provider";
import { routeAgentRequest, callable } from "agents";
import { Think, type Session } from "@cloudflare/think";
import { createWorkspaceTools } from "@cloudflare/think/tools/workspace";
import { createExecuteTool } from "@cloudflare/think/tools/execute";
import { tool } from "ai";
import { z } from "zod";
import {
  Workspace,
  WorkspaceFileSystem,
  createWorkspaceStateBackend,
  type FileInfo
} from "@cloudflare/shell";
import { createGit, gitTools } from "@cloudflare/shell/git";

/**
 * Think-powered AI Chat Agent with persistent memory, workspace tools,
 * and a sandboxed code execution environment.
 *
 * Extends Think<Env> which provides:
 * - Session-backed message persistence with compaction
 * - Automatic pruning and context assembly
 * - Configurable memory context blocks (LLM-writable)
 * - Lifecycle hooks (onChatResponse, onChatError)
 * - Stream resumption across hibernation
 */
export class WorkspaceChatAgent extends Think<Env> {
  // Preserve namespace "ws" for backward-compatible workspace data
  workspace = new Workspace({
    sql: this.ctx.storage.sql,
    namespace: "ws",
    name: () => this.name
  });

  private _git: ReturnType<typeof createGit> | undefined;
  private git() {
    this._git ??= createGit(new WorkspaceFileSystem(this.workspace));
    return this._git;
  }

  // ── Think overrides ─────────────────────────────────────────────

  getModel() {
    const workersai = createWorkersAI({ binding: this.env.AI });
    return workersai("@cf/moonshotai/kimi-k2.5", {
      sessionAffinity: this.sessionAffinity
    });
  }

  getSystemPrompt() {
    return [
      "You are a helpful coding assistant with access to a persistent virtual filesystem, git, and a sandboxed code execution environment.",
      "",
      "## Workspace tools",
      "You have direct tools for file operations: `read`, `write`, `edit`, `list`, `find` (glob), `grep` (search text), `delete`.",
      "Use `read` to view file contents. Use `write` to create or overwrite files. Use `edit` for surgical line-range replacements.",
      "Use `find` to locate files by glob pattern. Use `grep` to search file contents.",
      "",
      "## Git tools",
      "You have direct tools: `gitInit`, `gitStatus`, `gitAdd`, `gitCommit`, `gitLog`, `gitDiff`.",
      "",
      "## Code execution",
      "For multi-file refactors, coordinated edits, search/replace, or any transactional work, use the `execute` tool.",
      "The sandbox provides `state.*` (full filesystem API: readFile, writeFile, glob, searchFiles, replaceInFiles, planEdits, etc.) and `git.*` (clone, push, pull, fetch, branch, checkout, remote, etc.).",
      "",
      "## Guidelines",
      "There is no bash tool.",
      "When the user asks you to create files or projects, use the tools to actually do it.",
      "When showing file contents, prefer reading them with the `read` tool rather than guessing.",
      "After making changes, briefly summarize what you did.",
      "When you learn something important about the user or their project, save it to memory."
    ].join("\n");
  }

  getTools() {
    // Think's workspace tools: read, write, edit, list, find, grep, delete
    const wsTools = createWorkspaceTools(this.workspace);

    // Sandboxed code execution with state.* and git.* APIs
    const stateBackend = createWorkspaceStateBackend(this.workspace);
    const execute = createExecuteTool({
      state: stateBackend,
      tools: wsTools,
      loader: this.env.LOADER,
      providers: [gitTools(this.workspace)]
    });

    return {
      ...wsTools,
      execute,

      // Git tools (direct, not sandboxed)
      gitInit: tool({
        description: "Initialize a new git repository in the workspace",
        inputSchema: z.object({
          defaultBranch: z
            .string()
            .optional()
            .describe("Default branch name (defaults to main)")
        }),
        execute: async ({ defaultBranch }) => {
          return this.git().init({ defaultBranch });
        }
      }),

      gitStatus: tool({
        description:
          "Show the working tree status: modified, added, deleted, and untracked files",
        inputSchema: z.object({}),
        execute: async () => {
          return this.git().status();
        }
      }),

      gitAdd: tool({
        description:
          'Stage files for commit. Use filepath "." to stage all changes.',
        inputSchema: z.object({
          filepath: z
            .string()
            .describe('File path to stage, or "." for all changes')
        }),
        execute: async ({ filepath }) => {
          return this.git().add({ filepath });
        }
      }),

      gitCommit: tool({
        description: "Create a commit with the staged changes",
        inputSchema: z.object({
          message: z.string().describe("Commit message"),
          authorName: z.string().optional().describe("Author name"),
          authorEmail: z.string().optional().describe("Author email")
        }),
        execute: async ({ message, authorName, authorEmail }) => {
          const author =
            authorName && authorEmail
              ? { name: authorName, email: authorEmail }
              : undefined;
          return this.git().commit({ message, author });
        }
      }),

      gitLog: tool({
        description: "Show commit history",
        inputSchema: z.object({
          depth: z
            .number()
            .optional()
            .describe("Number of commits to show (default 20)")
        }),
        execute: async ({ depth }) => {
          return this.git().log({ depth });
        }
      }),

      gitDiff: tool({
        description: "Show which files have changed since the last commit",
        inputSchema: z.object({}),
        execute: async () => {
          return this.git().diff();
        }
      })
    };
  }

  getMaxSteps() {
    return 10;
  }

  configureSession(session: Session) {
    return session
      .withContext("memory", {
        description:
          "Important facts about the user, their preferences, and project context. Update this when you learn something worth remembering across conversations.",
        maxTokens: 2000
      })
      .withCachedPrompt();
  }

  // Log completed turns for observability
  onChatResponse() {
    console.log(
      `[Think] Turn completed for agent ${this.name}`
    );
  }

  // ── Client RPCs ─────────────────────────────────────────────────

  @callable()
  async listFiles(path: string): Promise<FileInfo[]> {
    return await this.workspace.readDir(path);
  }

  @callable()
  async readFileContent(path: string): Promise<string | null> {
    return await this.workspace.readFile(path);
  }

  @callable()
  async deleteFileAtPath(path: string): Promise<boolean> {
    return await this.workspace.deleteFile(path);
  }

  @callable()
  async getWorkspaceInfo(): Promise<{
    fileCount: number;
    directoryCount: number;
    totalBytes: number;
    r2FileCount: number;
  }> {
    return this.workspace.getWorkspaceInfo();
  }
}

export default {
  async fetch(request: Request, env: Env) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
