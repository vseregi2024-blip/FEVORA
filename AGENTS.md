<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project continuity protocol

- Before any project action, read `00_READ_FIRST_CODEX_CONTINUITY.md` completely.
- Before editing, run read-only `git status --short --untracked-files=all`; never discard or overwrite the existing dirty worktree.
- After every completed or interrupted material task, update the continuity file first with verified changes, tests, migrations, backups, deployments, production-data checks, current STOP point, and next safe step.
- Never place real secrets, passwords, tokens, DSNs, authorization headers, or private keys in the continuity file, reports, source code, commits, logs, or frontend.
- Never send a real production Beauty Bonus Club payment or enable `BOT_CLIENT_PAYMENTS_ENABLED` without explicit owner authorization for that operation.
