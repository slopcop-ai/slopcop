import { defineSchema } from "slopcop";
import { z } from "zod";
import { Category, Severity } from "./enums.js";

/**
 * A single code review finding with location, classification, and explanation.
 *
 * The nested `lineRange` object demonstrates that `defineSchema` handles
 * recursive field description composition automatically.
 */
export const Finding = defineSchema(
	"Finding",
	z.object({
		filePath: z.string().describe("Relative path to the file in the repository"),
		lineRange: z
			.object({
				start: z.number().int().describe("First line of the relevant code span"),
				end: z.number().int().describe("Last line of the relevant code span"),
			})
			.describe("Line range of the problematic code"),
		severity: Severity.describe("How urgent this finding is"),
		category: Category.describe("What kind of problem this is"),
		title: z.string().describe("One-line summary of the finding (≤80 chars)"),
		explanation: z.string().describe("Detailed explanation with reasoning"),
		suggestedFix: z
			.string()
			.optional()
			.describe("Concrete code change or approach to resolve the issue"),
	}),
);

/**
 * Final verdict after reviewing all findings.
 */
export const ReviewSummary = defineSchema(
	"ReviewSummary",
	z.object({
		verdict: z.enum(["approve", "request_changes", "comment"]).describe("Overall review decision"),
		summary: z.string().describe("2-3 sentence summary of the review"),
		findingCount: z.number().int().describe("Total number of findings reported"),
		criticalCount: z.number().int().describe("Number of critical findings"),
		topConcern: z.string().optional().describe("Single most important issue, if any"),
	}),
);
