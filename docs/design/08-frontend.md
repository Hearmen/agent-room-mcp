# 08 — Frontend

Plain public/index.html, app.js and style.css served by runtime. No framework or build step.

List rooms with name and task, plus creation and confirmed deletion controls. Creation requires a name and task description. Select a room to view its task and all facts in ascending id order. Provide content forms for fact creation and editing, and confirmation before deletion. Display creation/update times and request errors. Include the breakthrough/constraint relevance guidance near the fact form.

Use the routes in 07-web-api.md. Refresh rooms and selected facts every five seconds and after successful mutations. Retain draft text during polling; ignore stale responses after selection changes. Do not overlap polling requests. If the selected room disappears, return to the room list and explain the deletion. On failed edits preserve input; on missing facts refresh and explain the conflict. Disable duplicate submissions while pending. Server edits use last committed write wins.

Use textContent and form values for stored text, accessible labels and keyboard-operable controls. Show loading, empty and error states. Verify room CRUD and fact CRUD manually in the browser, polling after agent writes, deletion during editing and safe display of HTML-like content.

## UI state and request flow
The page has a room list, create-room form, selected-room header, add-fact form and fact list. Each fact shows its id, full content, timestamps and Edit/Delete controls. Editing replaces that item's content display with a textarea and Save/Cancel buttons. No author or verification controls exist.

Keep selectedRoomId, room list, fact list, creation draft, per-fact edit drafts, pending operations and a selection generation counter in browser memory. Selecting another room increments the generation and discards the previous room's drafts only after confirming if they contain unsaved text. A response updates selected facts only when its generation still matches. A poll that began before a successful mutation is ignored; trigger a fresh read after the mutation. Polling never overwrites drafts or submits them automatically.

A room deletion confirmation names the room and warns that all its facts are permanently removed. Fact deletion confirmation names the fact id. Removing a selected room clears its view and drafts after successful deletion. An externally deleted edited fact keeps its draft visible as unsaved text with a dismiss control; it cannot be saved against a missing id. Failed polling retains the last successful view and displays a retryable error. User drafts are not persisted across page reloads.

Use a responsive two-panel layout on wide screens and stacked panels on narrow screens. Announce request errors with an accessible live region and return focus to the triggering control or list after closing an editor. Dates use the browser's local timezone with the original ISO value available in a title attribute.
