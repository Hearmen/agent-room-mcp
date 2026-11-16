# 03 — Core

Owns validation and mutations. Depends only on storage. All functions take db first.

```typescript
class CoreError extends Error { code: 'INVALID_INPUT' | 'ROOM_NOT_FOUND' | 'FACT_NOT_FOUND' }
requireRoom(db: Database, roomId: number): Room;
listRooms(db: Database): Room[];
createRoom(db: Database, input: { name: string; task: string }): Room;
deleteRoom(db: Database, roomId: number): void;
addFact(db: Database, roomId: number, content: string): Fact;
updateFact(db: Database, roomId: number, factId: number, content: string): Fact;
deleteFact(db: Database, roomId: number, factId: number): void;
```
Validate ids as positive safe integers. Validate string input and trim it; reject blank names, tasks or content with INVALID_INPUT. requireRoom throws ROOM_NOT_FOUND with 'room not found: <id>'. Fact operations require the room first; missing room-scoped facts throw FACT_NOT_FOUND with 'fact not found: <id>'. deleteRoom requires existence and cascades facts atomically. Mutations check and write synchronously in a transaction. Updates and deletes are allowed for any fact in the room, regardless of its creator. Concurrent edits use last committed write wins; no revision history or ownership checks.

Semantic relevance is an agent instruction, not an automated core verdict. Verify validation, missing resources, CRUD, cascade and cross-room mutation refusal.
