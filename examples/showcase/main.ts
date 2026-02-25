import Anthropic from "@anthropic-ai/sdk";
import {
	compose,
	createRegistry,
	definePrompt,
	defineSchema,
	defineSystemPrompt,
	defineTool,
	describedEnum,
	enumSection,
	toolSection,
} from "slopcop";
/**
 * slopcop Showcase — Code Review Agent in a single file
 *
 * Demonstrates the full API surface in 4 steps:
 *   1. Define domain (enums, schemas, tools)
 *   2. Build registry
 *   3. Compose system prompt
 *   4. Call Claude (the only SDK-specific part)
 *
 * Usage: ANTHROPIC_API_KEY=sk-... bun run showcase/main.ts
 */
import { z } from "zod";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Step 1: Define the domain
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Severity = describedEnum({
	critical: "Must fix before merge — security flaw, data loss, or crash",
	warning: "Should fix — correctness issue or significant code smell",
	suggestion: "Nice to have — improves clarity or maintainability",
	nitpick: "Optional style or naming preference",
});

const Category = describedEnum({
	security: "Authentication, authorization, injection, data exposure",
	performance: "N+1 queries, unnecessary allocations, missing indexes",
	correctness: "Logic errors, off-by-one, null safety, race conditions",
	style: "Formatting, naming conventions, idiomatic patterns",
	maintainability: "Complexity, coupling, missing abstractions, test gaps",
});

const Finding = defineSchema(
	"Finding",
	z.object({
		filePath: z.string().describe("Relative path to the file"),
		lineRange: z
			.object({
				start: z.number().int().describe("First line of the relevant span"),
				end: z.number().int().describe("Last line of the relevant span"),
			})
			.describe("Line range of the problematic code"),
		severity: Severity.describe("How urgent this finding is"),
		category: Category.describe("What kind of problem this is"),
		title: z.string().describe("One-line summary (≤80 chars)"),
		explanation: z.string().describe("Detailed explanation with reasoning"),
		suggestedFix: z.string().optional().describe("Concrete fix or approach"),
	}),
);

const ReviewSummary = defineSchema(
	"ReviewSummary",
	z.object({
		verdict: z.enum(["approve", "request_changes", "comment"]).describe("Overall decision"),
		summary: z.string().describe("2-3 sentence summary"),
		findingCount: z.number().int().describe("Total findings"),
		criticalCount: z.number().int().describe("Critical findings"),
		topConcern: z.string().optional().describe("Most important issue"),
	}),
);

// Field descriptions are auto-composed from .describe() calls:
console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  Step 1: Domain — auto-composed field descriptions          ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
console.log(Finding.fieldDescriptions);

// Try uncommenting — these are compile errors, not runtime errors:
// Finding.ref("nonexistent");          // TS error: not a key of Finding
// Finding.path("lineRange.nope");      // TS error: not a valid path

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Step 2: Tools + Registry
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const reportFinding = defineTool({
	name: "report_finding",
	description: "Report a code review finding.",
	inputSchema: Finding.schema,
});

const summarizeReview = defineTool({
	name: "summarize_review",
	description: "Summarize the code review with a verdict.",
	inputSchema: ReviewSummary.schema,
});

const registry = createRegistry().register(reportFinding).register(summarizeReview);

// Type-safe name references — try changing "report_finding" to a typo:
console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  Step 2: Registry — type-safe tool name references          ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
console.log("Registered tools:", registry.names);
console.log("Safe name ref:", registry.nameOf("report_finding"));

// Try: registry.nameOf("typo_tool");  // compile error

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Step 3: Compose the system prompt
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const instruction = defineSystemPrompt(
	registry,
	({ tool, allToolNames }) =>
		`You are a senior code reviewer. Tools: ${allToolNames()}.

For each issue, call ${tool("report_finding")} with location and severity.
After reviewing all changes, call ${tool("summarize_review")} with your verdict.

Be specific, constructive, and prioritize security over style.`,
);

const systemPrompt = compose(
	[
		{ heading: "instructions", content: instruction.text, priority: 10 },
		enumSection("Severity Levels", Severity),
		enumSection("Categories", Category),
		toolSection(reportFinding),
		toolSection(summarizeReview),
	],
	{ headingStyle: "xml" },
);

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  Step 3: Composed system prompt                             ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
console.log(systemPrompt);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Step 4: Call Claude (the only SDK-specific part — swap for any provider)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const userPrompt = definePrompt({
	name: "review_request",
	template: "Review this {{language}} diff:\n\n```diff\n{{diff}}\n```" as const,
	variables: {
		language: z.string(),
		diff: z.string(),
	},
});

const diff = `
diff --git a/src/auth.ts b/src/auth.ts
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -12,6 +12,14 @@ export async function authenticate(token: string): Promise<User> {
+  // Fast-path for admin access
+  if (token === "admin") {
+    return { id: "0", role: "admin", name: "Admin" };
+  }
+
   const decoded = jwt.verify(token, process.env.JWT_SECRET!);
`;

// Bridge: convert slopcop tools → Claude SDK format
const claudeTools: Anthropic.Tool[] = registry.all.map((tool) => ({
	name: tool.name as string,
	description: tool.composedDescription,
	input_schema: z.toJSONSchema(tool.inputSchema) as Anthropic.Tool.InputSchema,
}));

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  Step 4: Calling Claude...                                  ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

const client = new Anthropic();
const findings: z.infer<typeof Finding.schema>[] = [];

const messages: Anthropic.MessageParam[] = [
	{
		role: "user",
		content: userPrompt.render({ language: "TypeScript", diff }),
	},
];

let turn = 0;
while (true) {
	turn++;
	const response = await client.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 4096,
		system: systemPrompt,
		tools: claudeTools,
		messages,
	});

	const toolResults: Anthropic.ToolResultBlockParam[] = [];

	for (const block of response.content) {
		if (block.type === "text") {
			console.log("Assistant:", block.text);
		} else if (block.type === "tool_use") {
			const tool = registry.all.find((t) => (t.name as string) === block.name);
			if (!tool) continue;

			// Validate input against the Zod schema — catches malformed LLM output
			const parsed = tool.inputSchema.parse(block.input);
			console.log(`  → ${block.name}:`, JSON.stringify(parsed, null, 2));

			if (block.name === "report_finding") {
				findings.push(parsed as z.infer<typeof Finding.schema>);
			}

			toolResults.push({
				type: "tool_result",
				tool_use_id: block.id,
				content: JSON.stringify({ ok: true }),
			});
		}
	}

	if (response.stop_reason === "end_turn") break;

	messages.push({ role: "assistant", content: response.content });
	messages.push({ role: "user", content: toolResults });
}

// ── Final report ────────────────────────────────────────────────────────────

console.log("\n── Findings ──\n");
for (const f of findings) {
	console.log(`  [${f.severity}] ${f.category} — ${f.title}`);
	console.log(`    ${f.filePath}:${f.lineRange.start}-${f.lineRange.end}`);
	console.log(`    ${f.explanation}\n`);
}
