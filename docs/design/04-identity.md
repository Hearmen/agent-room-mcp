# 04 — Session binding

Implemented in src/session/. There are no member identities or author tokens. The binding belongs to an initialized MCP session and is held only in process memory.

```typescript
interface SessionBinding { roomId: number | null }
class SessionError extends Error {}
createBinding(): SessionBinding;
selectRoom(db: Database, binding: SessionBinding, roomId: number): Room;
requireBoundRoom(db: Database, binding: SessionBinding): Room;
```
createBinding returns a new unbound object. selectRoom refuses a different id once bound with 'session is already bound to room <id>'. Otherwise core.requireRoom checks existence, then the first selection stores roomId. Re-selecting the same existing room returns it. requireBoundRoom throws 'select a room first' if unbound, otherwise calls core.requireRoom. Deleted rooms never clear a binding.

The MCP transport creates and owns one binding per initialized session. It releases the binding only when that session ends or the process stops. Request disconnect alone does not end the session. New sessions cannot inherit bindings, and client-provided room ids cannot replace a binding. Test independent sessions, idempotence, switch refusal and deletion behavior.
