import { z } from "zod";
import type {
  ExtractPlaceholders,
  ShapeKeys,
  ToolDefinition,
} from "./types.js";
import type { ToolRegistry } from "./registry.js";

// ─── Typed Prompt Template ───

/** Return type of definePrompt. */
export interface TypedPrompt<
  Template extends string,
  Vars extends Record<string, z.ZodType>,
> {
  readonly name: string;
  readonly description: string | undefined;
  readonly template: Template;
  readonly variables: Vars;
  render(values: { [K in keyof Vars]: z.infer<Vars[K]> }): string;
}

/**
 * Defines a prompt template with compile-time validation of placeholders.
 * Every `{{placeholder}}` must correspond to a key in the variables record.
 *
 * @example
 * const greeting = definePrompt({
 *   name: "greeting",
 *   template: "Hello {{name}}, your role is {{role}}." as const,
 *   variables: {
 *     name: z.string(),
 *     role: z.enum(["admin", "user"]),
 *   },
 * });
 */
export function definePrompt<
  const Template extends string,
  Vars extends Record<ExtractPlaceholders<Template>, z.ZodType>,
>(config: {
  name: string;
  description?: string;
  template: Template;
  variables: Vars;
}): TypedPrompt<Template, Vars> {
  return {
    name: config.name,
    description: config.description,
    template: config.template,
    variables: config.variables,
    render(values) {
      let result: string = config.template;
      for (const [key, schema] of Object.entries(config.variables)) {
        const parsed = (schema as z.ZodType).parse(
          (values as Record<string, unknown>)[key],
        );
        result = result.replaceAll(`{{${key}}}`, String(parsed));
      }
      return result;
    },
  };
}

// ─── Schema-Bound Prompt ───

/** Return type of defineSchemaPrompt when valid. */
export interface SchemaPrompt<
  Template extends string,
  Shape extends z.ZodRawShape,
> {
  readonly name: string;
  readonly template: Template;
  render(values: {
    [K in ExtractPlaceholders<Template>]: K extends keyof Shape
      ? z.infer<Shape[K]>
      : never;
  }): string;
}

/** Error type returned when template references unknown fields. */
export interface SchemaPromptError<Msg extends string> {
  readonly ERROR: Msg;
}

/**
 * Creates a prompt template where placeholders are constrained to fields
 * of a specific Zod object schema.
 *
 * @example
 * const narrative = defineSchemaPrompt(propertySchema, {
 *   name: "property_narrative",
 *   template: "The subject is a {{GLA}} SF {{beds}}-bedroom residence." as const,
 * });
 * // Referencing {{NONEXISTENT}} → compile error
 */
export function defineSchemaPrompt<
  Shape extends z.ZodRawShape,
  const Template extends string,
>(
  schema: z.ZodObject<Shape>,
  config: {
    name: string;
    template: Template;
  },
): ExtractPlaceholders<Template> extends ShapeKeys<Shape>
  ? SchemaPrompt<Template, Shape>
  : SchemaPromptError<`Template references unknown fields: ${Exclude<ExtractPlaceholders<Template>, ShapeKeys<Shape>>}`> {
  return {
    name: config.name,
    template: config.template,
    render(values: Record<string, unknown>) {
      let result: string = config.template;
      for (const [key, val] of Object.entries(values)) {
        const fieldSchema = schema.shape[key];
        if (fieldSchema) {
          const parsed = (fieldSchema as z.ZodType).parse(val);
          result = result.replaceAll(`{{${key}}}`, String(parsed));
        }
      }
      return result;
    },
  } as any;
}

// ─── Tool-Referencing System Prompt ───

/** Helpers provided to the defineSystemPrompt builder callback. */
export interface SystemPromptHelpers<
  Tools extends Record<string, ToolDefinition>,
> {
  tool<N extends Extract<keyof Tools, string>>(name: N): string;
  toolWithDescription<N extends Extract<keyof Tools, string>>(name: N): string;
  allToolNames(): string;
}

/** Return type of defineSystemPrompt. */
export interface SystemPrompt {
  readonly text: string;
}

/**
 * Creates a system prompt that can reference tool names with compile-time safety.
 *
 * @example
 * const sys = defineSystemPrompt(registry, ({ tool }) => `
 *   When you find bias, call ${tool("report_bias_findings")}.
 * `);
 */
export function defineSystemPrompt<
  Tools extends Record<string, ToolDefinition>,
>(
  registry: ToolRegistry<Tools>,
  builder: (helpers: SystemPromptHelpers<Tools>) => string,
): SystemPrompt {
  const text = builder({
    tool: (name) => {
      registry.get(name);
      return name;
    },
    toolWithDescription: (name) => {
      const t = registry.get(name);
      return `${name as string}: ${t.composedDescription}`;
    },
    allToolNames: () => registry.names.join(", "),
  });
  return { text };
}
