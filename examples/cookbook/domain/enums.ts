import { describedEnum } from "slopcop";

/**
 * How urgent a finding is — controls whether a review blocks merge.
 */
export const Severity = describedEnum({
	critical: "Must fix before merge — security flaw, data loss, or crash",
	warning: "Should fix — correctness issue or significant code smell",
	suggestion: "Nice to have — improves clarity or maintainability",
	nitpick: "Optional style or naming preference",
});

/**
 * What kind of problem a finding describes.
 */
export const Category = describedEnum({
	security: "Authentication, authorization, injection, data exposure",
	performance: "N+1 queries, unnecessary allocations, missing indexes",
	correctness: "Logic errors, off-by-one, null safety, race conditions",
	style: "Formatting, naming conventions, idiomatic patterns",
	maintainability: "Complexity, coupling, missing abstractions, test gaps",
});
