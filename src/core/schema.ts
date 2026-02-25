import { z } from "zod";
import type { FieldPaths, ShapeKeys } from "./types.js";

// ─── Described Enum Builder ───

/** Return type of describedEnum — a ZodEnum with attached variant metadata. */
export interface DescribedEnumSchema<V extends string> extends z.ZodEnum<[V, ...V[]]> {
	readonly variantDescriptions: ReadonlyMap<V, string>;
	readonly composedDescription: string;
}

/**
 * Creates a Zod enum with per-variant descriptions that automatically
 * compose into the enum-level `.describe()` text.
 *
 * Adding a variant updates the composed description. Removing one causes
 * compile errors at all usage sites.
 *
 * @example
 * const Severity = describedEnum({
 *   high: "Critical issue requiring immediate attention",
 *   medium: "Notable issue that should be addressed",
 *   low: "Minor observation for consideration",
 * });
 */
export function describedEnum<const V extends Record<string, string>>(
	variants: V,
): DescribedEnumSchema<Extract<keyof V, string>> {
	const values = Object.keys(variants) as [Extract<keyof V, string>, ...Extract<keyof V, string>[]];

	const descriptions: ReadonlyMap<Extract<keyof V, string>, string> = new Map(
		Object.entries(variants) as [Extract<keyof V, string>, string][],
	);

	const composedDescription = values.map((v) => `- "${v}": ${variants[v]}`).join("\n");

	const schema = z.enum(values).describe(composedDescription);

	return Object.assign(schema, {
		variantDescriptions: descriptions,
		composedDescription,
	}) as DescribedEnumSchema<Extract<keyof V, string>>;
}

// ─── Schema Field Description Compositor ───

/**
 * Walks a ZodObject's shape and composes a human-readable description
 * from each field's .describe() text.
 */
export function composeFieldDescriptions(schema: z.ZodObject<z.ZodRawShape>, indent = ""): string {
	const shape = schema.shape;
	const lines: string[] = [];

	for (const [key, fieldSchema] of Object.entries(shape)) {
		const field = fieldSchema as z.ZodType;
		const desc = field.description ?? "(no description)";

		if (field instanceof z.ZodObject) {
			lines.push(`${indent}- ${key}: ${desc}`);
			lines.push(composeFieldDescriptions(field, `${indent}  `));
		} else {
			lines.push(`${indent}- ${key}: ${desc}`);
		}
	}

	return lines.join("\n");
}

// ─── Schema Wrapper for Field Reference Extraction ───

/** Return type of defineSchema. */
export interface SchemaDefinition<Name extends string, Shape extends z.ZodRawShape> {
	readonly name: Name;
	readonly schema: z.ZodObject<Shape>;
	readonly keys: ShapeKeys<Shape>[];
	readonly fieldDescriptions: string;
	ref<K extends ShapeKeys<Shape>>(key: K): K;
	path<P extends FieldPaths<Shape>>(path: P): P;
}

/**
 * Wraps a Zod object schema, providing type-safe field reference access.
 *
 * @example
 * const property = defineSchema("property", z.object({
 *   GLA: z.number().describe("Gross Living Area in square feet"),
 *   beds: z.number().int().describe("Number of bedrooms"),
 * }));
 *
 * property.ref("GLA");          // ok
 * property.ref("nonexistent");  // compile error
 */
export function defineSchema<Name extends string, Shape extends z.ZodRawShape>(
	name: Name,
	schema: z.ZodObject<Shape>,
): SchemaDefinition<Name, Shape> {
	const keys = Object.keys(schema.shape) as ShapeKeys<Shape>[];

	return {
		name,
		schema,
		keys,
		fieldDescriptions: composeFieldDescriptions(schema),
		ref: <K extends ShapeKeys<Shape>>(key: K): K => key,
		path: <P extends FieldPaths<Shape>>(path: P): P => path,
	};
}
