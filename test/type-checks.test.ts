/**
 * Compile-time type assertions using @ts-expect-error.
 *
 * This file is NOT run by `bun test`. It is validated by `tsc --noEmit`
 * via `bun run check`. If a @ts-expect-error comment is placed above a
 * line that does NOT produce a type error, `tsc` will fail — proving
 * the type constraint works.
 */

import { z } from "zod";
import {
	defineLookup,
	definePrompt,
	defineSchema,
	defineSchemaPrompt,
	defineTool,
	describedEnum,
} from "../src/core/index.js";
import type { ExtractPlaceholders, ValidateTemplate } from "../src/core/types.js";

// ─── describedEnum infers literal union type ───

const Severity = describedEnum({
	high: "Critical",
	medium: "Notable",
	low: "Minor",
});

const _validSeverity: "high" | "medium" | "low" = Severity.parse("high");
void _validSeverity;

// @ts-expect-error — parse result is not assignable to unrelated literal
const _badSeverity: "critical" = Severity.parse("high");
void _badSeverity;

// ─── defineSchema.ref() rejects unknown keys ───

const property = defineSchema(
	"property",
	z.object({
		GLA: z.number().describe("Gross Living Area"),
		beds: z.number().int().describe("Bedrooms"),
	}),
);

const _validRef = property.ref("GLA");
void _validRef;

// @ts-expect-error — "nonexistent" is not a key in the schema
const _badRef = property.ref("nonexistent");
void _badRef;

// ─── defineTool.inputRef() rejects unknown keys ───

const myTool = defineTool({
	name: "my_tool",
	description: "A tool",
	inputSchema: z.object({
		x: z.string().describe("x"),
		y: z.number().describe("y"),
	}),
});

const _validInputRef = myTool.inputRef("x");
void _validInputRef;

// @ts-expect-error — "z" is not a key in the input schema
const _badInputRef = myTool.inputRef("z");
void _badInputRef;

// ─── defineLookup rejects IDs not in the valid set ───

const RULE_IDS = ["RULE_1001", "RULE_1002"] as const;

const _validLookup = defineLookup(RULE_IDS, {
	term: "RULE_1001",
});
void _validLookup;

// @ts-expect-error — "RULE_9999" is not in the valid ID set
const _badLookup = defineLookup(RULE_IDS, { term: "RULE_9999" });
void _badLookup;

// ─── defineSchemaPrompt: error type returned for bad placeholders ───

const schema = z.object({
	GLA: z.number().describe("GLA"),
	beds: z.number().describe("Beds"),
});

const _validSchemaPrompt = defineSchemaPrompt(schema, {
	name: "ok",
	template: "{{GLA}} and {{beds}}" as const,
});
void _validSchemaPrompt;
// Valid: can call .render() on the valid prompt
_validSchemaPrompt.render({ GLA: 2000, beds: 3 });

const _badSchemaPrompt = defineSchemaPrompt(schema, {
	name: "bad",
	template: "{{NONEXISTENT}}" as const,
});
void _badSchemaPrompt;
// @ts-expect-error — bad schema prompt returns error type, .render() doesn't exist
_badSchemaPrompt.render({ NONEXISTENT: 1 });

// ─── ExtractPlaceholders extracts correct keys ───

type Extracted = ExtractPlaceholders<"Hello {{name}}, your {{role}}">;
const _checkExtracted: Extracted = "name";
void _checkExtracted;
const _checkExtracted2: Extracted = "role";
void _checkExtracted2;

// @ts-expect-error — "other" is not a placeholder in the template
const _badExtracted: Extracted = "other";
void _badExtracted;

// ─── ValidateTemplate produces error types on mismatch ───

type ValidResult = ValidateTemplate<"Hello {{name}}", { name: string }>;
const _validTemplate: ValidResult = "Hello {{name}}";
void _validTemplate;

type ErrorResult = ValidateTemplate<"Hello {{name}} {{unknown}}", { name: string }>;
// @ts-expect-error — error type is not assignable to the template string
const _errorTemplate: "Hello {{name}} {{unknown}}" = "" as ErrorResult;
void _errorTemplate;

// ─── definePrompt rejects mismatched placeholders ───

const _validDefinePrompt = definePrompt({
	name: "good",
	template: "Hello {{name}}" as const,
	variables: { name: z.string() },
});
void _validDefinePrompt;

const _mismatchPrompt = definePrompt({
	name: "bad",
	template: "Hello {{name}}" as const,
	// @ts-expect-error — "wrong" doesn't match placeholder "name"
	variables: { wrong: z.string() },
});
void _mismatchPrompt;
