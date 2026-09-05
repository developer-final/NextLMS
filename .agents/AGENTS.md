# E-Learning Platform - Rules & Codebase Exploration Guide

This repository contains the **World Trading Lab E-Learning Platform**, built with Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma ORM, and NextAuth.js.

---

## 1. Codebase Knowledge Graph (`codebase-memory-mcp`)

This project is indexed into the `codebase-memory-mcp` knowledge graph. All AI agents and LLMs **MUST prioritize using MCP graph tools** over raw grep/glob/file-search for code discovery, architecture analysis, route mapping, and relationship tracing.

### Project Discovery & Identifier
* Do not hardcode project slugs as directory paths vary across clone/deployment environments.
* When `codebase-memory-mcp` is available, agents MUST first run `list_projects` (or `index_status`) to dynamically discover the matching project slug for the current workspace.
* Pass the discovered project slug to subsequent MCP tool calls.

### Tool Usage & Exploration Workflow

1. **Architecture & Structure Overview:**
   * Run `get_architecture(project="<project_slug>", aspects=["all"])` to understand entry points, module boundaries, layers, and technologies.

2. **Finding Symbols, Routes, and Components:**
   * Use `search_graph(project="<project_slug>", name_pattern="<Pattern>")` to locate:
     - Pages & Layouts (`src/app/**`)
     - API Route Handlers (`src/app/api/**`)
     - UI & Reusable Components (`src/components/**`)
     - Helper utilities & Database clients (`src/lib/**`)

3. **Tracing Calls & Data Flow:**
   * Use `trace_path(project="<project_slug>", function_name="<FunctionOrMethod>", direction="inbound" | "outbound")` to trace:
     - Who calls an API route or server helper (`inbound`).
     - What database models, services, or endpoints a component invokes (`outbound`).

4. **Reading Code Snippets & Definitions:**
   * Use `get_code_snippet(project="<project_slug>", qualified_name="<QualifiedSymbol>")` to retrieve exact function or class source code without reading entire files.

5. **Re-Indexing / Updating Graph:**
   * When new files or routes are added, run `detect_changes` or `index_repository(repo_path=".", mode="full")` to keep the knowledge graph in sync.

### Fallback to Grep/File View
Only fall back to `grep_search` or `view_file` when:
* Searching for exact raw text strings, CSS utility classes, or error messages.
* Reading non-code configuration files (`.env`, `package.json`, `tsconfig.json`, `prisma/schema.prisma`).
* Graph tools report skipped or parse-partial line ranges.

---

## 2. Tech Stack & Key Directories

* **Framework:** Next.js 15 (App Router), React 18, TypeScript.
* **Database & ORM:** Prisma ORM (`prisma/schema.prisma`), PostgreSQL (Supabase / Self-hosted Postgres).
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

6. **Database Schema Changes & Mandatory Migrations:**
   - As this project is open-source with multiple production and self-hosted deployments, **ANY change to `prisma/schema.prisma` MUST be accompanied by an official Prisma migration**.
   - **NEVER** rely solely on `prisma db push` or unversioned schema edits. Bypassing migrations causes schema drift, breaking upgrades for existing instances.
   - Always generate migrations using `npm run db:migrate:dev` or `npx prisma migrate dev --name <migration_name>`.
   - All generated migration files inside `prisma/migrations/` MUST be committed to git alongside `schema.prisma`.

7. **Core Dev Rules for Upgrade & Backward Compatibility:**
   - **Non-Destructive Schema Evolution:**
     - When adding new columns to existing populated tables, the column MUST either be optional (`Type?`) or have an explicit default value (`@default(...)`). Never add a `NOT NULL` column without a default to avoid breaking live instances during migration.
   - **Expand & Contract Pattern for Breaking Changes:**
     - Never abruptly drop or rename active columns or tables.
     - *Phase 1 (Expand):* Add the new column/model alongside the legacy one. Ensure application code reads from both with a fallback.
     - *Phase 2 (Migrate):* Populate the new structure and keep data synchronized.
     - *Phase 3 (Contract):* Deprecate and only drop the legacy column in a subsequent major release.
   - **Production Deployment Safety:**
     - Customer and production instances apply database updates exclusively via `npm run db:migrate:deploy` (`prisma migrate deploy`). Migrations must be completely non-interactive and idempotent.
     - Production deployment scripts (`scripts/deploy-docker.sh` and `scripts/deploy-vps.sh`) and container runtime (`docker-entrypoint.sh`) ALWAYS execute database migrations prior to building or launching the new application version.
   - **Complex Data Migrations:**
     - If a feature requires transforming existing data records, write a dedicated, idempotent script under `scripts/` and document the upgrade instructions in the release changelog.

8. **Strict Server-Side Authorization & RBAC:**
   - Every API route and Server Component/Action dealing with administrative or sensitive functionality (e.g., `src/app/api/admin/*`, `src/app/admin/*`) MUST verify user authentication and required roles (`ADMIN` or `SUPER_ADMIN`) using `getServerSession(authOptions)`.
   - NEVER rely solely on client-side conditional UI rendering (e.g. hiding buttons or tabs) to protect sensitive actions or endpoints.

9. **Environment Variables & Open-Source Cleanliness:**
   - Any new feature introducing external services or configurations MUST add descriptive placeholder keys and documentation to `.env.example`.
   - NEVER hardcode secrets, API credentials, or private URLs in client or server code.
   - NEVER commit `.env`, `.env.*.local`, or any private credential files to version control.

10. **Safe API Error Handling & Standards:**
    - Always return appropriate HTTP status codes (`400`, `401`, `403`, `404`, `500`).
    - Never expose raw Prisma database errors, internal system stack traces, or underlying server infrastructure details to API clients in production responses.



