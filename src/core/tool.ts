import type { z } from "zod";
import { composeFieldDescriptions } from "./schema.js";
import type { ShapeKeys, ToolDefinition, ToolName } from "./types.js";

/** Extended tool definition with helper methods. */
export interface ToolDef<
	Name extends string,
	Shape extends z.ZodRawShape,
	Output extends z.ZodType = z.ZodVoid,
> extends ToolDefinition<Name, z.ZodObject<Shape>, Output> {
	readonly toolName: ToolName<Name>;
	readonly inputKeys: ShapeKeys<Shape>[];
	inputRef<K extends ShapeKeys<Shape>>(key: K): K;
	parseInput(input: unknown): z.infer<z.ZodObject<Shape>>;
}

/**
 * Defines a tool with a Zod input schema. The tool name becomes a branded
 * ToolName type, and the description is auto-composed from field descriptions
 * unless explicitly overridden.
 *
 * @example
 * const reportBias = defineTool({
 *   name: "report_bias_findings",
 *   description: "Reports potential bias findings.",
 *   inputSchema: z.object({
 *     biasType: BiasType,
 *     explanation: z.string().describe("Detailed explanation"),
 *   }),
 * });
 *
 * reportBias.toolName;             // ToolName<"report_bias_findings">
 * reportBias.inputRef("biasType"); // ok
 * reportBias.inputRef("nope");     // compile error
 */
export function defineTool<
	const Name extends string,
	Shape extends z.ZodRawShape,
	Output extends z.ZodType = z.ZodVoid,
>(config: {
	name: Name;
	description: string;
	inputSchema: z.ZodObject<Shape>;
	outputSchema?: Output;
}): ToolDef<Name, Shape, Output> {
	const fieldDesc = composeFieldDescriptions(config.inputSchema);
	const composedDescription = `${config.description}\n\nParameters:\n${fieldDesc}`;

	return {
		name: config.name as ToolName<Name>,
		description: config.description,
		inputSchema: config.inputSchema,
		outputSchema: config.outputSchema,
		composedDescription,
		toolName: config.name as ToolName<Name>,
		inputKeys: Object.keys(config.inputSchema.shape) as ShapeKeys<Shape>[],
		inputRef: <K extends ShapeKeys<Shape>>(key: K): K => key,
		parseInput: (input: unknown) => config.inputSchema.parse(input),
	};
}
