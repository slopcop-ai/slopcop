/**
 * Code Review Agent — cookbook entrypoint
 *
 * Demonstrates a multi-turn tool-use loop with the Anthropic SDK.
 * The SDK is used ONLY here — domain, tools, and prompts are pure slopcop.
 * Swap this file for OpenAI, Vercel AI SDK, or any other client.
 *
 * Usage: ANTHROPIC_API_KEY=sk-... bun run cookbook/run.ts
 */
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages.js";
import { z } from "zod";
import { reviewTools } from "./domain/registry.js";
import type { Finding } from "./domain/schemas.js";
import { systemPrompt } from "./prompts/system.js";
import { reviewInstruction } from "./prompts/templates.js";

// ── 1. Render the user instruction ──────────────────────────────────────────

const userInstruction = reviewInstruction.render({
	language: "TypeScript",
	repository: "acme/auth-service",
	focusAreas: "security, correctness",
});

// ── 2. A hardcoded diff with an obvious security bug ────────────────────────

const codeDiff = `
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
   if (typeof decoded === "string") {
     throw new AuthError("Invalid token format");
   }
`;

// ── 3. Convert tools to Claude SDK format ───────────────────────────────────
//
// This is the "bridge" between slopcop's Zod schemas and the LLM SDK's
// expected JSON Schema format. Every SDK has a slightly different shape —
// this section is what you'd replace for a different provider.

const claudeTools: Anthropic.Tool[] = reviewTools.all.map((tool) => ({
	name: tool.name as string,
	description: tool.composedDescription,
	input_schema: z.toJSONSchema(tool.inputSchema) as Anthropic.Tool.InputSchema,
}));

// ── 4. Multi-turn tool-use loop ─────────────────────────────────────────────

const client = new Anthropic();
const findings: z.infer<typeof Finding.schema>[] = [];

const messages: MessageParam[] = [
	{ role: "user", content: `${userInstruction}\n\n\`\`\`diff\n${codeDiff}\n\`\`\`` },
];

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  Code Review Agent — cookbook example                       ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
console.log("System prompt length:", systemPrompt.length, "chars\n");

let turn = 0;
while (true) {
	turn++;
	console.log(`── Turn ${turn} ──`);

	const response = await client.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 4096,
		system: systemPrompt,
		tools: claudeTools,
		messages,
	});

	// Collect tool results for the next turn
	const toolResults: ToolResultBlockParam[] = [];

	for (const block of response.content) {
		if (block.type === "text") {
			console.log("\nAssistant:", block.text);
		} else if (block.type === "tool_use") {
			const tool = reviewTools.all.find((t) => (t.name as string) === block.name);
			if (!tool) {
				console.error(`Unknown tool: ${block.name}`);
				toolResults.push({ type: "tool_result", tool_use_id: block.id, content: "Unknown tool" });
				continue;
			}

			// Parse + validate input against the Zod schema
			const parsed = tool.inputSchema.parse(block.input);
			console.log(`\n  → ${block.name}:`, JSON.stringify(parsed, null, 2));

			// Track findings for the final report
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

	// Feed tool results back for the next turn
	messages.push({ role: "assistant", content: response.content });
	messages.push({ role: "user", content: toolResults });
}

// ── 5. Final report ─────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  Review Complete                                           ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

for (const f of findings) {
	console.log(`  [${f.severity}] ${f.category} — ${f.title}`);
	console.log(`    ${f.filePath}:${f.lineRange.start}-${f.lineRange.end}`);
	console.log(`    ${f.explanation}\n`);
}

console.log(`Total findings: ${findings.length}`);
