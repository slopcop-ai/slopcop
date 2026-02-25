import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { definePrompt, defineSchemaPrompt, defineSystemPrompt } from "../../src/core/prompt.js";
import { createRegistry } from "../../src/core/registry.js";
import { defineTool } from "../../src/core/tool.js";

// ─── definePrompt ───

describe("definePrompt", () => {
	const greeting = definePrompt({
		name: "greeting",
		description: "A greeting template",
		template: "Hello {{name}}, your role is {{role}}." as const,
		variables: {
			name: z.string(),
			role: z.enum(["admin", "user"]),
		},
	});

	test(".name returns the prompt name", () => {
		expect(greeting.name).toBe("greeting");
	});

	test(".description returns the description", () => {
		expect(greeting.description).toBe("A greeting template");
	});

	test(".template returns the raw template string", () => {
		expect(greeting.template).toBe("Hello {{name}}, your role is {{role}}.");
	});

	test(".render() substitutes placeholders", () => {
		const result = greeting.render({ name: "Alice", role: "admin" });
		expect(result).toBe("Hello Alice, your role is admin.");
	});

	test(".render() validates values with Zod schemas", () => {
		// biome-ignore lint/suspicious/noExplicitAny: intentionally passing invalid type to test runtime validation
		expect(() => greeting.render({ name: "Alice", role: "superuser" as any })).toThrow();
	});
});

// ─── defineSchemaPrompt ───

describe("defineSchemaPrompt", () => {
	const propertySchema = z.object({
		GLA: z.number().describe("Gross Living Area"),
		beds: z.number().int().describe("Bedrooms"),
	});

	const narrative = defineSchemaPrompt(propertySchema, {
		name: "property_narrative",
		template: "The subject is a {{GLA}} SF {{beds}}-bedroom residence." as const,
	});

	test(".name returns the prompt name", () => {
		expect(narrative.name).toBe("property_narrative");
	});

	test(".render() substitutes schema field placeholders", () => {
		// biome-ignore lint/suspicious/noExplicitAny: conditional return type requires cast
		const result = (narrative as any).render({ GLA: 2000, beds: 3 });
		expect(result).toBe("The subject is a 2000 SF 3-bedroom residence.");
	});

	test(".render() validates field types", () => {
		// biome-ignore lint/suspicious/noExplicitAny: conditional return type requires cast
		expect(() => (narrative as any).render({ GLA: "big", beds: 3 })).toThrow();
	});
});

// ─── defineSystemPrompt ───

describe("defineSystemPrompt", () => {
	const toolA = defineTool({
		name: "report_findings",
		description: "Reports findings",
		inputSchema: z.object({ text: z.string().describe("Report text") }),
	});

	const registry = createRegistry().register(toolA);

	test("tool() helper returns the tool name string", () => {
		const sys = defineSystemPrompt(registry, ({ tool }) => {
			return `When you find issues, call ${tool("report_findings")}.`;
		});
		expect(sys.text).toContain("report_findings");
		expect(sys.text).toContain("When you find issues, call");
	});

	test("toolWithDescription() includes the composed description", () => {
		const sys = defineSystemPrompt(registry, ({ toolWithDescription }) => {
			return `Available: ${toolWithDescription("report_findings")}`;
		});
		expect(sys.text).toContain("report_findings");
		expect(sys.text).toContain("Reports findings");
	});

	test("allToolNames() lists all registered tool names", () => {
		const sys = defineSystemPrompt(registry, ({ allToolNames }) => {
			return `Tools: ${allToolNames()}`;
		});
		expect(sys.text).toContain("report_findings");
	});
});
