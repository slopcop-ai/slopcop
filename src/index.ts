export {
	// Schema utilities
	describedEnum,
	composeFieldDescriptions,
	defineSchema,
	// Tool definition
	defineTool,
	// Registry
	ToolRegistry,
	createRegistry,
	// Lookup tables
	defineLookup,
	// Prompt templates
	definePrompt,
	defineSchemaPrompt,
	defineSystemPrompt,
	// Composition
	compose,
	toolSection,
	enumSection,
} from "./core/index.js";

export type {
	// Brand types
	Brand,
	ToolName,
	FieldRef,
	Identifier,
	// Schema introspection
	ShapeKeys,
	EnumValues,
	FieldPaths,
	DescribedValue,
	// Definition types
	ToolDefinition,
	DescribedEnumSchema,
	SchemaDefinition,
	ToolDef,
	TypedLookup,
	// Prompt types
	TypedPrompt,
	SchemaPrompt,
	SchemaPromptError,
	SystemPromptHelpers,
	SystemPrompt,
	PromptSection,
	// Template literal utilities
	ExtractPlaceholders,
	ValidateTemplate,
} from "./core/index.js";
