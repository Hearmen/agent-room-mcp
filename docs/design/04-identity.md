# 04 — Room credentials

Implemented in src/session/. selectRoom(db, roomId) validates the room, generates 32 random bytes encoded as base64url, persists its SHA-256 digest and room id, and returns { room, roomToken }. Each call issues a new independent credential. requireTokenRoom(db, roomToken) hashes the supplied token, resolves its room, and returns the room; unknown tokens throw SessionError('invalid room token'). No raw tokens are persisted or logged. Room deletion cascades credentials. Credentials survive process restarts and have no expiry or individual revocation API. They restrict fact access to one room but do not authenticate an agent, since any client may select any existing room.

One agent work session must use one room credential by client convention. The server cannot enforce the conversation boundary. MCP transport session ids are unrelated to room access. Test credential persistence, cross-client use, invalid credentials, room isolation and cascade deletion.
