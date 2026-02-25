# strongly-skilled

Zod-first TypeScript library for type-safe, maintainable LLM prompt engineering.

Prompts reference code — tool names, schema fields, enum values, business rules. Those references are almost always string literals. When code changes, the strings go stale silently. `strongly-skilled` makes TypeScript's compiler catch these errors before any LLM call is made.

## Install

```bash
npm install strongly-skilled zod
```

## Quick Example

```typescript
import { z } from "zod";
import {
  describedEnum,
  defineTool,
  defineSchemaPrompt,
  defineSystemPrompt,
  defineLookup,
  createRegistry,
} from "strongly-skilled";

// 1. Self-documenting enum — description auto-composed from variants
const Severity = describedEnum({
  high: "Critical issue requiring immediate attention",
  medium: "Notable issue that should be addressed",
  low: "Minor observation for consideration",
});

// 2. Tool with auto-composed description from field annotations
const reportFinding = defineTool({
  name: "report_finding",
  description: "Reports an analysis finding.",
  inputSchema: z.object({
    title: z.string().describe("Short summary of the finding"),
    severity: Severity,
    explanation: z.string().describe("Detailed explanation with evidence"),
  }),
});

// 3. Registry provides compile-time tool name checking
const registry = createRegistry().register(reportFinding);

// 4. System prompt with type-safe tool references
const systemPrompt = defineSystemPrompt(registry, ({ tool }) => `
You are an analysis assistant.
When you identify an issue, call ${tool("report_finding")}.
`);
// tool("nonexistent") → compile error

// 5. Schema-bound narrative with validated placeholders
const narrative = defineSchemaPrompt(
  z.object({
    area: z.number().describe("Area in square feet"),
    rooms: z.number().int().describe("Number of rooms"),
  }),
  {
    name: "property_summary",
    template: "The property is {{area}} SF with {{rooms}} rooms." as const,
  },
);
// {{nonexistent}} → compile error

// 6. Typed lookup table — invalid IDs are compile errors
const RULE_IDS = ["RULE_001", "RULE_002", "RULE_003"] as const;
const terms = defineLookup(RULE_IDS, {
  "structural damage": "RULE_001",
  "water intrusion": "RULE_002",
  // "mold": "RULE_999"  → compile error: not in RULE_IDS
});
```

## What It Solves

| Problem | Without strongly-skilled | With strongly-skilled |
|---------|-------------------------|----------------------|
| Tool names in prompts | String literals that break silently on rename | Compile-time checked via `ToolRegistry` |
| Enum descriptions | Manual `.describe()` that drifts from variants | Auto-composed via `describedEnum` |
| Duplicate concept descriptions | Same thing described differently in two files | Single `defineSchema` source of truth |
| Template placeholders | `[GLA]` in strings with no validation | `{{GLA}}` checked against schema fields |
| Lookup table integrity | String IDs that may reference removed items | `defineLookup` constrains to known IDs |
| Tool description/schema divergence | Prose description ≠ actual parameters | Auto-composed from Zod field `.describe()` |

## MCP Adapter

Optional adapter for [Model Context Protocol](https://modelcontextprotocol.io) compatibility:

```typescript
import { toMcpTool } from "strongly-skilled/mcp";

const mcpTool = await toMcpTool(reportFinding);
// → { name, description, inputSchema: JSON Schema }
```

Requires `zod-to-json-schema` as an additional peer dependency.

## Documentation

- [Architecture](./docs/design/architecture.md) — library design, type-level machinery, API reference
- [Research](./docs/research/) — problem taxonomy, prior art survey, MCP analysis, citations

## License

MIT
