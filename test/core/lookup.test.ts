import { describe, expect, test } from "bun:test";
import { defineLookup } from "../../src/core/lookup.js";

const RULE_IDS = ["RULE_1001", "RULE_1002", "RULE_2001"] as const;

describe("defineLookup", () => {
	const terms = defineLookup(RULE_IDS, {
		"market value": "RULE_1001",
		neighborhood: "RULE_2001",
		condition: ["RULE_1001", "RULE_1002"],
	});

	test(".get() returns the correct value for a key", () => {
		expect(terms.get("market value")).toBe("RULE_1001");
		expect(terms.get("neighborhood")).toBe("RULE_2001");
	});

	test(".get() returns array for multi-value entries", () => {
		expect(terms.get("condition")).toEqual(["RULE_1001", "RULE_1002"]);
	});

	test(".validIds contains all provided IDs", () => {
		expect(terms.validIds.has("RULE_1001")).toBe(true);
		expect(terms.validIds.has("RULE_1002")).toBe(true);
		expect(terms.validIds.has("RULE_2001")).toBe(true);
		expect(terms.validIds.size).toBe(3);
	});

	test(".table exposes the raw lookup table", () => {
		expect(terms.table["market value"]).toBe("RULE_1001");
		expect(terms.table.neighborhood).toBe("RULE_2001");
	});

	test(".validate() passes for a valid table", () => {
		expect(() => terms.validate()).not.toThrow();
	});

	test(".validate() throws for invalid IDs at runtime", () => {
		const bad = defineLookup(
			RULE_IDS,
			// Cast through unknown to bypass compile-time check — testing runtime validation
			{ broken: "RULE_9999" } as unknown as Record<string, (typeof RULE_IDS)[number]>,
		);
		expect(() => bad.validate()).toThrow('invalid ID "RULE_9999"');
	});
});
