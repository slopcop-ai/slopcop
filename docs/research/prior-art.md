# Prior Art: Typed and Structured Prompt Engineering

## Abstract

This document surveys existing approaches to structured, typed, or otherwise maintainable LLM prompt engineering. Each system is evaluated against the six problem categories identified in [problem-taxonomy.md](./problem-taxonomy.md). The survey reveals that no existing tool addresses all six — creating the design space for `slopcop`.

---

## 1. Priompt (Anysphere)

**Repository:** [github.com/anysphere/priompt](https://github.com/anysphere/priompt)

**Approach:** JSX/TSX components for prompt construction with priority-based truncation. Prompts are React-like component trees where each subtree has a numeric priority. A rendering engine performs binary search to find the optimal priority cutoff that fits a given token budget.

**Key primitives:**
- `<scope p={N}>` — sets absolute priority for children
- `<first>` — includes the first child that fits the budget (fallback chain)
- `<empty tokens={N}>` — reserves space for model generation
- `<isolate>` — creates independent token sub-budgets
- `<ZTools>` — generates function-calling schemas from Zod definitions

**Strengths:**
- Composable prompt fragments with clear ownership boundaries
- Token budget management is a first-class concern
- `<ZTools>` bridges Zod schemas to function-calling format

**Gaps relative to our problem space:**
- No compile-time validation that prompts reference correct tool names
- No mechanism to prevent enum description drift
- Priority system optimizes for *what fits*, not *what's correct*
- JSX rendering is runtime — errors surface at execution, not compilation
- React dependency

---

## 2. mdx-prompt (Ed Spencer)

**Repository:** [github.com/edspencer/mdx-prompt](https://github.com/edspencer/mdx-prompt)

**Approach:** Write prompts as MDX files (Markdown + JSX). Server-side React rendering converts components to plain strings for LLM consumption. Provides semantic components: `<Purpose>`, `<Instructions>`, `<Examples>`, `<OutputFormat>`, `<Variables>`.

**Strengths:**
- Familiar React/MDX authoring model
- Separation of prompt structure from data via props
- Components are reusable across prompts
- MDX files are readable as documentation

**Gaps:**
- No compile-time schema validation — props are typed but not validated against schemas
- No mechanism for referencing tool names or enum values safely
- No auto-derivation of descriptions from schema definitions
- React/Next.js runtime dependency

---

## 3. POML (Prompt Orchestration Markup Language)

**Paper:** [arXiv:2508.13948](https://arxiv.org/abs/2508.13948)

**Approach:** HTML-like markup language with three component categories: structural (`<role>`, `<task>`), data (`<document>`, `<table>`), and presentation (CSS-like styling). Includes LSP integration for real-time validation, `<include>` for modular composition, and a templating engine with `{{variable}}` syntax.

**Key contribution:** Separation of content, presentation, and data. A CSS-like styling system allows changing output format (Markdown, XML, JSON) without modifying prompt logic. The TableQA study showed up to 9x accuracy improvement through styling alone.

**Strengths:**
- Content/presentation separation reduces accidental format drift
- LSP provides real-time structural validation
- `<include>` enables modular prompt libraries
- Language-independent (not tied to a host programming language)

**Gaps:**
- No formal type system — validation is structural/semantic, not type-theoretic
- No integration with code-level schemas (Zod, JSON Schema)
- No compile-time checking of placeholder references
- No referential integrity for identifiers
- Operates at the prompt level, not the code level

---

## 4. TypeChat (Microsoft)

**Repository:** [github.com/microsoft/TypeChat](https://github.com/microsoft/TypeChat)

**Approach:** Schema-driven LLM output validation. Define a TypeScript interface for the expected response, pass it to the LLM as part of the prompt, and validate the response against the schema. If validation fails, send the error back to the LLM for repair.

**Strengths:**
- Tight coupling between TypeScript types and LLM output expectations
- Repair loop handles schema violations gracefully
- Works with any LLM API

**Gaps:**
- Validates LLM *output*, not prompt *construction* — this is the critical distinction
- Does not address how prompts reference tools, enums, or field names
- No prompt composition or templating system
- No mechanism for auto-deriving descriptions from schemas

---

## 5. ts-prompt (SchoolAI)

**Repository:** [github.com/SchoolAI/ts-prompt](https://github.com/SchoolAI/ts-prompt)

**Approach:** Typesafe prompt construction with Zod-parsed results. Defines prompts with typed input variables and uses Zod schemas to validate LLM responses.

**Strengths:**
- Zod-based response validation
- Typed prompt variables

**Gaps:**
- Focuses on output parsing, not prompt authoring safety
- No compile-time template placeholder validation
- No referential integrity mechanisms

---

## 6. llm-exe

**Article:** [Medium: Create Typed, Modular Prompt Templates](https://medium.com/llm-exe/llm-exe-prompt-create-typed-modular-prompt-templates-in-typescript-3d9d40dc923d)

**Approach:** Handlebars-based prompt templates with typed interfaces. Prompts are declared as typed Handlebars templates with compile-time-checked input variables.

**Strengths:**
- Typed template variables
- Modular prompt composition via Handlebars partials
- Familiar templating syntax

**Gaps:**
- Handlebars is a runtime template engine — no compile-time placeholder validation
- No schema-level integration (Zod, JSON Schema)
- No tool name or identifier referential integrity

---

## 7. PromptL

**Website:** [promptl.ai](https://promptl.ai/)

**Approach:** A domain-specific templating language for LLM prompts with variables, control flow, and multi-modal content support.

**Strengths:**
- Language-level support for prompt-specific constructs
- Variables and conditionals are first-class

**Gaps:**
- Separate language with its own parser — not integrated into TypeScript's type system
- No compile-time validation against code-level schemas
- No referential integrity mechanisms

---

## 8. MCP Specification (Model Context Protocol)

**Specification:** [modelcontextprotocol.io/specification/2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)

**Approach:** Protocol-level definitions for tools, prompts, and resources. Tools have required `inputSchema` (JSON Schema). See [mcp-analysis.md](./mcp-analysis.md) for detailed analysis.

**Relevance:** MCP defines the *wire format* for tool/prompt metadata but provides no authoring-time type safety. The `slopcop/mcp` adapter bridges this gap.

---

## 9. AgentSkills Specification

**Website:** [agentskills.io](https://agentskills.io)

**Approach:** Directory-based skill format with YAML frontmatter metadata and Markdown body. Progressive disclosure: discovery loads only name + description (~100 tokens), activation loads full SKILL.md (~5000 tokens), execution loads scripts on demand.

**Strengths:**
- Progressive disclosure optimizes token usage
- Directory convention enables tooling
- Markdown body is human-readable

**Gaps:**
- Metadata is untyped YAML (free-form key-value)
- `allowed-tools` field is experimental and space-delimited (no schema)
- No type-level integration with tool definitions
- No compile-time validation

---

## Comparative Matrix

| Capability | Priompt | mdx-prompt | POML | TypeChat | ts-prompt | llm-exe | PromptL | MCP | AgentSkills | **slopcop** |
|---|---|---|---|---|---|---|---|---|---|---|
| Compile-time tool name refs | - | - | - | - | - | - | - | - | - | Yes |
| Auto-derived enum descriptions | - | - | - | - | - | - | - | - | - | Yes |
| Template placeholder validation | - | - | - | - | - | - | - | - | - | Yes |
| Schema-bound narratives | - | - | - | - | - | - | - | - | - | Yes |
| Typed lookup tables | - | - | - | - | - | - | - | - | - | Yes |
| Auto-composed tool descriptions | - | - | - | - | - | - | - | - | - | Yes |
| Priority-based truncation | Yes | - | - | - | - | - | - | - | - | - |
| Content/presentation separation | - | Partial | Yes | - | - | - | - | - | - | - |
| Output validation | - | - | - | Yes | Yes | - | - | - | - | - |
| Zero deps beyond Zod | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Yes |

The table shows that `slopcop` occupies a unique niche: **prompt authoring correctness at compile time**. Existing tools address composition (Priompt), presentation (POML), output validation (TypeChat), or discovery (AgentSkills) — but none catch stale tool references, drifted descriptions, or broken lookup tables before the prompt is ever sent to an LLM.
