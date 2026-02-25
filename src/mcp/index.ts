import type { z } from "zod";
import type { ToolDefinition } from "../core/types.js";

// ─── MCP-compatible output types (no MCP SDK dependency) ───

export interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

export interface McpPromptDefinition {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

/**
 * Converts a strongly-skilled tool definition to an MCP-compatible
 * tool definition. Requires `zod-to-json-schema` as a peer dependency.
 *
 * @example
 * import { toMcpTool } from "strongly-skilled/mcp";
 * const mcpTool = toMcpTool(reportBias);
 */
export async function toMcpTool(
  tool: ToolDefinition,
): Promise<McpToolDefinition> {
  const { zodToJsonSchema } = await import("zod-to-json-schema");

  const jsonSchema = zodToJsonSchema(tool.inputSchema, {
    $refStrategy: "none",
    target: "openApi3",
  });

  const { $schema: _, ...rest } = jsonSchema as Record<string, unknown>;

  return {
    name: tool.name as string,
    description: tool.composedDescription,
    inputSchema: {
      type: "object",
      ...rest,
    } as McpToolDefinition["inputSchema"],
  };
}

/**
 * Converts a prompt definition's variables to MCP-compatible prompt arguments.
 */
export function toMcpPrompt(prompt: {
  name: string;
  description?: string;
  variables: Record<string, z.ZodType>;
}): McpPromptDefinition {
  const args = Object.entries(prompt.variables).map(([name, schema]) => ({
    name,
    description: schema.description,
    required: !schema.isOptional(),
  }));

  return {
    name: prompt.name,
    description: prompt.description,
    arguments: args,
  };
}

/**
 * Converts an entire registry's tools to MCP tool definitions.
 */
export async function registryToMcpTools(registry: {
  all: ToolDefinition[];
}): Promise<McpToolDefinition[]> {
  return Promise.all(registry.all.map(toMcpTool));
}
