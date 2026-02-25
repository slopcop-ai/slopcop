import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { definePrompt } from "../../src/core/prompt.js";
import { createRegistry } from "../../src/core/registry.js";
import { defineTool } from "../../src/core/tool.js";
import { registryToMcpTools, toMcpPrompt, toMcpTool } from "../../src/mcp/index.js";

const reportTool = defineTool({
	name: "report_findings",
	description: "Reports findings to the user.",
	inputSchema: z.object({
		text: z.string().describe("The report text"),
		severity: z.number().int().describe("Severity 1-10"),
	}),
});

describe("toMcpTool", () => {
	test("produces a valid MCP tool shape", () => {
		const mcp = toMcpTool(reportTool);
		expect(mcp.name).toBe("report_findings");
		expect(mcp.description).toBeDefined();
		expect(mcp.inputSchema.type).toBe("object");
	});

	test("inputSchema contains JSON Schema properties", () => {
		const mcp = toMcpTool(reportTool);
		const props = mcp.inputSchema.properties as Record<string, { type: string }>;
		expect(props.text?.type).toBe("string");
		expect(props.severity?.type).toBe("integer");
	});

	test("inputSchema includes required array", () => {
		const mcp = toMcpTool(reportTool);
		expect(mcp.inputSchema.required).toContain("text");
		expect(mcp.inputSchema.required).toContain("severity");
	});
});

describe("toMcpPrompt", () => {
	const greeting = definePrompt({
		name: "greeting",
		description: "A greeting prompt",
		template: "Hello {{name}}, role: {{role}}." as const,
		variables: {
			name: z.string().describe("User name"),
			role: z.enum(["admin", "user"]).describe("User role"),
		},
	});

	test("produces MCP prompt shape with name and description", () => {
		const mcp = toMcpPrompt(greeting);
		expect(mcp.name).toBe("greeting");
		expect(mcp.description).toBe("A greeting prompt");
	});

	test("arguments list is derived from variables", () => {
		const mcp = toMcpPrompt(greeting);
		const args = mcp.arguments ?? [];
		expect(args).toHaveLength(2);
		const nameArg = args.find((a) => a.name === "name");
		const roleArg = args.find((a) => a.name === "role");
		expect(nameArg).toBeDefined();
		expect(nameArg?.description).toBe("User name");
		expect(nameArg?.required).toBe(true);
		expect(roleArg).toBeDefined();
		expect(roleArg?.description).toBe("User role");
	});

	test("optional variables have required: false", () => {
		const optPrompt = definePrompt({
			name: "opt",
			template: "Value: {{val}}." as const,
			variables: { val: z.string().optional() },
		});
		const mcp = toMcpPrompt(optPrompt);
		expect(mcp.arguments?.[0]?.required).toBe(false);
	});
});

describe("registryToMcpTools", () => {
	test("converts all registry tools", () => {
		const anotherTool = defineTool({
			name: "analyze",
			description: "Analyzes data.",
			inputSchema: z.object({ data: z.string().describe("Input data") }),
		});
		const registry = createRegistry().register(reportTool).register(anotherTool);
		const mcpTools = registryToMcpTools(registry);
		expect(mcpTools).toHaveLength(2);
		expect(mcpTools.map((t) => t.name)).toContain("report_findings");
		expect(mcpTools.map((t) => t.name)).toContain("analyze");
	});
});
