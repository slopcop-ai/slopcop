import { describe, expect, test } from "bun:test";
import { compose, enumSection, toolSection } from "../../src/core/compose.js";

describe("compose", () => {
	test("renders sections with markdown headings by default", () => {
		const result = compose([
			{ heading: "Instructions", content: "Do the thing." },
			{ heading: "Context", content: "Some context." },
		]);
		expect(result).toContain("## Instructions\nDo the thing.");
		expect(result).toContain("## Context\nSome context.");
	});

	test("renders sections with xml headings", () => {
		const result = compose([{ heading: "Rules", content: "Follow these rules." }], {
			headingStyle: "xml",
		});
		expect(result).toContain("<Rules>\nFollow these rules.\n</Rules>");
	});

	test("renders sections with plain headings", () => {
		const result = compose([{ heading: "Notes", content: "Some notes." }], {
			headingStyle: "plain",
		});
		expect(result).toContain("Notes:\nSome notes.");
	});

	test("sorts sections by priority (higher first)", () => {
		const result = compose([
			{ heading: "Low", content: "low priority", priority: 1 },
			{ heading: "High", content: "high priority", priority: 10 },
			{ heading: "Mid", content: "mid priority", priority: 5 },
		]);
		const highIdx = result.indexOf("high priority");
		const midIdx = result.indexOf("mid priority");
		const lowIdx = result.indexOf("low priority");
		expect(highIdx).toBeLessThan(midIdx);
		expect(midIdx).toBeLessThan(lowIdx);
	});

	test("passes through content without heading when heading is absent", () => {
		const result = compose([{ content: "raw content" }]);
		expect(result).toBe("raw content");
	});

	test("uses custom separator", () => {
		const result = compose(
			[
				{ heading: "A", content: "a" },
				{ heading: "B", content: "b" },
			],
			{ separator: "\n---\n" },
		);
		expect(result).toContain("\n---\n");
	});
});

describe("toolSection", () => {
	test("creates a section with tool heading and composed description", () => {
		const section = toolSection({
			name: "analyze_data",
			composedDescription: "Analyzes input data.\n\nParameters:\n- input: The data",
		});
		expect(section.heading).toBe("Tool: analyze_data");
		expect(section.content).toBe("Analyzes input data.\n\nParameters:\n- input: The data");
	});
});

describe("enumSection", () => {
	test("creates a section with custom heading and enum description", () => {
		const section = enumSection("Severity Levels", {
			composedDescription: '- "high": Critical\n- "low": Minor',
		});
		expect(section.heading).toBe("Severity Levels");
		expect(section.content).toBe('- "high": Critical\n- "low": Minor');
	});
});
