# Project: strongly-skilled

## Runtime

This project uses **Bun** exclusively. Never use `npm`, `npx`, `yarn`, or `pnpm`.

- Package management: `bun install`, `bun add`, `bun remove`
- Script execution: `bun run <script>`
- Binary execution: `bunx <binary>` (not `npx`)

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

## Documentation Style

When writing or updating documentation (README, docs/, etc.):

- **Never duplicate machine-readable details as prose.** If something is defined in a config file (`package.json` scripts, `tsconfig.json` options, `biome.json` rules), reference the file rather than restating its contents. Prefer `see package.json scripts` or `` `bun run` to list available scripts `` over enumerating commands that will drift.
- **Do document what config files can't express:** the *why* behind decisions, the mental model for the architecture, which entry points to start reading, and non-obvious interactions between components.
- **For contributor onboarding**, assume the reader can run `bun run` and read the output. Don't list every script — instead, mention the key workflows (`bun run ci` runs the full check suite) and trust discoverability for the rest.
- **Link, don't inline.** When referencing specifics from another file, link to the file path rather than copying content. Example: "See [`docs/design/architecture.md`](./docs/design/architecture.md) for the type-level machinery" rather than re-explaining `ExtractPlaceholders` in the README.
- **Executable over descriptive.** Prefer a command the reader can run (`bun run ci`) over a description of what that command does. If the command's name isn't self-explanatory, that's a naming problem to fix in `package.json`, not a documentation problem to solve with prose.
