import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { defineTool } from "../../src/core/tool.js";

describe("defineTool", () => {
	const reportBias = defineTool({
		name: "report_bias_findings",
		description: "Reports potential bias findings.",
		inputSchema: z.object({
			biasType: z.enum(["racial", "gender", "age"]).describe("Type of bias"),
			explanation: z.string().describe("Detailed explanation"),
			severity: z.number().int().describe("Severity score 1-10"),
		}),
	});

	test(".toolName matches the provided name", () => {
		expect(reportBias.toolName as string).toBe("report_bias_findings");
	});

	test(".name matches the provided name", () => {
		expect(reportBias.name as string).toBe("report_bias_findings");
	});

	test(".description is the raw description", () => {
		expect(reportBias.description).toBe("Reports potential bias findings.");
	});

	test(".composedDescription includes field descriptions", () => {
		expect(reportBias.composedDescription).toContain("Reports potential bias findings.");
		expect(reportBias.composedDescription).toContain("biasType");
		expect(reportBias.composedDescription).toContain("Type of bias");
		expect(reportBias.composedDescription).toContain("explanation");
		expect(reportBias.composedDescription).toContain("severity");
	});

	test(".inputRef() returns the key string", () => {
		expect(reportBias.inputRef("biasType")).toBe("biasType");
		expect(reportBias.inputRef("explanation")).toBe("explanation");
	});

	test(".inputKeys lists all input schema keys", () => {
		expect(reportBias.inputKeys).toContain("biasType");
		expect(reportBias.inputKeys).toContain("explanation");
		expect(reportBias.inputKeys).toContain("severity");
		expect(reportBias.inputKeys).toHaveLength(3);
	});

	test(".parseInput() validates correct input", () => {
		const result = reportBias.parseInput({
			biasType: "racial",
			explanation: "Found discriminatory language",
			severity: 8,
		});
		expect(result.biasType).toBe("racial");
		expect(result.explanation).toBe("Found discriminatory language");
		expect(result.severity).toBe(8);
	});

	test(".parseInput() rejects invalid input", () => {
		expect(() => reportBias.parseInput({})).toThrow();
		expect(() =>
			reportBias.parseInput({
				biasType: "unknown",
				explanation: "test",
				severity: 1,
			}),
		).toThrow();
		expect(() =>
			reportBias.parseInput({
				biasType: "racial",
				explanation: 42,
				severity: 1,
			}),
		).toThrow();
	});
});
