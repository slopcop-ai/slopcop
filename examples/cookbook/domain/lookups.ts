import { defineLookup } from "slopcop";
import { Category } from "./enums.js";

/**
 * Maps common pitfall names to the category they belong to.
 *
 * Every value is constrained to `Category`'s variants at compile time.
 * If a variant is removed from `Category`, every stale reference here
 * becomes a compile error — no silent drift.
 */
export const categoryPitfalls = defineLookup(Category.options, {
	"SQL injection": "security",
	"XSS vulnerability": "security",
	"hardcoded credentials": "security",
	"insecure deserialization": "security",
	"N+1 query": "performance",
	"unnecessary allocation": "performance",
	"missing database index": "performance",
	"unbounded loop": "performance",
	"off-by-one error": "correctness",
	"null dereference": "correctness",
	"race condition": "correctness",
	"unchecked error": "correctness",
	"inconsistent naming": "style",
	"magic number": "style",
	"dead code": "maintainability",
	"tight coupling": "maintainability",
	"missing test coverage": "maintainability",
});
