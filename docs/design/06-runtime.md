# 06 — Runtime

## Configuration and package
TypeScript ES modules on Node.js 22 or newer; module and moduleResolution are NodeNext. Package name and bin command are agent-room-mcp, bin points to dist/main.js with a node shebang. Scripts: build = tsc, start = tsx src/main.ts, test = vitest run. Dependencies: @modelcontextprotocol/sdk, better-sqlite3, zod; development dependencies include TypeScript, tsx, vitest and relevant Node/SQLite types. Pin compatible versions during implementation.

loadConfig(argv, env) returns { host, port, dbPath }. Defaults: 127.0.0.1, 4100, ./agent-room.db. Flags --host, --port, --db override AGENT_ROOM_HOST, AGENT_ROOM_PORT, AGENT_ROOM_DB respectively. Resolve dbPath against cwd. Port is an integer 0..65535. Unknown flags, missing values or invalid ports throw descriptive errors. --help/-h prints usage and exits without opening resources.

## HTTP routing
server dispatches /mcp to MCP, /api and /api/* to web-api, and GET/HEAD static paths to public/. Unknown static paths return 404; traversal outside public is rejected. Responses use appropriate MIME types. API and MCP failures must not fall through to static content. No permissive cross-origin API access is enabled; reject browser mutation requests with a supplied foreign Origin. Loopback is the default and accessible clients are trusted.

## Lifecycle
startApp(config): Promise<{ url: string; close(): Promise<void> }> opens SQLite, assembles adapters, listens and runs verifyMcpServer at <url>/mcp. Port 0 uses the actual listening port. Wildcard hosts use a reachable loopback address for the self-check; IPv6 URLs use brackets. Any startup failure closes resources already opened. close is idempotent: terminate MCP sessions, close HTTP connections and server, then close SQLite.

main prints the listening URL and absolute database path. SIGINT/SIGTERM trigger close and a successful exit; startup failure prints a clear error and exits 1. Serve static assets relative to the installed package, independent of cwd. Bind outside loopback only on a trusted network; no user authentication is provided.

## Verification
Test config precedence and invalid arguments, HTTP routing, startup with port 0, failed startup cleanup and idempotent shutdown. Build and run the SDK integration tests. Agents connect using http://127.0.0.1:4100/mcp and reuse one initialized MCP session for the task.

## Assembly interfaces
```typescript
interface Config { host: string; port: number; dbPath: string }
interface HttpHandler {
 handle(req: IncomingMessage, res: ServerResponse): Promise<void>;
}
loadConfig(argv: string[], env: NodeJS.ProcessEnv): Config;
startHttpServer(input: {
 host: string; port: number; publicDir: string;
 mcp: HttpHandler; webApi: HttpHandler;
}): Promise<Server>;
```
The web-api factory returns its function; assembly wraps it as { handle } for the router. startHttpServer resolves only after listening and rejects listen errors. app owns the database and adapter lifetimes; server owns request routing and listening connections. Database parents must already exist; open failures are reported rather than silently creating directory trees.

Serve only /, /index.html, /app.js and /style.css from the packaged public directory. / maps to index.html. Static responses use text/html, text/javascript and text/css with UTF-8; HEAD returns the same headers without a body. Other methods return 405 with Allow: GET, HEAD. Missing files return 404. No directory listing or SPA fallback is provided. Package publishing must include dist/ and public/.

For browser requests carrying Origin, compare the parsed origin against the request URL origin derived from the direct Host header and HTTP protocol; do not trust forwarded headers. Reject foreign or null origins on MCP requests and API mutations with 403. Requests without Origin are accepted for native clients. This is a browser origin check, not authentication.

Shutdown starts by stopping new HTTP work, closes MCP sessions, forcibly releases remaining HTTP connections, awaits server closure, then closes SQLite. Cleanup attempts all resources even if one close fails. Repeated close calls share the same promise. Signals received during shutdown do not start another close. Startup self-check uses 127.0.0.1 for 0.0.0.0 and [::1] for ::.
