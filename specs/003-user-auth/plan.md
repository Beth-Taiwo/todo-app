# Implementation Plan: User Authentication & Secure Data Access

**Branch**: `003-user-auth` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-user-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add user account creation, login, logout, and cross-device task sync to the existing Next.js 14 todo app. Authentication is delegated to Firebase Authentication (email/password provider); user task data migrates from device-local `localStorage` to Cloud Firestore, scoped per user. Next.js Middleware enforces route protection server-side. Password reset is handled by Firebase's built-in email link flow.

## Technical Context

**Language/Version**: TypeScript 5.x (existing in project)  
**Primary Dependencies**: Next.js 14.2.35 App Router (existing); Firebase 10.x (`firebase` client SDK + `firebase-admin` for server/middleware); Cloud Firestore for task persistence  
**Storage**: Cloud Firestore (server-side, per-user task collections) + `localStorage` as read-cache only — replaces current localStorage-only persistence  
**Testing**: Vitest 1.6.1 + @testing-library/react 14.x + jsdom 24.x (existing); firebase emulator suite for integration tests  
**Target Platform**: Web application deployed to Vercel (or any Node.js host)  
**Project Type**: Web application (Next.js full-stack)  
**Performance Goals**: Login/register requests complete in < 3 s (SC-004); cross-device task sync visible in ≤ 30 s (SC-003)  
**Constraints**: Rate limiting on auth endpoints; session invalidation on logout; no PII in logs; passwords stored via proven hashing (Firebase handles this); offline queue for task mutations  
**Scale/Scope**: Personal-scale app; single database project; ~5 new source files, ~3 new API routes, ~8 new components

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                           | Status                 | Notes                                                                                                                                                                                                                                                     |
| ----------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Radical Simplicity               | ✅ PASS                | Firebase Auth + Firestore is the simplest proven path: auth, credential storage, hashing, token rotation, and email links are all built-in. Alternatives (custom auth or Auth0) require more integration work without simplicity gains at this scale.     |
| II. Delightful UX                   | ✅ PASS                | Auth forms must show inline validation within 100 ms; error messages must be human-readable (not raw Firebase error codes); loading states required on all async auth actions.                                                                            |
| III. Readability Over Cleverness    | ✅ PASS                | Auth logic is encapsulated in dedicated service modules; component responsibilities are clear. 40-line function limit enforced.                                                                                                                           |
| IV. TDD (NON-NEGOTIABLE)            | ✅ PASS                | Firebase Emulator Suite enables full unit + integration tests for auth flows without hitting production. All auth logic tested before implementation.                                                                                                     |
| V. Accessibility & Inclusivity      | ✅ PASS                | Login/register forms must be keyboard-navigable, have visible focus states, and carry ARIA labels. Error states announced to screen readers.                                                                                                              |
| VI. Secure Auth & Authorization     | ✅ PASS (core feature) | Firebase Auth handles OAuth 2.0-compatible token flow. All task data mutations validated server-side via Firestore Security Rules (not just client claims). Rate limiting enforced. Session tokens invalidated on logout.                                 |
| VII. User Privacy & Data Protection | ✅ PASS                | Firebase encrypts data at rest and in transit (TLS). Only email + tasks are stored — no speculative data. No PII in logs or error messages (raw Firebase errors suppressed).                                                                              |
| VIII. Cross-Device Continuity       | ✅ PASS                | Firestore real-time listeners deliver updates to all authenticated sessions within seconds. localStorage is used only as a client-side read-cache; Firestore is the source of truth. Offline writes queued by Firestore SDK and auto-synced on reconnect. |

**Gate result**: ✅ All principles satisfied — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/003-user-auth/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                   # (existing) wrap with AuthProvider
│   ├── page.tsx                     # (existing) tasks dashboard — protected
│   ├── completed/page.tsx           # (existing) protected
│   ├── archived/page.tsx            # (existing) protected
│   ├── login/page.tsx               # NEW: login form page
│   └── register/page.tsx            # NEW: registration form page
├── components/
│   ├── LoginForm.tsx                # NEW: email/password login form
│   ├── RegisterForm.tsx             # NEW: email/password registration form
│   ├── ResetPasswordForm.tsx        # NEW: password reset request form
│   └── AuthGuard.tsx                # NEW: client-side auth gate wrapper
├── context/
│   ├── TaskContext.tsx              # (existing) migrated to Firestore
│   └── AuthContext.tsx              # NEW: Firebase Auth session provider
├── lib/
│   ├── firebase.ts                  # NEW: Firebase app initialization
│   ├── authService.ts               # NEW: register, login, logout, resetPassword
│   ├── taskService.ts               # NEW: Firestore CRUD for tasks (replaces taskStorage.ts)
│   ├── taskReducer.ts               # (existing) unchanged pure logic
│   ├── taskValidation.ts            # (existing) unchanged
│   └── i18n.ts                      # (existing) extended with auth message keys
├── middleware.ts                    # NEW: Next.js edge middleware for route protection
└── types/
    ├── task.ts                      # (existing) extended with userId field
    └── auth.ts                      # NEW: AuthUser, AuthState types

messages/
└── en.json                          # (existing) extended with auth/error i18n keys

tests/
├── unit/
│   ├── authService.test.ts          # NEW
│   ├── taskService.test.ts          # NEW
│   └── (existing tests unchanged)
├── integration/
│   ├── register.test.tsx            # NEW
│   ├── login.test.tsx               # NEW
│   ├── logout.test.tsx              # NEW
│   └── (existing tests unchanged)
└── contract/
    └── authSchema.test.ts           # NEW: validates User/Session shapes
```

**Structure Decision**: Single Next.js project (Option 1 adapted for web app). Backend logic is implemented via Firestore Security Rules and Next.js API Routes / Middleware — no separate backend process required. This satisfies Constitution Principle I (Radical Simplicity) by avoiding a separate server deployment at this scale.

## Complexity Tracking

> No constitution violations. No complexity justification required.
