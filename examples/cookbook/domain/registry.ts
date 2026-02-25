import { createRegistry } from "slopcop";
import { reportFinding, suggestFix, summarizeReview } from "./tools.js";

/**
 * Central registry of all code review tools.
 *
 * The registry accumulates tool types via chained `.register()` calls,
 * so `reviewTools.get("report_finding")` is type-safe at compile time —
 * passing `"nonexistent_tool"` is a compile error.
 */
export const reviewTools = createRegistry()
	.register(reportFinding)
	.register(suggestFix)
	.register(summarizeReview);
