# Instructions For Future Codex Agents

This project is a production-oriented camp accommodation manager. Do not mark features complete unless data persists in Supabase and server-side authorization is implemented.

## Rules

- Keep tenant isolation central. Never trust `organization_id` from the browser.
- Prefer server components and server actions for data mutations.
- Add or update RLS policies with every new tenant table.
- Add tests for new business rules.
- Do not store `occupied` or `available` on rooms; calculate it from assignments and capacity.
- Do not weaken security to make tests pass.
- Do not delete migrations to hide errors.
- Report critical TODOs explicitly.

## Verification

After each implementation phase, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

If local dependencies are unavailable, say so clearly and do not claim verification.
