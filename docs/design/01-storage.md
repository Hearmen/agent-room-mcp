# 01 — Storage

## Schema
```sql
CREATE TABLE IF NOT EXISTS rooms (
 room_id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 task TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS facts (
 fact_id INTEGER PRIMARY KEY AUTOINCREMENT,
 room_id INTEGER NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
 content TEXT NOT NULL,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS facts_room_id ON facts(room_id, fact_id);
```
Fact ids are globally allocated and never reused. Every fact lookup, update and delete additionally constrains room_id. The returned object includes the constant type 'fact'; no type column is needed.

## Interface
All operations take db first. Room and Fact shapes are defined in 00-overview.md.
```typescript
createDb(path: string): Database;
createTestDb(): Database;
runInTransaction<T>(db: Database, fn: () => T): T;
insertRoom(db: Database, name: string, task: string): Room;
listRooms(db: Database): Room[];
getRoom(db: Database, roomId: number): Room | null;
deleteRoom(db: Database, roomId: number): boolean;
insertFact(db: Database, roomId: number, content: string): Fact;
listFacts(db: Database, roomId: number): Fact[];
getFact(db: Database, roomId: number, factId: number): Fact | null;
updateFact(db: Database, roomId: number, factId: number, content: string): Fact | null;
deleteFact(db: Database, roomId: number, factId: number): boolean;
```
createDb enables foreign_keys and WAL and executes the schema; createTestDb uses an in-memory database and foreign_keys. Reads are ascending by id. Insert sets both fact timestamps to now; update preserves createdAt and replaces updatedAt. Deletes return whether a row existed. Transactions wrap db.transaction(fn)() and support nesting. SQLite errors remain internal to adapters.

## Verification
Test persistence across reopen, foreign-key cascade, transaction rollback, fact timestamps, ordered reads and isolation of fact mutations by room. Fresh databases only; no existing deployed schema migration is specified.
