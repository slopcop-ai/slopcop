import type { z } from "zod";

// ─── Branded string types for referential integrity ───

declare const __brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [__brand]: B };

/** A tool name that has been registered in a ToolRegistry. */
export type ToolName<N extends string = string> = Brand<N, "ToolName">;

/** A schema field key known to exist in a specific schema. */
export type FieldRef<K extends string = string> = Brand<K, "FieldRef">;

/** An identifier (rule ID, category ID, etc.) known to exist in a defined set. */
export type Identifier<I extends string = string> = Brand<I, "Identifier">;

// ─── Schema introspection utilities ───

/** Extract the string-literal keys from a ZodObject's shape. */
export type ShapeKeys<T extends z.ZodRawShape> = Extract<keyof T, string>;

/** Extract enum values from a ZodEnum as a union. */
export type EnumValues<T extends z.ZodEnum> = z.infer<T>;

/**
 * Recursively extract all leaf field paths from a ZodObject shape.
 * Produces dotted paths like "address.street" for nested objects.
 */
export type FieldPaths<T extends z.ZodRawShape, Prefix extends string = ""> = {
	[K in Extract<keyof T, string>]: T[K] extends z.ZodObject<infer Inner extends z.ZodRawShape>
		? FieldPaths<Inner, `${Prefix}${K}.`>
		: `${Prefix}${K}`;
}[Extract<keyof T, string>];

// ─── Described enum value type ───

/** A single enum variant with its description for LLM consumption. */
export interface DescribedValue<V extends string = string> {
	readonly value: V;
	readonly description: string;
}

// ─── Tool definition shape ───

export interface ToolDefinition<
	Name extends string = string,
	Schema extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
	Output extends z.ZodType = z.ZodType,
> {
	readonly name: ToolName<Name>;
	readonly description: string;
	readonly inputSchema: Schema;
	readonly outputSchema?: Output | undefined;
	readonly composedDescription: string;
}

// ─── Template literal type for compile-time placeholder checking ───

/**
 * Extracts placeholder names from a template string literal.
 *
 * @example
 * type T = ExtractPlaceholders<"Hello {{name}}, your {{role}}">;
 * //   ^? "name" | "role"
 */
export type ExtractPlaceholders<T extends string> =
	T extends `${string}{{${infer Key}}}${infer Rest}` ? Key | ExtractPlaceholders<Rest> : never;

/**
 * Validates that every placeholder in a template has a corresponding
 * key in the provided variables record, and vice versa.
 * Returns the template string on success, or an error message type on failure.
 */
export type ValidateTemplate<Template extends string, Vars extends Record<string, unknown>> = [
	ExtractPlaceholders<Template>,
] extends [never]
	? [keyof Vars] extends [never]
		? Template
		: `ERROR: unused variables: ${Exclude<Extract<keyof Vars, string>, never>}`
	: ExtractPlaceholders<Template> extends Extract<keyof Vars, string>
		? Extract<keyof Vars, string> extends ExtractPlaceholders<Template>
			? Template
			: `ERROR: unused variables: ${Exclude<Extract<keyof Vars, string>, ExtractPlaceholders<Template>>}`
		: `ERROR: unknown placeholders: ${Exclude<ExtractPlaceholders<Template>, Extract<keyof Vars, string>>}`;
