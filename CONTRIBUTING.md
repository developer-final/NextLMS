# Contributing Guidelines — NextLMS

Thank you for your interest in contributing to **NextLMS**! Community contributions are welcome to make this platform the best open-source LMS solution for creators, academies, and educators.

---

## 🛠️ Development Workflow

### 1. Prerequisites
- **Node.js**: version 20.x or later (Node 22+ recommended)
- **NPM**: version 9.x or later
- **Database**: SQLite (for local zero-config dev) or PostgreSQL (for production-like testing)

### 2. Getting Started
```bash
# 1. Clone your fork
git clone https://github.com/YOUR_USERNAME/elearning-platform.git
cd elearning-platform

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env

# 4. Push database schema & seed initial demo data
npx prisma db push
node prisma/seed.js

# 5. Start development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📋 Coding Standards & Rules

1. **Mandatory English**:
   - All source code, identifiers (functions, variables, classes), docstrings, and commit messages MUST be written in English.
2. **Type Safety**:
   - Write strict TypeScript with explicit interfaces and types.
   - Avoid `any` unless strictly necessary.
   - Run `npm run type-check` before submitting any PR.
3. **i18n Centralization**:
   - All user-facing strings and toast messages must be defined in `src/lib/i18n/types.ts` and translated across `vi.ts` and `en.ts`.
   - Never hardcode user-facing texts directly inside component JSX.
4. **Testing**:
   - Unit tests are run using Vitest: `npm test`.
   - Ensure all existing test cases pass before opening a PR.

---

## 🚀 Quality Checks Before Submitting a PR

Run the local CI pipeline command:
```bash
npm run ci
```
This runs:
- `npm run db:generate` (Prisma client)
- `npm run type-check` (`tsc --noEmit`)
- `npm run lint` (Next.js ESLint)
- `npm test` (Vitest suites)

---

## 💡 Commercial Support & Custom Feature Requests

Need custom plugin development, white-label UI redesign, or managed enterprise deployment?
Please reach out to our service team:
- **Telegram**: [https://t.me/trading_world_support](https://t.me/trading_world_support)
- **Zalo**: [+84971929521](https://zalo.me/84971929521)
