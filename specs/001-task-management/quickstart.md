# Quickstart: Task Management Web App

**Branch**: `001-task-management` | **Date**: 2026-03-11

---

## Prerequisites

| Tool    | Minimum version | Check            |
| ------- | --------------- | ---------------- |
| Node.js | 20.x LTS        | `node --version` |
| npm     | 10.x            | `npm --version`  |

---

## 1. Create the Next.js project

```bash
# From the repository root
npx create-next-app@14 . \
  --typescript \
  --eslint \
  --no-tailwind \
  --src-dir \
  --app \
  --import-alias "@/*" \
  --no-experimental-app
```

> `--no-tailwind` keeps dependencies minimal (Constitution Principle I).  
> `--src-dir` places source under `src/` matching the layout in `plan.md`.  
> `--app` enables the App Router (required for the three-route view structure).

---

## 2. Install test dependencies

```bash
npm install --save-dev vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom
```

---

## 3. Configure Vitest

Add `vitest.config.ts` at the repository root:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

Add `tests/setup.ts`:

```typescript
import "@testing-library/jest-dom";
```

Add test scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

---

## 4. Create the design token file

Create `src/styles/tokens.css`:

```css
:root {
  /* Colour palette */
  --color-bg: #ffffff;
  --color-surface: #f9fafb;
  --color-border: #e5e7eb;
  --color-text-primary: #111827;
  --color-text-muted: #6b7280;
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-danger: #dc2626;
  --color-success: #16a34a;

  /* Spacing scale (4 px base) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --leading-normal: 1.5;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;

  /* Touch targets */
  --min-tap-target: 44px;
}
```

---

## 5. Directory scaffold

Create the required directories before implementation begins:

```bash
mkdir -p src/app/completed src/app/archived \
         src/components src/context src/lib src/styles src/types \
         tests/unit tests/integration tests/contract
```

---

## 6. Run the development server

```bash
npm run dev
# App available at http://localhost:3000
```

---

## 7. Run the test suite

```bash
# All tests (must all pass before any PR)
npm test

# Watch mode during TDD
npm run test:watch
```

---

## 8. Implementation order (matches tasks.md phases)

Follow this order to enable independently testable increments:

1. **Types & validation** (`src/types/task.ts`, `src/lib/taskValidation.ts`) — pure; testable immediately
2. **Reducer** (`src/lib/taskReducer.ts`) — pure; testable immediately
3. **Storage helpers** (`src/lib/taskStorage.ts`) — localStorage read/write
4. **Context provider** (`src/context/TaskContext.tsx`) — wires reducer + storage
5. **Nav component** (`src/components/Nav.tsx`) — tab navigation
6. **TaskForm** (`src/components/TaskForm.tsx`) + **TaskItem** + **TaskList** + **ConfirmAction**
7. **Pages** (`src/app/page.tsx`, `completed/page.tsx`, `archived/page.tsx`)
8. **CSS Modules** per component (design tokens imported; no magic numbers)

> Write the failing test first for each item above, then implement. See Constitution
> Principle IV (TDD — NON-NEGOTIABLE).
