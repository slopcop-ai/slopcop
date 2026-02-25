# Research

Background research informing the design of `strongly-skilled`.

## Contents

| Document | Description |
|----------|-------------|
| [Problem Taxonomy](./problem-taxonomy.md) | Six categories of prompt-code drift, with concrete evidence from production codebases |
| [Prior Art](./prior-art.md) | Survey of existing typed/structured prompt engineering approaches |
| [MCP Analysis](./mcp-analysis.md) | Analysis of the Model Context Protocol specification's type safety gaps |
| [Citations](./citations.md) | Complete bibliography of referenced works |

## Methodology

Problems were identified through manual code audit of a production LLM workflow codebase (valara-4) containing multi-step appraisal review agents with Zod schemas, tool definitions, and system prompts. Prior art was surveyed from published libraries, specifications, and academic papers. The intersection of observed problems and existing solution gaps defines the design space for this library.
