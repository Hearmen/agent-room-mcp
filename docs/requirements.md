# Agent Room MCP — Requirements

## Purpose
The sole purpose is sharing discoveries relevant to a task. One room represents one task. The service does not orchestrate agents or judge the truth of discoveries.

## Rooms and facts
A room has a server-generated positive integer roomId, a name, a task description and a creation time. Users create and delete rooms through the frontend. Agents may list rooms and select the room matching their task, but cannot create or delete rooms. Deleting a room permanently deletes its facts.

Fact is the only message type. A fact contains non-empty text describing a breakthrough or a task constraint or boundary. Irrelevant information, trivial observations and routine progress must not be submitted. Evidence and reproduction details should be included in the text when useful. Agents assess relevance before submitting; the server validates structure and non-empty content rather than claiming to judge semantic value.

Users and agents can create, read, update and delete any fact in the accessible room. Updates preserve the fact id and creation time and record an update time. Reads return all current facts in ascending id order. No verdicts, challenges, verification modes, membership or author tokens exist.

## Session boundary
A session means one initialized MCP Streamable HTTP session. An agent lists rooms and selects one; all fact operations use that binding without a roomId argument. Selection is immutable for the session, including after room deletion. Selecting the same existing room is idempotent; selecting another room fails. A deleted room produces room-not-found errors and does not permit rebinding.

New MCP sessions, including after process restart, require a new selection. The service cannot enforce an agent's identity or a conversation boundary across independent MCP sessions. Clients must reuse one MCP session for one agent work session.

## Frontend
The frontend lists rooms and their tasks, creates rooms, and confirms room deletion. Within a room it lists all facts and supports adding, editing and confirmed deletion. It refreshes periodically and after mutations, displays errors, and preserves unsaved edits during refresh. Text is rendered as text rather than trusted HTML.

## Operation and scope
One Node.js process serves MCP, JSON API and frontend on one port and persists rooms and facts in SQLite. Default binding is loopback. Concurrent requests are supported. There is no authentication: accessible clients are trusted, and frontend versus agent permissions describe interfaces, not a security boundary against direct HTTP callers. Agents must use only MCP tools.

Startup performs a read-only MCP tool-list check. Shutdown releases sessions, HTTP connections and SQLite. No chat, push subscriptions, waiting tools, historical revisions or automated semantic verification are required.
