# Architecture: `slopcop`

## Thesis

Prompt construction is a type-checking problem. Existing tools validate prompt *composition* (Priompt), prompt *presentation* (POML), or LLM *output* (TypeChat). None validate prompt *authoring* — the act of writing prompts that correctly reference code artifacts. `slopcop` makes TypeScript's compiler the enforcement mechanism for prompt-code synchronization.

---

## Package Structure

```
slopcop/
├── src/
│   ├── index.ts              # Re-exports core/
│   ├── core/
│   │   ├── index.ts          # Core barrel export
│   │   ├── types.ts          # Brand types, template literal utilities
│   │   ├── schema.ts         # describedEnum, defineSchema, composeFieldDescriptions
│   │   ├── tool.ts           # defineTool
│   │   ├── registry.ts       # ToolRegistry, createRegistry
│   │   ├── lookup.ts         # defineLookup
│   │   ├── prompt.ts         # definePrompt, defineSchemaPrompt, defineSystemPrompt
│   │   └── compose.ts        # compose, toolSection, enumSection
│   └── mcp/
│       └── index.ts          # toMcpTool, toMcpPrompt, registryToMcpTools
├── examples/
│   ├── showcase/main.ts      # Single-file demo of all core APIs
│   └── cookbook/              # Modular multi-file example (domain, prompts, MCP, runner)
```

**Exports map:**

```jsonc
{
  ".":     { "types": "./dist/index.d.ts",     "import": "./dist/index.js" },
  "./mcp": { "types": "./dist/mcp/index.d.ts", "import": "./dist/mcp/index.js" }
}
```

**Dependencies:**
- Peer: `zod ^3.22.0`
- Optional peer: `zod-to-json-schema ^3.22.0` (only for `slopcop/mcp`)
- Runtime: none

---

## Core Primitives

### 1. `describedEnum` — Self-Documenting Enums

**Solves:** Problem 2 (schema description drift)

```typescript
const BiasType = describedEnum({
  racial: "Bias based on racial characteristics of the neighborhood",
  economic: "Bias based on economic demographics",
  geographic: "Bias based on geographic location stereotypes",
});
```

- Creates a Zod enum where the `.describe()` text is **auto-composed** from per-variant descriptions
- Adding a variant automatically updates the composed description
- Removing a variant causes compile errors at all usage sites
- Exposes `variantDescriptions` map and `composedDescription` string at runtime

### 2. `defineSchema` — Schema with Typed Field References

**Solves:** Problem 3 (semantic duplication), Problem 4 (unvalidated placeholders)

```typescript
const property = defineSchema("property", z.object({
  GLA: z.number().describe("Gross Living Area in square feet"),
  beds: z.number().int().describe("Number of bedrooms"),
}));

property.ref("GLA");          // type-safe field reference
property.ref("nonexistent");  // COMPILE ERROR
```

- Wraps a Zod object schema with type-safe `.ref()` and `.path()` accessors
- `fieldDescriptions` auto-composes a human-readable field list from `.describe()` annotations
- Provides `keys` and `paths` (dotted notation for nested objects) at both type and value level

### 3. `defineTool` — Tools with Auto-Composed Descriptions

**Solves:** Problem 1 (tool name strings), Problem 6 (description/schema divergence)

```typescript
const reportBias = defineTool({
  name: "report_bias_findings",
  description: "Reports potential bias findings.",
  inputSchema: z.object({
    biasType: BiasType,
    confidence: z.number().min(0).max(1).describe("Confidence score"),
  }),
});

reportBias.toolName;                // ToolName<"report_bias_findings"> (branded)
reportBias.inputRef("biasType");    // type-safe
reportBias.composedDescription;     // auto-includes field descriptions
```

- `name` becomes a branded `ToolName<N>` type — prevents accidental string substitution
- `composedDescription` concatenates the high-level description with per-field documentation from the Zod schema
- `inputRef()` provides compile-time-checked field name access

### 4. `ToolRegistry` — Referential Integrity

**Solves:** Problem 1 (tool names in prompts), Problem 5 (fragile lookups)

```typescript
const registry = createRegistry()
  .register(reportBias)
  .register(analyzeComps);

registry.nameOf("report_bias_findings");  // ok
registry.nameOf("nonexistent");           // COMPILE ERROR
```

- Type-accumulating pattern: each `.register()` call narrows the registry's type
- `nameOf()` constrains tool name references to the set of registered tools
- `get()` returns the full tool definition, typed to the specific tool

### 5. `defineLookup` — Typed Lookup Tables

**Solves:** Problem 5 (fragile lookup tables)

```typescript
const RULE_IDS = ["RULE_1001", "RULE_1002", "RULE_2001"] as const;

const terms = defineLookup(RULE_IDS, {
  "market value":     "RULE_1001",
  "neighborhood":     "RULE_2001",
  "zoning":           "RULE_9999",  // COMPILE ERROR
});
```

- Every value in the lookup table is constrained to the set of known identifiers via `as const` inference
- Adding an entry with an invalid identifier is a compile error
- Runtime `validate()` method for defense-in-depth

### 6. `definePrompt` / `defineSchemaPrompt` — Typed Templates

**Solves:** Problem 4 (unvalidated placeholders)

```typescript
// General typed template
const greeting = definePrompt({
  name: "greeting",
  template: "Hello {{name}}, your role is {{role}}.",
  variables: {
    name: z.string(),
    role: z.enum(["admin", "user"]),
  },
});

// Schema-bound narrative template
const narrative = defineSchemaPrompt(property.schema, {
  name: "property_narrative",
  template: "The subject is a {{GLA}} SF {{beds}}-bedroom residence.",
});
// Referencing {{NONEXISTENT}} → compile error
```

- `ExtractPlaceholders<T>` template literal type extracts `{{key}}` patterns from string constants
- `ValidateTemplate<T, Vars>` checks that every placeholder has a corresponding variable and vice versa
- `defineSchemaPrompt` constrains placeholders to fields of a specific Zod object schema

### 7. `defineSystemPrompt` — Tool-Referencing Prompts

**Solves:** Problem 1 (tool names in system prompts)

```typescript
const sys = defineSystemPrompt(registry, ({ tool, toolWithDescription }) => `
  When you find bias, call ${tool("report_bias_findings")}.
  ${toolWithDescription("analyze_comparables")}
`);
```

- Callback receives type-safe helpers constrained to registered tools
- `tool()` returns the tool name string, constrained to registered names
- `toolWithDescription()` includes the auto-composed description
- Uses a callback (not template literal types) for long-form prompts to avoid TypeScript recursion limits

### 8. `compose` — Prompt Section Assembly

```typescript
const full = compose([
  { heading: "Role", content: sys.text, priority: 10 },
  enumSection("Confidence Levels", ConfidenceLevel),
  toolSection(reportBias),
], { headingStyle: "xml" });
```

- Assembles sections with optional headings, priority ordering, and format control
- `toolSection()` and `enumSection()` helpers ensure prompt sections always reflect current schema state

---

## Type-Level Machinery

### Brand Types

```typescript
declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

type ToolName<N extends string = string> = Brand<N, "ToolName">;
type FieldRef<K extends string = string> = Brand<K, "FieldRef">;
type Identifier<I extends string = string> = Brand<I, "Identifier">;
```

Prevents accidental mixing of plain strings with registered identifiers.

### Template Literal Extraction

```typescript
type ExtractPlaceholders<T extends string> =
  T extends `${string}{{${infer Key}}}${infer Rest}`
    ? Key | ExtractPlaceholders<Rest>
    : never;
```

Statically extracts placeholder names from template string constants.

### Template Validation

```typescript
type ValidateTemplate<Template extends string, Vars extends Record<string, any>> =
  ExtractPlaceholders<Template> extends keyof Vars
    ? keyof Vars extends ExtractPlaceholders<Template>
      ? Template
      : `ERROR: unused variables: ${Exclude<...>}`
    : `ERROR: unknown placeholders: ${Exclude<...>}`;
```

Bidirectional check: every placeholder must have a variable, every variable must appear in the template.

### Field Path Extraction

```typescript
type FieldPaths<T extends z.ZodRawShape, Prefix extends string = ""> = {
  [K in Extract<keyof T, string>]: T[K] extends z.ZodObject<infer Inner>
    ? FieldPaths<Inner, `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[Extract<keyof T, string>];
```

Recursively produces dotted paths for nested Zod objects (e.g., `"address.street"`).

---

## MCP Adapter (`slopcop/mcp`)

```typescript
import { toMcpTool, toMcpPrompt, registryToMcpTools } from "slopcop/mcp";

const mcpTools = registryToMcpTools(registry);
// → McpToolDefinition[] with JSON Schema inputSchema + composed descriptions
```

- Converts Zod schemas to JSON Schema 2020-12 via `zod-to-json-schema`
- Preserves all `.describe()` annotations through the conversion
- Generates MCP-compatible prompt arguments from Zod variable schemas
- Optional peer dependency — core library works without it

---

## Known Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| `ExtractPlaceholders` recursion limit on long templates | Use callback-based `defineSystemPrompt` for long prompts; reserve template literal types for short schema-bound narratives |
| Zod v4 changes internal APIs | Schema introspection is localized to `composeFieldDescriptions`; migration affects one function |
| Deep `.register()` chains hit TS instantiation depth | Provide `createRegistry(tools)` overload accepting an object literal for flat type intersection |
| `zod-to-json-schema` as implicit `/mcp` dependency | Optional peer dependency; clear error if not installed |

---

## End-to-End Example

See the [README](../../README.md) for a complete usage example demonstrating all six problem solutions.
