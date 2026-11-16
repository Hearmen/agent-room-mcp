# 02 — Memory

Read-only projection of all current facts. Depends only on storage.

```typescript
getFacts(db: Database, roomId: number): Fact[];
```
Delegates to storage.listFacts and returns complete content and metadata, ascending factId. No pagination, summaries, status computation or caching. Callers validate room existence through core.requireRoom first, so an absent room differs from an empty room. Verify empty and ordered populated results and that edits and deletions appear on the next read.
