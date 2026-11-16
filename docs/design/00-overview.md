# 00 — Architecture

## Modules and dependencies
One TypeScript ES module Node.js service uses better-sqlite3, @modelcontextprotocol/sdk and zod. Tests use vitest. Server imports between modules use their index.ts exports and .js extensions.

| Module | Responsibility | Design |
|---|---|---|
| storage | SQLite schema and persistence | 01-storage.md |
| memory | Read all current facts | 02-memory.md |
| core | Room and fact validation and mutations | 03-core.md |
| session | Immutable MCP session room binding | 04-identity.md |
| mcp | Stateful transport and six tools | 05-mcp-tools.md |
| runtime | Configuration, HTTP routing, lifecycle | 06-runtime.md |
| web-api | User JSON API | 07-web-api.md |
| frontend | User room and fact management | 08-frontend.md |

core and memory depend on storage. session depends on core for room existence. mcp depends on session, core and memory. web-api depends on core and memory. runtime assembles all modules. frontend calls only web-api. No dependency cycles.

## Shared contracts
Room = { roomId: number, name: string, task: string, createdAt: string }.
Fact = { factId: number, roomId: number, type: 'fact', content: string, createdAt: string, updatedAt: string }.
All ids are positive safe integers. Timestamps are UTC ISO 8601. Text is trimmed before storage. Errors exposed to agents are English. All database operations are synchronous; check-and-write sequences contain no await. No agent identity is collected.

## Layout
src/{storage,memory,core,session,mcp,web-api}/index.ts expose module interfaces. src/config.ts, server.ts, app.ts and main.ts implement runtime. public/{index.html,app.js,style.css} implement frontend. test/ mirrors server modules.
