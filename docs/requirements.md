# Agent Room MCP — Requirements

## Purpose
The sole purpose is sharing discoveries relevant to a task. One room represents one task. The service does not orchestrate agents or judge the truth of discoveries.

## Rooms and facts
A room has a server-generated positive integer roomId, a name, a task description and a creation time. Users create and delete rooms through the frontend. Agents may list rooms and select the room matching their task, but cannot create or delete rooms. Deleting a room permanently deletes its facts.

Fact is the only message type. A fact contains non-empty text describing a breakthrough or a task constraint or boundary. Irrelevant information, trivial observations and routine progress must not be submitted. Evidence and reproduction details should be included in the text when useful. Agents assess relevance before submitting; the server validates structure and non-empty content rather than claiming to judge semantic value.

Users and agents can create, read, update and delete any fact in the accessible room. Updates preserve the fact id and creation time and record an update time. Reads return all current facts in ascending id order. No verdicts, challenges, verification modes, membership or author tokens exist.

## Room credential boundary
select_room returns a persistent roomToken. All fact calls explicitly supply it. One agent work session uses one token by convention; MCP transport sessions do not restrict rooms.

## Frontend
The frontend lists rooms and their tasks, creates rooms, and confirms room deletion. Within a room it lists all facts and supports adding, editing and confirmed deletion. It refreshes periodically and after mutations, displays errors, and preserves unsaved edits during refresh. Text is rendered as text rather than trusted HTML.

## Operation and scope
One Node.js process serves MCP, JSON API and frontend on one port and persists rooms and facts in SQLite. Default binding is loopback. Concurrent requests are supported. There is no authentication: accessible clients are trusted, and frontend versus agent permissions describe interfaces, not a security boundary against direct HTTP callers. Agents must use only MCP tools.

Startup performs a read-only MCP tool-list check. Shutdown releases sessions, HTTP connections and SQLite. No chat, push subscriptions, waiting tools, historical revisions or automated semantic verification are required.
