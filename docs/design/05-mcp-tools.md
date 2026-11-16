# 05 — MCP

## Transport
Streamable HTTP at /mcp. Each request gets a new McpServer and transport with sessionIdGenerator undefined and JSON responses enabled. No application state is stored in a transport session. Connect, delegate handling, then close resources when the response closes. GET and DELETE return 405; POST without initialization history is supported by the SDK stateless transport. Failed handling returns 500 before headers, otherwise destroys the response. close() rejects new work and closes all active request servers.

## Tools
All schemas are strict. Ids are positive safe integers, content and roomToken are non-empty trimmed strings.

| Tool | Input | Result |
|---|---|---|
| list_rooms | {} | { rooms: Room[] } |
| select_room | { roomId } | { room: Room, roomToken: string } |
| get_facts | { roomToken } | { facts: AgentFact[] } |
| add_fact | { roomToken, content } | { fact: AgentFact } |
| update_fact | { roomToken, factId, content } | { fact: AgentFact } |
| delete_fact | { roomToken, factId } | { ok: true } |

AgentFact contains only factId, roomId, type and content. Every fact operation resolves roomToken through requireTokenRoom; no operation accepts a roomId override. Tokens survive reconnects and server restarts. One agent work session uses one token by convention, not server-enforced identity. select_room may issue new tokens for any existing room. There are no MCP room mutation tools.

Descriptions instruct agents to choose the task-matching room, retain its roomToken, and reuse it throughout the work session. get_facts reads all current facts. add_fact and update_fact require breakthroughs or task constraints, useful evidence and avoidance of trivial, irrelevant or duplicate information. Updates replace full content. delete_fact permanently removes incorrect, obsolete or irrelevant facts.

Success is one text item holding JSON.stringify(result). CoreError and SessionError become isError results with their messages; unexpected errors return internal error and are logged server-side. SDK handles schema validation.

createMcpHandler({db}) returns { handle(req,res), close() }. verifyMcpServer(url, timeoutMs=5000) connects an SDK client, lists exactly these six tools and closes the client. It creates no rooms or credentials. Main check deadline is timeoutMs and cleanup has an additional one-second bound. Error includes URL and cause. Integration tests verify all tools, invalid tokens, cross-room rejection and using tokens from new clients.
