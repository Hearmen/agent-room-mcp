# Agent Room MCP — project rules

- All documentation lives in `docs/`.
- Every action must be based on documentation: the documented basis comes first, implementation or modification second.
- Every change to a document must be reviewed by the user; nothing is written to a document file before the user confirms.
- Documents must be complete and self-contained. They carry no revision history and no "based on version X" wording.

## Design rules

- Design documents must be detailed. Every module has its own design document, and every interaction between modules has a documented interface.
- When design documents are first created they must be checked by a sub-agent. Later checks are done when the user asks for them.

## Coding rules

- All code is based on the design documents: write the detailed design first, then the code.
- A task that changes code must first change the corresponding document; the code is written only after the user has reviewed that change.
