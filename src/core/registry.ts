import type { ToolDefinition, ToolName } from "./types.js";

/**
 * A registry that tracks all defined tools, providing compile-time
 * referential integrity for tool names used in prompts and lookup tables.
 *
 * The type parameter `Tools` accumulates registered tool definitions,
 * narrowing the set of valid tool name references with each `.register()` call.
 */
export class ToolRegistry<Tools extends Record<string, ToolDefinition> = Record<string, never>> {
	private tools: Map<string, ToolDefinition> = new Map();

	/** Register a tool. Returns a new registry type that includes it. */
	// biome-ignore lint/suspicious/noExplicitAny: type-level accumulation requires erasing schema generics
	register<T extends ToolDefinition<string, any, any>>(
		tool: T,
	): ToolRegistry<Tools & Record<T["name"] extends ToolName<infer N> ? N : never, T>> {
		this.tools.set(tool.name as string, tool);
		// biome-ignore lint/suspicious/noExplicitAny: safe — runtime identity, only the return type narrows
		return this as any;
	}

	/** Get a tool by name. Compile error if name is not registered. */
	get<N extends Extract<keyof Tools, string>>(name: N): Tools[N] {
		const tool = this.tools.get(name);
		if (!tool) throw new Error(`Tool "${name}" is not registered`);
		return tool as Tools[N];
	}

	/** Type-safe tool name reference constrained to registered tools. */
	nameOf<N extends Extract<keyof Tools, string>>(name: N): ToolName<N> {
		if (!this.tools.has(name)) {
			throw new Error(`Tool "${name}" is not registered`);
		}
		return name as ToolName<N>;
	}

	/** All registered tool names. */
	get names(): Extract<keyof Tools, string>[] {
		return [...this.tools.keys()] as Extract<keyof Tools, string>[];
	}

	/** All registered tool definitions. */
	get all(): ToolDefinition[] {
		return [...this.tools.values()];
	}
}

/** Create a new empty tool registry. */
export function createRegistry(): ToolRegistry {
	return new ToolRegistry();
}
