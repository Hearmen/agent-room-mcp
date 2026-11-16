# 05 — MCP

## Transport
Stateful Streamable HTTP at /mcp, using SDK session ids generated with crypto.randomUUID. Each initialized session owns its McpServer, transport and SessionBinding. Runtime routes POST, GET and DELETE to this handler; protocol validation and method responses follow the SDK transport. Unknown session ids return HTTP 404. Requests without a session id must be valid initialization requests; other requests return HTTP 400. Existing sessions are resolved from Mcp-Session-Id, never from tool arguments. Session termination removes and closes its resources. No server-initiated application notifications are required.

## Tools
| Tool | Input | Result |
|---|---|---|
| list_rooms | {} | { rooms: Room[] } |
| select_room | { roomId } | { room: Room } |
| get_facts | {} | { facts: Fact[] } |
| add_fact | { content } | { fact: Fact } |
| update_fact | { factId, content } | { fact: Fact } |
| delete_fact | { factId } | { ok: true } |

Schemas are strict zod objects; ids are positive safe integers and content is a non-empty trimmed string. list_rooms is available before and after selection and does not expose facts. select_room uses session.selectRoom. Every fact tool first calls session.requireBoundRoom and passes only the resulting roomId into core or memory. There are no MCP room creation or deletion tools.

Each tool description explains its operation. select_room explains immutable selection and requires matching the task description. The add_fact and update_fact descriptions require discoveries that advance the task or establish constraints or boundaries; exclude irrelevant or trivial facts and preserve useful evidence. update_fact and delete_fact explain that they can affect any fact in the bound room. delete_fact instructs agents to remove incorrect, obsolete, irrelevant or trivial facts. get_facts returns all facts.

Success is a single text item containing JSON.stringify(result). CoreError and SessionError become isError results with their messages. Unexpected errors return 'internal error' and are logged only server-side. Schema errors are handled by the SDK.

## Interfaces and lifecycle
createMcpHandler({ db }) returns { handle(req,res): Promise<void>, close(): Promise<void> }. close terminates every session and transport. verifyMcpServer(url, timeoutMs = 5000) initializes an SDK client, lists tools, checks exactly the six names above, and terminates its session and closes the client under the Self-check deadline rules below. It creates no room or fact. Failure includes the URL and cause.

Verify via SDK HTTP integration tests: initialization, exact tools, independent sessions, unbound errors, CRUD, cross-room rejection, deleted bound room, session termination and cleanup.

## Session request handling
Initialization allocates a new server, transport and unbound binding, connects the server, then delegates the request to the transport. Register the session in the session map when the transport supplies its generated session id. If initialization fails, close the newly allocated resources and remove any map entry. For requests with a session id, delegate to that existing transport; do not construct a replacement server. Concurrent initialization requests always allocate independent bindings.

A GET stream disconnect does not remove the session. DELETE termination and transport closure remove it exactly once. No idle expiry is required in the initial implementation. A transport failure that makes a session unusable removes its entry. On shutdown reject new requests with 503, close every registered session, then release the handler. Unknown and terminated session ids receive the same 404 behavior. Protocol errors use JSON-RPC error bodies as required by the transport; tool failures remain MCP tool results.

## Exact tool descriptions
| Tool | Description |
|---|---|
| list_rooms | List rooms and their task descriptions. Choose the room matching your current task. This does not select a room or read its facts. |
| select_room | Bind this MCP session to the room matching your task. You can select only one room per session and cannot switch rooms. Keep using this session for your task. |
| get_facts | Read every current fact in the selected room, including full content and timestamps. Select a room first. |
| add_fact | Share a discovery that advances the selected task or establishes a constraint or boundary. Include useful evidence. Do not submit irrelevant, trivial or routine progress notes; read existing facts to avoid duplicates. |
| update_fact | Correct or improve any fact in the selected room. Preserve useful evidence and keep the content relevant to a breakthrough or task constraint. Supply the complete replacement content. |
| delete_fact | Permanently delete an incorrect, obsolete, irrelevant or trivial fact in the selected room. This can delete any fact in that room. |

## Self-check deadline
The timeout covers initialization and tool listing. Abort outstanding requests when it expires. Always attempt session termination and client closure in finally; cleanup has its own bounded one-second deadline so an unreachable server cannot block startup indefinitely. Missing or extra tools fail the check. Neither selection nor fact access is needed.
