# SMC Project Rules & OKF Knowledge Graph Maintenance

This project maintains an Open Knowledge Format (OKF) Knowledge Graph inside the `Knowledge/` directory. 

## Rules for Agents / LLMs

1. **Rely on OKF first**: Before starting any task, read `Knowledge/index.md` to understand the codebase architecture, modules, and concepts.
2. **Maintain the Knowledge Graph**: Whenever you modify code, add new features, or create new modules:
   - **Spec Standard**: Refer to [OKF Specification](../Knowledge/specs.md) for the formatting templates, version rules, and YAML frontmatter fields.
   - **Original Spec**: Follow the [GCP OKF v1.0.0 Specification](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md).
   - **Relative Links Only**: You **MUST** use relative paths for all links between markdown files inside the `Knowledge/` directory and `.agents/AGENTS.md`. Never use absolute paths (such as `file:///C:/Users/...`) as they break portability across different machines.
   - **Resource Path Convention**: For the `resource:` field in OKF YAML frontmatter, you **MUST** use a relative path from the current `.md` file to the target source file (e.g., `../../Modules/Core.mqh`). Do NOT use `file://` or absolute paths.
   - **New Modules (Git Tracking)**: The system tracks all text source files managed by Git (not ignored by `.gitignore`). When you create a new source code file, you **MUST** create a corresponding concept file in `Knowledge/modules/` or `Knowledge/tools/` using the templates in `specs.md`. The `UpdateKnowledge.py` script will warn about missing OKF files for tracked text files during build.
   - **Concept updates**: If you add new trading logic or change parameters (e.g., scoring rules, recovery formulas), you **MUST** update the corresponding files under `Knowledge/concepts/`.
   - **Index updates**: Ensure new files are added to the corresponding category index (e.g., `Knowledge/modules/index.md` or `Knowledge/concepts/index.md`).
3. **Compile and Run Auto-Update**:
   - Always execute `Build.bat` after finishing a task to verify compilation.
   - Successful compilation automatically triggers `Scripts/UpdateKnowledge.py`, which rebuilds the dependency graph in `Knowledge/architecture/dependency-graph.md` and appends to the change log.
4. **Manual Enrichment**:
   - After running the auto-update script, check the generated differences and manually document any new functions, classes, or design trade-offs in the respective `modules/` or `concepts/` files.

## Rules for Code Discovery & MCP Usage

1. **Mandatory MCP Priority**: You **MUST** prioritize using `codebase-memory-mcp` tools (`search_graph`, `trace_path`, `get_code_snippet`, `get_architecture`, etc.) for all code discovery, class/method lookup, and relationship tracing. Do NOT bypass these tools by using raw grep or glob searches unless the MCP server is unavailable or fails.
2. **Project Parameter Discovery**: The MCP tools are case-sensitive and require a `project` parameter (the unique slug of the workspace). Before executing queries, you **MUST** run the `list_projects` tool to find the correct slug (e.g. `C-Users-enzii-Desktop-Working-SMC`) and use it exactly.
3. **Trace and Verify**: When looking at class boundaries or method interactions, trace the control paths using `trace_path` instead of guessing or scanning raw files manually.

