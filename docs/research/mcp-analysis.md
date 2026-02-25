# MCP Specification Analysis: Type Safety Gaps

**Specification version:** 2025-11-25
**Source:** [modelcontextprotocol.io/specification/2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)

---

## Overview

The Model Context Protocol defines a JSON-RPC 2.0 based protocol for communication between LLM hosts (clients) and capability providers (servers). It specifies three core primitive types: **Tools**, **Prompts**, and **Resources**. This analysis examines where the specification's type safety mechanisms are strong, where they have gaps, and where `strongly-skilled` can bridge those gaps.

---

## Tool Definition Schema

Tools are the most tightly typed MCP primitive:

```typescript
interface Tool {
  name: string;          // 1-128 chars, [A-Za-z0-9_.-], case-sensitive
  title?: string;        // Human-readable display name
  description: string;   // Free-form prose
  inputSchema: object;   // REQUIRED — valid JSON Schema (defaults to 2020-12)
  outputSchema?: object; // Optional — JSON Schema for structured results
  annotations?: {
    audience?: string[];
    priority?: number;
    lastModified?: string;
  };
  _meta?: Record<string, unknown>;
}
```

**Strengths:**
- `inputSchema` is mandatory — every tool must declare its parameter types
- JSON Schema 2020-12 provides rich type expressiveness (oneOf, allOf, $ref)
- `outputSchema` enables structured result validation

**Gaps:**
- `name` is constrained syntactically but not semantically — no registry ensures uniqueness across servers
- `description` is free-form prose with no relationship to `inputSchema` — the description can say anything regardless of what the schema actually accepts
- No mechanism to derive `description` from `inputSchema` field descriptions
- Clients SHOULD validate inputs against `inputSchema` (not MUST) — validation is optional

---

## Prompt Definition Schema

Prompts are the least typed MCP primitive:

```typescript
interface Prompt {
  name: string;
  title?: string;
  description?: string;
  arguments?: PromptArgument[];
  _meta?: Record<string, unknown>;
}

interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
  // NOTE: No type, no schema, no validation
}
```

**Critical gap:** Prompt arguments have **no type information**. Compare:

| Aspect | Tool Parameter | Prompt Argument |
|--------|---------------|-----------------|
| Type declaration | JSON Schema (required) | None |
| Validation | Client SHOULD validate | No mechanism |
| Default values | Via JSON Schema `default` | Not supported |
| Nested structure | Full JSON Schema support | Flat name/description only |
| Enum constraints | `enum` in JSON Schema | Must be described in prose |

This asymmetry means a prompt argument described as "The confidence level (high, medium, low)" has no machine-readable constraint — the LLM client must parse the prose description to understand valid values.

**Implication for strongly-skilled:** The `strongly-skilled/mcp` adapter can export prompt definitions with arguments derived from Zod schemas, but the MCP protocol cannot carry the type information. The adapter should include the Zod-derived type description in the argument's `description` field as a workaround.

---

## Metadata Conventions

MCP uses `_meta` for extensible metadata with namespace conventions:

```
Reserved prefixes:
  io.modelcontextprotocol/
  dev.mcp/
  org.modelcontextprotocol.api/

Custom prefixes use reverse DNS:
  com.example/
  org.mycompany/
```

**Gap:** There is no registry, no schema for metadata keys, and no validation. Two MCP servers can define `com.example/priority` with incompatible semantics. The `_meta` mechanism is intentionally open-ended but provides no tooling for consistency.

---

## JSON Schema Dialect Support

MCP specifies:
- Default dialect: JSON Schema 2020-12
- Both parties MUST support 2020-12
- Explicit dialect can be specified via `$schema`
- Parties MUST handle unsupported dialects gracefully

**Gap:** "Handle gracefully" is underspecified. A client encountering an unsupported dialect might ignore schema validation entirely, silently accept invalid inputs, or reject the tool. The specification does not mandate a specific fallback behavior.

---

## Where strongly-skilled Bridges the Gap

| MCP Gap | strongly-skilled Solution |
|---------|--------------------------|
| Tool `description` disconnected from `inputSchema` | `defineTool` auto-composes descriptions from Zod field `.describe()` annotations |
| Prompt arguments lack type information | `toMcpPrompt` derives argument descriptions from Zod schemas, embedding type info in the `description` field |
| No mechanism to ensure tool name uniqueness | `ToolRegistry` enforces compile-time uniqueness via TypeScript's type accumulation |
| No relationship between tool names in prompts and tool definitions | `defineSystemPrompt` provides a type-safe `tool()` helper that constrains references to registered tools |
| `_meta` is unstructured | `strongly-skilled` schemas can export metadata as typed records, though this is a convention rather than protocol enforcement |

---

## Adapter Design Implications

The `strongly-skilled/mcp` adapter should:

1. **Convert Zod schemas to JSON Schema 2020-12** via `zod-to-json-schema` for tool `inputSchema`
2. **Embed composed descriptions** that include per-field documentation
3. **Generate typed prompt arguments** from Zod variable schemas, encoding type constraints in the argument `description` since the protocol has no `schema` field
4. **Preserve `.describe()` annotations** through the Zod → JSON Schema conversion (verified: `zod-to-json-schema` does preserve `description` fields)
5. **Support optional `outputSchema`** for tools that define Zod output schemas
