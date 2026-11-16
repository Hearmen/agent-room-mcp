# 07 — User JSON API

## Routes
| Method | Path | Input | Success |
|---|---|---|---|
| GET | /api/rooms | none | 200 { rooms: Room[] } |
| POST | /api/rooms | { name, task } | 201 { room: Room } |
| DELETE | /api/rooms/:roomId | none | 200 { ok: true } |
| GET | /api/rooms/:roomId/facts | none | 200 { facts: Fact[] } |
| POST | /api/rooms/:roomId/facts | { content } | 201 { fact: Fact } |
| PATCH | /api/rooms/:roomId/facts/:factId | { content } | 200 { fact: Fact } |
| DELETE | /api/rooms/:roomId/facts/:factId | none | 200 { ok: true } |

createWebApiHandler({ db }) returns an async handle(req,res) function. Parse route ids as positive safe integers. JSON mutation inputs are strict objects. For POST and PATCH, enforce application/json (allowing a charset parameter) and a 1 MiB request-body limit measured in UTF-8 bytes: unsupported media type returns 415, oversized body returns 413, malformed JSON or invalid fields return 400. Core errors map INVALID_INPUT to 400 and missing resources to 404. Unexpected errors return 500. All error bodies are { error: { code, message } }; internal errors use 'internal error'. Unknown routes return 404, unsupported methods on known routes return 405 with Allow. JSON responses use UTF-8 and Cache-Control: no-store.

Use core for room lists and every mutation; facts reads call core.requireRoom then memory.getFacts. No session binding applies to the user API. Agent permissions are the MCP interface contract rather than authenticated API authorization. Verify CRUD, input failures, resource isolation and response codes.

## Parsing and error contract
GET and DELETE require no Content-Type or request body. Route matching uses the URL pathname without the query string and accepts only the exact paths above; trailing slashes do not alias routes. Invalid numeric ids on an otherwise matching route return INVALID_INPUT/400. Decimal ids must match [1-9][0-9]* and fit Number.isSafeInteger; scientific notation and signed ids are invalid.

Error codes are INVALID_INPUT, ROOM_NOT_FOUND, FACT_NOT_FOUND, NOT_FOUND, METHOD_NOT_ALLOWED, UNSUPPORTED_MEDIA_TYPE, PAYLOAD_TOO_LARGE, FORBIDDEN_ORIGIN and INTERNAL_ERROR. The HTTP statuses are respectively 400, 404, 404, 404, 405, 415, 413, 403 and 500. Parsing and routing errors expose a short English explanation. Stack traces and SQLite messages never appear in responses. Browser origin rejection follows runtime policy before mutation handling.

Every list is a complete snapshot at the time of its synchronous read. API room deletion does not traverse or mutate MCP session bindings; subsequent calls on affected sessions fail through core.requireRoom. No room update route exists: names and task descriptions are fixed for the room lifetime. A user creates a new room for a different task.
