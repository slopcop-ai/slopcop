import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { composeFieldDescriptions, defineSchema, describedEnum } from "../../src/core/schema.js";

// ─── describedEnum ───

describe("describedEnum", () => {
	const Severity = describedEnum({
		high: "Critical issue requiring immediate attention",
		medium: "Notable issue that should be addressed",
		low: "Minor observation for consideration",
	});

	test("creates a valid Zod enum that parses known values", () => {
		expect(Severity.parse("high")).toBe("high");
		expect(Severity.parse("medium")).toBe("medium");
		expect(Severity.parse("low")).toBe("low");
	});

	test("rejects unknown values", () => {
		expect(() => Severity.parse("critical")).toThrow();
		expect(() => Severity.parse("")).toThrow();
		expect(() => Severity.parse(42)).toThrow();
	});

	test("composedDescription lists all variants with descriptions", () => {
		expect(Severity.composedDescription).toContain('"high"');
		expect(Severity.composedDescription).toContain("Critical issue requiring immediate attention");
		expect(Severity.composedDescription).toContain('"medium"');
		expect(Severity.composedDescription).toContain('"low"');
	});

	test("variantDescriptions map has correct entries", () => {
		expect(Severity.variantDescriptions.get("high")).toBe(
			"Critical issue requiring immediate attention",
		);
		expect(Severity.variantDescriptions.get("medium")).toBe(
			"Notable issue that should be addressed",
		);
		expect(Severity.variantDescriptions.get("low")).toBe("Minor observation for consideration");
		expect(Severity.variantDescriptions.size).toBe(3);
	});

	test("enum schema has .describe() text set to composed description", () => {
		expect(Severity.description).toBe(Severity.composedDescription);
	});
});

// ─── composeFieldDescriptions ───

describe("composeFieldDescriptions", () => {
	test("composes flat object field descriptions", () => {
		const schema = z.object({
			name: z.string().describe("Full name"),
			age: z.number().describe("Age in years"),
		});
		const result = composeFieldDescriptions(schema);
		expect(result).toContain("- name: Full name");
		expect(result).toContain("- age: Age in years");
	});

	test("composes nested object field descriptions with indentation", () => {
		const schema = z.object({
			address: z
				.object({
					street: z.string().describe("Street address"),
					city: z.string().describe("City name"),
				})
				.describe("Mailing address"),
		});
		const result = composeFieldDescriptions(schema);
		expect(result).toContain("- address: Mailing address");
		expect(result).toContain("  - street: Street address");
		expect(result).toContain("  - city: City name");
	});

	test("handles fields without .describe()", () => {
		const schema = z.object({
			name: z.string(),
		});
		const result = composeFieldDescriptions(schema);
		expect(result).toContain("- name:");
	});
});

// ─── defineSchema ───

describe("defineSchema", () => {
	const property = defineSchema(
		"property",
		z.object({
			GLA: z.number().describe("Gross Living Area in square feet"),
			beds: z.number().int().describe("Number of bedrooms"),
			baths: z.number().describe("Number of bathrooms"),
		}),
	);

	test(".name returns the schema name", () => {
		expect(property.name).toBe("property");
	});

	test(".ref() returns the key string", () => {
		expect(property.ref("GLA")).toBe("GLA");
		expect(property.ref("beds")).toBe("beds");
	});

	test(".keys lists all schema keys", () => {
		expect(property.keys).toContain("GLA");
		expect(property.keys).toContain("beds");
		expect(property.keys).toContain("baths");
		expect(property.keys).toHaveLength(3);
	});

	test(".fieldDescriptions is a composed string", () => {
		expect(property.fieldDescriptions).toContain("GLA");
		expect(property.fieldDescriptions).toContain("Gross Living Area");
		expect(property.fieldDescriptions).toContain("beds");
	});

	test(".schema is the original Zod schema", () => {
		expect(property.schema.parse({ GLA: 2000, beds: 3, baths: 2 })).toEqual({
			GLA: 2000,
			beds: 3,
			baths: 2,
		});
	});
});
