/** A section of a composed prompt. */
export interface PromptSection {
  readonly heading?: string;
  readonly content: string;
  readonly priority?: number;
}

/**
 * Composes multiple prompt sections into a single string with
 * optional section headers and separators.
 *
 * Sections are sorted by priority (higher first). Headings are
 * formatted according to the specified style.
 */
export function compose(
  sections: PromptSection[],
  options?: {
    separator?: string;
    headingStyle?: "markdown" | "xml" | "plain";
  },
): string {
  const sep = options?.separator ?? "\n\n";
  const style = options?.headingStyle ?? "markdown";

  const sorted = [...sections].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  );

  return sorted
    .map((s) => {
      if (!s.heading) return s.content;
      switch (style) {
        case "markdown":
          return `## ${s.heading}\n${s.content}`;
        case "xml":
          return `<${s.heading}>\n${s.content}\n</${s.heading}>`;
        case "plain":
          return `${s.heading}:\n${s.content}`;
      }
    })
    .join(sep);
}

/**
 * Builds a prompt section from a tool's composed description.
 * Ensures the prompt always reflects the actual schema.
 */
export function toolSection(tool: {
  name: string;
  composedDescription: string;
}): PromptSection {
  return {
    heading: `Tool: ${tool.name}`,
    content: tool.composedDescription,
  };
}

/**
 * Builds a prompt section from a described enum's composed description.
 */
export function enumSection(
  heading: string,
  enumSchema: { composedDescription: string },
): PromptSection {
  return {
    heading,
    content: enumSchema.composedDescription,
  };
}
