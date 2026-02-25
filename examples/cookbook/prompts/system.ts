import { compose, defineSystemPrompt, enumSection, toolSection } from "slopcop";
import { Category, Severity } from "../domain/enums.js";
import { reviewTools } from "../domain/registry.js";
import { reportFinding, suggestFix, summarizeReview } from "../domain/tools.js";

/**
 * System prompt with compile-time tool name safety.
 *
 * The `tool()` helper ensures every tool reference resolves against the
 * registry — renaming a tool in `tools.ts` will surface errors here
 * instead of silently drifting.
 */
const coreInstruction = defineSystemPrompt(
	reviewTools,
	({ tool, allToolNames }) =>
		`You are a senior code reviewer. You have access to these tools: ${allToolNames()}.

For each issue you find, call ${tool("report_finding")} with the location, severity, and explanation.
When you have a concrete fix, also call ${tool("suggest_fix")} with the replacement code.
After reviewing all changes, call ${tool("summarize_review")} with your overall verdict.

Guidelines:
- Be specific: reference exact lines and variables.
- Be constructive: explain *why* something is a problem, not just *that* it is.
- Prioritize: security and correctness findings over style nits.
- Be concise: one finding per tool call.`,
);

/**
 * Composed system prompt combining tool descriptions, enum references,
 * and the core instruction into a single string.
 *
 * Uses XML-style headings — a common choice for Claude prompts.
 */
export const systemPrompt = compose(
	[
		{ heading: "instructions", content: coreInstruction.text, priority: 10 },
		enumSection("Severity Levels", Severity),
		enumSection("Categories", Category),
		toolSection(reportFinding),
		toolSection(suggestFix),
		toolSection(summarizeReview),
	],
	{ headingStyle: "xml" },
);
