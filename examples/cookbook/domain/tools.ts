import { defineTool } from "slopcop";
import { z } from "zod";
import { Finding, ReviewSummary } from "./schemas.js";

/**
 * Reports a single code review finding.
 *
 * Reuses `Finding.schema` directly — if a field is added or removed
 * from the schema, this tool's input contract updates automatically.
 */
export const reportFinding = defineTool({
	name: "report_finding",
	description: "Report a code review finding with severity, category, and location.",
	inputSchema: Finding.schema,
});

/**
 * Suggests a concrete fix for a code region.
 *
 * Uses an inline schema to show that `defineTool` works with both
 * schema-definition-based and ad-hoc Zod objects.
 */
export const suggestFix = defineTool({
	name: "suggest_fix",
	description: "Suggest a concrete code replacement for a specific region.",
	inputSchema: z.object({
		filePath: z.string().describe("Relative path to the file"),
		lineRange: z
			.object({
				start: z.number().int().describe("First line of the code to replace"),
				end: z.number().int().describe("Last line of the code to replace"),
			})
			.describe("Line range of code to replace"),
		originalCode: z.string().describe("The original code being replaced"),
		replacementCode: z.string().describe("The suggested replacement code"),
		rationale: z.string().describe("Why this change improves the code"),
	}),
});

/**
 * Wraps up the review with an overall verdict.
 */
export const summarizeReview = defineTool({
	name: "summarize_review",
	description: "Summarize the entire code review with a verdict.",
	inputSchema: ReviewSummary.schema,
});
