import { definePrompt, defineSchemaPrompt } from "slopcop";
import { z } from "zod";
import { Finding } from "../domain/schemas.js";

/**
 * Instruction template for a code review request.
 *
 * Placeholders are validated at compile time — adding `{{typo}}`
 * without a matching variable entry is a type error.
 */
export const reviewInstruction = definePrompt({
	name: "review_instruction",
	description: "Instruction block for the code review task",
	template:
		"Review the following {{language}} code diff from {{repository}}. Focus on {{focusAreas}}. Report each finding individually, then summarize." as const,
	variables: {
		language: z.string().describe("Programming language of the code under review"),
		repository: z.string().describe("Repository name or identifier"),
		focusAreas: z.string().describe("Comma-separated areas to emphasize"),
	},
});

/**
 * Schema-bound prompt for formatting a single finding.
 *
 * Every placeholder must be a field in `Finding.schema` — referencing
 * a non-existent field (e.g. `{{nonexistent}}`) is a compile error.
 */
export const findingFormat = defineSchemaPrompt(Finding.schema, {
	name: "finding_format",
	template: "[{{severity}}] {{category}} — {{title}}" as const,
});
