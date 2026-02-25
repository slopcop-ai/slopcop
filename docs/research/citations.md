# Citations

Complete bibliography of works referenced in the research and design of `slopcop`.

---

## Libraries and Frameworks

- **Priompt** — Anysphere. JSX-based prompt design with priority truncation.
  https://github.com/anysphere/priompt

- **mdx-prompt** — Ed Spencer. Composable LLM prompts powered by MDX and React.
  https://github.com/edspencer/mdx-prompt
  https://edspencer.net/2025/2/3/mdx-prompt-composable-prompts-with-jsx

- **TypeChat** — Microsoft. Schema-driven LLM output validation with repair loops.
  https://github.com/microsoft/TypeChat

- **ts-prompt** — SchoolAI. Typesafe prompt construction with Zod-parsed results.
  https://github.com/SchoolAI/ts-prompt

- **llm-exe** — Typed, modular prompt templates in TypeScript (Handlebars-based).
  https://medium.com/llm-exe/llm-exe-prompt-create-typed-modular-prompt-templates-in-typescript-3d9d40dc923d

- **PromptL** — Domain-specific LLM templating language.
  https://promptl.ai/

- **zod-to-json-schema** — Converts Zod schemas to JSON Schema.
  https://github.com/StefanTerdell/zod-to-json-schema

- **Zod** — TypeScript-first schema validation with static type inference.
  https://github.com/colinhacks/zod

---

## Specifications

- **Model Context Protocol (MCP)** — Specification version 2025-11-25.
  https://modelcontextprotocol.io/specification/2025-11-25

- **AgentSkills** — Open format for defining reusable AI agent skills.
  https://agentskills.io

- **JSON Schema** — Draft 2020-12 specification.
  https://json-schema.org/specification

---

## Papers

- **POML: Prompt Orchestration Markup Language** — Component-based markup with CSS-like styling for LLM prompts.
  arXiv:2508.13948. https://arxiv.org/abs/2508.13948

---

## Articles and Blog Posts

- **Prompt Drift: The Hidden Failure Mode Undermining Agentic Systems** — Comet ML.
  https://www.comet.com/site/blog/prompt-drift/

- **How We Reduced AI Agent Development Time by 70% with Type-Safe Prompt Engineering** — Dev.to.
  https://dev.to/galfrevn/how-we-reduced-ai-agent-development-time-by-70-with-type-safe-prompt-engineering-1i9j

- **Why I Choose TypeScript for LLM-Based Coding** — Thomas Landgraf, Medium.
  https://medium.com/@tl_99311/why-i-choose-typescript-for-llm-based-coding-19cbb19f3fa2

---

## Codebase Evidence

The following file paths in the valara-4 codebase were examined as evidence for the problem taxonomy:

| File | Lines | Problem Category |
|------|-------|-----------------|
| `workflows/appraisal-review/constants.ts` | 27-39 | Tool name constants |
| `workflows/appraisal-review/steps/detect-bias.ts` | 146-160 | Tool name string literals in prompts |
| `workflows/appraisal-review/steps/review-agent.ts` | 290-431 | Multiple tool name references (6+) |
| `workflows/appraisal-review/steps/review-agent.ts` | 207-224 | Narrative templates with unvalidated placeholders |
| `workflows/appraisal-review/steps/review-agent.ts` | 137-180 | Score definitions referenced from multiple files |
| `workflows/appraisal-review/schemas/basic-info-extraction.ts` | 113-136 | Enum descriptions drifting from values |
| `workflows/appraisal-review/schemas/basic-info-extraction.ts` | 144-169 | Complex enum descriptions as string literals |
| `workflows/appraisal-review/schemas/review.ts` | 91-120 | Confidence factors schema |
| `workflows/appraisal-review/steps/detect-flagged-terms.ts` | 142-366 | 136-entry lookup table with untyped rule IDs |
| `workflows/appraisal-review/schemas/enrich.ts` | 31-89 | State code mapping with hardcoded prefixes |
| `lib/appraisal/score-definitions.ts` | 112-117 | Duplicate confidence factor descriptions |
| `lib/appraisal/extraction-cards-config.ts` | 114-134 | Enum format mappers with hardcoded transformations |
