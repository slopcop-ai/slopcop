# Problem Taxonomy: Six Categories of Prompt-Code Drift

## Abstract

LLM prompts inevitably reference the surrounding codebase — tool names, schema fields, enum values, business rules. These references are overwhelmingly encoded as **string literals**, creating fragile coupling that breaks silently when code evolves. This document categorizes the problem into six distinct failure modes, each illustrated with concrete evidence from a production codebase.

Evidence is drawn from a multi-agent appraisal review system built on TypeScript, Zod, and the Anthropic API.

---

## 1. Tool Name String Literals

**Failure mode:** Prompts reference tool names via string interpolation. Renaming a tool constant or changing the tool's registered name silently invalidates the prompt's instructions to the LLM.

**Evidence:**

```typescript
// constants.ts — source of truth for tool names
export const TOOL_NAMES = {
  REPORT_BIAS_FINDINGS: 'reportBiasFindings',
  COMPLETE_ANALYSIS: 'completeAnalysis',
  // ...
} as const;

// detect-bias.ts — prompt references tool names as interpolated strings
function buildBiasDetectionSystemPrompt(): string {
  return `
    1. **${TOOL_NAMES.REPORT_BIAS_FINDINGS}**: Call this tool ONCE with ALL findings...
    2. **${TOOL_NAMES.COMPLETE_ANALYSIS}**: Call ONCE after reporting findings...
    Report ALL findings in a single ${TOOL_NAMES.REPORT_BIAS_FINDINGS} call...
  `;
}
```

The `TOOL_NAMES` constant provides indirection but no **type-level guarantee** that the prompt's behavioral instructions match the tool's actual schema. If `REPORT_BIAS_FINDINGS` is renamed to `SUBMIT_BIAS_REPORT`, the interpolated string updates but the prose instruction ("Call this tool ONCE with ALL findings") may become semantically incorrect if the tool's contract changes alongside the rename.

**Compounding factor:** A single system prompt (e.g., `review-agent.ts:290-431`) can contain 6+ tool name references. Each is an independent point of failure.

---

## 2. Schema Description Drift

**Failure mode:** A Zod enum or object schema carries a `.describe()` annotation that enumerates its variants or fields in prose. When a variant is added, removed, or renamed, the prose description must be manually updated — and frequently isn't.

**Evidence:**

```typescript
// basic-info-extraction.ts
export const appraiserLicenseTypeSchema = z
  .enum([
    'CertifiedGeneral',
    'CertifiedResidential',
    'LicensedResidentialAppraiser',
    'None',
    'Other',
    'TraineeAppraiser',
  ])
  .describe(
    'Appraiser credential level per state licensing authority. ' +
    'CertifiedGeneral: all property types including complex commercial. ' +
    'CertifiedResidential: residential only up to 4 units. ' +
    'LicensedResidentialAppraiser: limited residential (<$1M). ' +
    'TraineeAppraiser: working under supervision. ' +
    'Most residential appraisals require CertifiedResidential or CertifiedGeneral.'
  );
```

The description enumerates 4 of 6 enum variants. `None` and `Other` are undocumented. If `SupervisoryAppraiser` is added to the enum, TypeScript will not flag the stale description. The LLM will encounter the new variant in structured output but receive no guidance on when to select it.

---

## 3. Semantic Duplication

**Failure mode:** The same concept is described in multiple locations — typically once in a schema definition and once in prompt prose or a score definition file. The descriptions drift apart over time.

**Evidence:**

```typescript
// schemas/review.ts — schema-level definitions
export const confidenceFactorsSchema = z.object({
  data_quality: z.number().min(0).max(1)
    .describe('Completeness of input data (1.0 = complete, 0.0 = major gaps)'),
  citation_coverage: z.number().min(0).max(1)
    .describe('How well findings are linked to source locations (1.0 = fully cited)'),
  reasoning_rigor: z.number().min(0).max(1)
    .describe('Strength of logical reasoning (1.0 = rigorous)'),
  internal_consistency: z.number().min(0).max(1)
    .describe('Absence of contradictions (1.0 = fully consistent)'),
});

// lib/appraisal/score-definitions.ts — prose-level definitions
measures: [
  'Data completeness — was extraction thorough with few gaps?',
  'Citation coverage — are findings well-grounded in specific document locations?',
  'Reasoning rigor — how strong is the logical chain from evidence to conclusion?',
  'Internal consistency — are there contradictions in the analysis?',
],
```

These describe identical concepts with different phrasing. The schema version uses "Completeness of input data" while the prose version says "was extraction thorough with few gaps?" — semantically equivalent but textually distinct. An LLM processing both may treat them as separate concepts.

---

## 4. Unvalidated Template Placeholders

**Failure mode:** Narrative templates use bracket-delimited placeholders (e.g., `[GLA]`, `[beds]`) that refer to schema fields, but no mechanism validates that the placeholder names correspond to actual fields.

**Evidence:**

```typescript
// review-agent.ts
const SUBJECT_TEMPLATES: Record<keyof NarrativeSubjectSection, string> = {
  property_description:
    '"The subject is a [GLA] SF [beds]-bedroom/[baths]-bathroom [stories]-story ' +
    '[design style] home sited on a [site SF] SF parcel."',
  area_location:
    '"It is located within the [neighborhood] of [city/state], ' +
    '[direction] of [crossstreets]."',
  construction:
    '"The home was constructed in [year built] with an effective age of [N] years."',
};
```

The `Record<keyof NarrativeSubjectSection, string>` type checks the *template keys* against the section interface, but the *placeholder names* inside the string values are untyped. `[design style]` may not match any field name in the property schema. TypeScript sees only `string` and provides no diagnostic.

---

## 5. Fragile Lookup Tables

**Failure mode:** Large mapping tables associate search terms or categories with system identifiers (rule IDs, tool names). The identifiers are string literals with no compile-time constraint to the set of actually-defined identifiers.

**Evidence:**

```typescript
// detect-flagged-terms.ts
const TERM_CATEGORIES: Record<string, TermMapping> = {
  damage:       { category: 'PROPERTY_CONDITION', rule_id: 'PROPERTY_CONDITION_GENERAL_DAMAGE' },
  tarp:         { category: 'STRUCTURAL',         rule_id: 'PROPERTY_CONDITION_STRUCTURAL_DAMAGE' },
  leak:         { category: 'ENVIRONMENTAL',      rule_id: 'PROPERTY_CONDITION_ENVIRONMENTAL_LEAK' },
  // ... 136 more entries ...
};
```

The `rule_id` values are typed as `string` (via `TermMapping`). If `PROPERTY_CONDITION_ENVIRONMENTAL_LEAK` is removed from the rule registry, this mapping silently references a nonexistent rule. At runtime, the LLM generates tool calls with invalid rule IDs that pass through without error until they hit a downstream lookup failure.

---

## 6. Tool Description/Schema Divergence

**Failure mode:** A tool's `description` string (human-readable prose explaining what the tool does and how to call it) diverges from the tool's actual `inputSchema` (the Zod schema defining its parameters).

**Evidence:**

The system prompt instructs the LLM:

```
1. **reportBiasFindings**: Call this tool ONCE with ALL findings in a single batch.
   Provide a findings array where each entry has:
   - text, rule_id (from FAIR_HOUSING registry)
   - reasoning: observation -> interpretation -> conclusion with citations
   - severity: HIGH, MEDIUM, LOW, or NOT_PROBLEMATIC
   - references: document locations
```

But the actual tool schema is defined separately:

```typescript
const reportFindingSchema = biasFindingSchema.omit({ rule_id: true }).extend({
  rule_id: fairHousingRuleIdSchema.describe('Rule ID from FAIR_HOUSING registry'),
});
```

The prompt says the schema has `text`, `rule_id`, `reasoning`, `severity`, `references`. But `biasFindingSchema` may have additional or renamed fields. Adding a `confidence` field to `biasFindingSchema` will not update the prompt instructions. The LLM follows the stale prompt and omits the new field.

---

## Cross-Cutting Observation

All six problems share a root cause: **code identifiers, field names, and semantic descriptions are referenced as string literals in prompts, schemas, and mappings, creating fragile coupling that TypeScript's type system does not check.**

The type system sees `string` where it should see a constrained set of known identifiers. The fix is to replace string-typed references with type-level constraints derived from the source-of-truth definitions — making the TypeScript compiler the enforcement mechanism for prompt-code synchronization.
