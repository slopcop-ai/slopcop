import { registryToMcpTools, toMcpPrompt } from "slopcop/mcp";
import { reviewTools } from "../domain/registry.js";
import { reviewInstruction } from "../prompts/templates.js";

/**
 * MCP-compatible tool definitions, ready to serve from an MCP server.
 *
 * Each tool's JSON Schema is derived from its Zod input schema via
 * Zod 4's native `z.toJSONSchema()` — no external schema converter needed.
 */
export const mcpTools = registryToMcpTools(reviewTools);

/**
 * MCP-compatible prompt definition with typed arguments.
 */
export const mcpReviewPrompt = toMcpPrompt(reviewInstruction);
