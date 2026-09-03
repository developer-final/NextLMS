# E-Learning Platform - Rules & Codebase Exploration Guide

This repository contains the **World Trading Lab E-Learning Platform**, built with Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma ORM, and NextAuth.js.

---

## 1. Codebase Knowledge Graph (`codebase-memory-mcp`)

This project is indexed into the `codebase-memory-mcp` knowledge graph. All AI agents and LLMs **MUST prioritize using MCP graph tools** over raw grep/glob/file-search for code discovery, architecture analysis, route mapping, and relationship tracing.

### Project Identifier
* **MCP Project Slug:** `C-Users-enzii-Desktop-Working-eLearning`
* When calling MCP tools, always pass `project: "C-Users-enzii-Desktop-Working-eLearning"` (or verify with `list_projects`).

### Tool Usage & Exploration Workflow

1. **Architecture & Structure Overview:**
   * Run `get_architecture(project="C-Users-enzii-Desktop-Working-eLearning", aspects=["all"])` to understand entry points, module boundaries, layers, and technologies.

2. **Finding Symbols, Routes, and Components:**
   * Use `search_graph(project="C-Users-enzii-Desktop-Working-eLearning", name_pattern="<Pattern>")` to locate:
     - Pages & Layouts (`src/app/**`)
     - API Route Handlers (`src/app/api/**`)
     - UI & Reusable Components (`src/components/**`)
     - Helper utilities & Database clients (`src/lib/**`)

3. **Tracing Calls & Data Flow:**
   * Use `trace_path(project="C-Users-enzii-Desktop-Working-eLearning", function_name="<FunctionOrMethod>", direction="inbound" | "outbound")` to trace:
     - Who calls an API route or server helper (`inbound`).
     - What database models, services, or endpoints a component invokes (`outbound`).

4. **Reading Code Snippets & Definitions:**
   * Use `get_code_snippet(project="C-Users-enzii-Desktop-Working-eLearning", qualified_name="<QualifiedSymbol>")` to retrieve exact function or class source code without reading entire files.

5. **Re-Indexing / Updating Graph:**
   * When new files or routes are added, run `detect_changes` or `index_repository(repo_path="...", mode="full")` to keep the knowledge graph in sync.

### Fallback to Grep/File View
Only fall back to `grep_search` or `view_file` when:
* Searching for exact raw text strings, CSS utility classes, or error messages.
* Reading non-code configuration files (`.env`, `package.json`, `tsconfig.json`, `prisma/schema.prisma`).
* Graph tools report skipped or parse-partial line ranges.

---

## 2. Tech Stack & Key Directories

* **Framework:** Next.js 15 (App Router), React 18, TypeScript.
* **Database & ORM:** Prisma ORM (`prisma/schema.prisma`), SQLite (`prisma/dev.db`).
* **Authentication:** NextAuth.js (`src/lib/auth.ts`, `src/app/api/auth/[...nextauth]`).
* **Styling & UI:** Tailwind CSS v3 (`tailwind.config.ts`, `src/app/globals.css`), Lucide React icons, Sonner toast notifications.
* **Directory Structure:**
  - `src/app/`: Next.js App Router pages, layouts, and API routes (`/api/*`).
  - `src/app/admin/*`: Admin management dashboard (courses, orders, students).
  - `src/app/courses/*`, `src/app/learn/*`: Course catalog and interactive learning portal.
  - `src/components/`: Modular React components (`cards/`, `layout/`, `learn/`, `providers/`, `ui/`).
  - `src/lib/`: Shared utilities (`prisma.ts`, `auth.ts`, `utils.ts`, `vietqr.ts`).
  - `prisma/`: Prisma schema, migrations, and seed scripts.

---

## 3. Engineering & Code Quality Rules

1. **Strict TypeScript & Type Safety:**
   - Always define explicit types/interfaces for props and API payloads.
   - Never use `any` unless strictly required for external untyped libraries.
   - Always run `npx tsc --noEmit` before concluding work to guarantee zero type errors.

2. **Clean Minimal Code:**
   - Write minimum code that solves the problem. No speculative features or redundant abstractions.
   - Preserve existing project style, comments, and structure.

3. **Theme & CSS Integrity:**
   - Use the established dark-theme palette (slate-950 background, brand emerald accents, gold accents, glassmorphism).
   - Ensure responsive layout across mobile and desktop.

4. **Mandatory English in Code & Comments:**
   - All source code, identifiers (functions, variables, classes, interfaces, types), comments, docstrings, and console logs MUST be written in English.
   - Never write comments or code strings in Vietnamese.
   - Backend API route error and success responses (`NextResponse.json`) MUST use standardized English by default.

5. **Centralized i18n Dictionary for All Messages & Notifications:**
   - ALL user-facing messages, toasts (`toast.success`, `toast.error`, `toast.info`), confirm dialogs (`confirm(...)`), and dynamic labels MUST use the centralized dictionary lookup `t.<module>.<key>` via `const { t } = useLanguage()`.
   - NEVER use inline ternary checks (e.g., `language === "en" ? ... : ...` or `language === "vi" ? ... : ...`) inside page components or handlers.
   - When adding new messages, declare their keys in `DictionaryType` (`src/lib/i18n/types.ts`) and provide translations across all language dictionary files (`src/lib/i18n/en.ts`, `src/lib/i18n/vi.ts`, etc.) to guarantee seamless scalability for 15+ languages.
