# Project: strongly-skilled

## Runtime

This project uses **Bun** exclusively. Never use `npm`, `npx`, `yarn`, or `pnpm`.

- Package management: `bun install`, `bun add`, `bun remove`
- Script execution: `bun run <script>`
- Binary execution: `bunx <binary>` (not `npx`)
- Testing: `bun test`
- Type checking: `bun run check`
- Linting: `bun run lint`
- Formatting: `bun run format`

## Tooling

- **TypeScript** — strict mode with `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`
- **Biome** — linting and formatting (tabs, double quotes, trailing commas, semicolons)
- **Lefthook** — git hooks (pre-commit: typecheck + lint)
- **No ESLint, no Prettier** — Biome handles both

## Architecture

Zod-first library for type-safe LLM prompt engineering. See `docs/design/architecture.md`.

- Core: `src/core/` — zero dependencies beyond `zod`
- MCP adapter: `src/mcp/` — optional, requires `zod-to-json-schema`
- Exports: `strongly-skilled` (core) and `strongly-skilled/mcp` (adapter)
