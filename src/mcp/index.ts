import { z } from "zod";
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
	description?: string | undefined;
	arguments?:
		| Array<{
				name: string;
				description?: string | undefined;
				required?: boolean | undefined;
		  }>
		| undefined;
}

/**
 * Converts a slopcop tool definition to an MCP-compatible
 * tool definition. Uses Zod 4's native `z.toJSONSchema()` for schema conversion.
 *
 * @example
 * import { toMcpTool } from "slopcop/mcp";
 * const mcpTool = toMcpTool(reportBias);
 */
export function toMcpTool(tool: ToolDefinition): McpToolDefinition {
	const jsonSchema = z.toJSONSchema(tool.inputSchema) as Record<string, unknown>;
	const { $schema: _, "~standard": _std, ...rest } = jsonSchema;

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
	description?: string | undefined;
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
export function registryToMcpTools(registry: {
	all: ToolDefinition[];
}): McpToolDefinition[] {
	return registry.all.map(toMcpTool);
}
