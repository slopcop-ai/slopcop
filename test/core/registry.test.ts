import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { createRegistry } from "../../src/core/registry.js";
import { defineTool } from "../../src/core/tool.js";

const toolA = defineTool({
	name: "tool_a",
	description: "First tool",
	inputSchema: z.object({ x: z.string().describe("input x") }),
});

const toolB = defineTool({
	name: "tool_b",
	description: "Second tool",
	inputSchema: z.object({ y: z.number().describe("input y") }),
});

describe("createRegistry", () => {
	test("returns an empty registry", () => {
		const registry = createRegistry();
		expect(registry.names).toEqual([]);
		expect(registry.all).toEqual([]);
	});
});

describe("ToolRegistry", () => {
	test(".register() adds a tool and .get() retrieves it", () => {
		const registry = createRegistry().register(toolA);
		const retrieved = registry.get("tool_a");
		expect(retrieved.name as string).toBe("tool_a");
		expect(retrieved.description).toBe("First tool");
	});

	test("chained .register() calls accumulate tools", () => {
		const registry = createRegistry().register(toolA).register(toolB);
		expect(registry.get("tool_a").name as string).toBe("tool_a");
		expect(registry.get("tool_b").name as string).toBe("tool_b");
	});

	test(".nameOf() returns the name string", () => {
		const registry = createRegistry().register(toolA);
		expect(registry.nameOf("tool_a") as string).toBe("tool_a");
	});

	test(".names lists all registered tool names", () => {
		const registry = createRegistry().register(toolA).register(toolB);
		expect(registry.names).toContain("tool_a");
		expect(registry.names).toContain("tool_b");
		expect(registry.names).toHaveLength(2);
	});

	test(".all returns all tool definitions", () => {
		const registry = createRegistry().register(toolA).register(toolB);
		expect(registry.all).toHaveLength(2);
		expect(registry.all.map((t) => t.name as string)).toContain("tool_a");
		expect(registry.all.map((t) => t.name as string)).toContain("tool_b");
	});

	test(".get() throws on unregistered name at runtime", () => {
		const registry = createRegistry().register(toolA);
		// biome-ignore lint/suspicious/noExplicitAny: testing runtime error for unregistered name
		expect(() => (registry as any).get("nonexistent")).toThrow(
			'Tool "nonexistent" is not registered',
		);
	});

	test(".nameOf() throws on unregistered name at runtime", () => {
		const registry = createRegistry().register(toolA);
		// biome-ignore lint/suspicious/noExplicitAny: testing runtime error for unregistered name
		expect(() => (registry as any).nameOf("nonexistent")).toThrow(
			'Tool "nonexistent" is not registered',
		);
	});
});
