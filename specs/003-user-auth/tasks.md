# Tasks: User Authentication & Secure Data Access

**Input**: Design documents from `/specs/003-user-auth/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-routes.md ✅, contracts/auth-context.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths are included in every description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Firebase dependencies and configure local development tooling

- [x] T001 Install `firebase` (client SDK 10.x) and `firebase-admin` (server SDK) via `npm install firebase firebase-admin`
- [x] T002 [P] Create `.env.local.example` documenting all required env vars: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`
- [x] T003 [P] Configure Firebase Emulator Suite in `firebase.json` and `.firebaserc` — enable Auth and Firestore emulators on ports 9099 and 8080

**Checkpoint**: Firebase SDK installed; emulators runnable with `firebase emulators:start`

---

## Phase 2: Foundational — Types, Firebase Init & i18n (Blocking)

**Purpose**: Core shared primitives that ALL user stories depend on. No user story work can begin until this phase is complete.

- [x] T004 Create `src/types/auth.ts` — define `AuthUser { uid: string; email: string }`, `AuthState` union (`{ status: "loading" } | { status: "unauthenticated" } | { status: "authenticated"; user: AuthUser }`), and `AuthError { code: string; message: string }`
- [x] T005 [P] Extend `src/types/task.ts` — add `userId: string` and `updatedAt: number` (epoch ms) fields to the `Task` type
- [x] T006 Create `src/lib/firebase.ts` — initialize Firebase app (guard against re-init), export `auth` (getAuth) and `db` (getFirestore) instances; connect to emulators when `process.env.NODE_ENV === "development"` using `connectAuthEmulator` and `connectFirestoreEmulator`
- [x] T007 [P] Add auth i18n keys to `messages/en.json` — add `auth.register.*`, `auth.login.*`, `auth.logout.*`, `auth.forgotPassword.*`, `auth.errors.emailInUse`, `auth.errors.invalidEmail`, `auth.errors.weakPassword`, `auth.errors.invalidCredentials`, `auth.errors.generic` keys
- [x] T008 [P] Create `tests/contract/authSchema.test.ts` — validate `AuthUser` shape, `AuthState` discriminated union, and extended `Task` type (confirm `userId` and `updatedAt` are present and correctly typed)

**Checkpoint**: Foundation complete — types, Firebase init, i18n keys, and contract tests in place

---

## Phase 3: US1 — New User Registration (P1) 🎯 MVP

**Goal**: A visitor can create an account with email and password and is redirected to the task dashboard.

**Independent Test**: Navigate to `/register` → fill in valid email + password → submit → land on `/` (task dashboard with empty task list).

### Tests for User Story 1

- [x] T009 [P] [US1] Write `tests/integration/register.test.tsx` — cover: successful registration lands on `/`, duplicate email shows `auth.errors.emailInUse`, weak password shows `auth.errors.weakPassword`, invalid email format shows inline error, form fields have correct ARIA labels

### Implementation for User Story 1

- [x] T010 [P] [US1] Create `src/app/api/auth/session/route.ts` — POST handler: receive `{ idToken }` body, verify with Admin SDK `verifyIdToken(idToken)`, mint HTTP-only `__session` cookie (7-day expiry) via `createSessionCookie()`, return `{ uid, email }` or 401/500
- [x] T011 [US1] Create `src/lib/authService.ts` — implement `register(email: string, password: string): Promise<AuthUser>`: call `createUserWithEmailAndPassword(auth, email, password)`, obtain `idToken` via `getIdToken()`, POST to `/api/auth/session`, return `AuthUser`; map Firebase error codes to `AuthError` with i18n message keys
- [x] T012 [P] [US1] Create `src/context/AuthContext.tsx` — `AuthProvider` component: listen to `onAuthStateChanged`, expose `AuthState` and `register`, `login`, `logout`, `sendPasswordReset` methods; initialize with `{ status: "loading" }`
- [x] T013 [P] [US1] Create `src/components/RegisterForm.tsx` — email and password fields with inline validation (password min 8 chars + 1 digit or symbol), accessible labels and `aria-describedby` error messages, calls `authContext.register()` on submit, shows loading state during submission
- [x] T014 [US1] Create `src/app/register/page.tsx` — public page rendering `<RegisterForm />`, redirect to `/` on success, link to `/login`
- [x] T015 [US1] Update `src/app/layout.tsx` — wrap root layout children with `<AuthProvider>` from `src/context/AuthContext.tsx`
- [x] T016 [P] [US1] Create `src/components/AuthGuard.tsx` — reads `authState`: render loading spinner when `status === "loading"`, redirect to `/login` when `status === "unauthenticated"`, render `children` when `status === "authenticated"`; apply to `src/app/page.tsx`, `src/app/completed/page.tsx`, `src/app/archived/page.tsx`

**Checkpoint**: Registration works end-to-end. User can create account and reach the task dashboard.

---

## Phase 4: US2 — Returning User Login (P1) 🎯 MVP

**Goal**: A registered user can log in with their credentials and see their task dashboard.

**Independent Test**: Navigate to `/login` → enter valid credentials → land on `/` with task list visible. Entering wrong password shows error. Visiting `/` without a session redirects to `/login`.

### Tests for User Story 2

- [x] T017 [P] [US2] Write `tests/integration/login.test.tsx` — cover: valid credentials redirect to `/`, wrong password shows `auth.errors.invalidCredentials`, nonexistent email shows same generic error (no enumeration), unauthenticated direct navigation to `/` redirects to `/login`

### Implementation for User Story 2

- [x] T018 [US2] Add `login(email: string, password: string): Promise<AuthUser>` to `src/lib/authService.ts` — call `signInWithEmailAndPassword(auth, email, password)`, obtain `idToken`, POST to `/api/auth/session`, return `AuthUser`; map errors to `AuthError` with i18n keys
- [x] T019 [P] [US2] Create `src/app/api/auth/me/route.ts` — GET handler: read `__session` cookie, call `verifySessionCookie(cookie, true)` via Admin SDK, return `{ uid, email }` or 401
- [x] T020 [P] [US2] Create `src/components/LoginForm.tsx` — email and password fields, error display using `AuthError.message` (i18n key value), "Forgot password?" link to `/forgot-password`, calls `authContext.login()` on submit, shows loading state
- [x] T021 [US2] Create `src/app/login/page.tsx` — public page rendering `<LoginForm />`, redirect to `/` on success, link to `/register`
- [x] T022 [US2] Create `src/middleware.ts` — Next.js middleware: read `__session` cookie from request, call Admin SDK `verifySessionCookie(cookie, true)` for all protected routes (`/`, `/completed`, `/archived`); redirect to `/login` on missing or invalid cookie; pass through auth routes (`/login`, `/register`, `/api/auth/*`)

**Checkpoint**: Login flow complete. Auth middleware protects all task routes. Both P1 stories fully functional.

---

## Phase 5: US3 — User Logout (P2)

**Goal**: A logged-in user can log out; the session cookie is revoked server-side and direct URL access to protected routes redirects to `/login`.

**Independent Test**: While logged in, click logout → redirected to `/login`. Manually navigating to `/` shows `/login`.

### Tests for User Story 3

- [x] T023 [P] [US3] Write `tests/integration/logout.test.tsx` — cover: logout clears session and redirects to `/login`, protected route navigation after logout redirects to `/login`, calling logout when already logged out is a no-op (safe)

### Implementation for User Story 3

- [x] T024 [US3] Create `src/app/api/auth/logout/route.ts` — POST handler: read `__session` cookie, call Admin SDK `revokeRefreshTokens(uid)`, clear the `__session` cookie (Set-Cookie with maxAge=0), return 200; return 401 if no cookie present
- [x] T025 [US3] Add `logout(): Promise<void>` to `src/lib/authService.ts` — POST to `/api/auth/logout`, then call `signOut(auth)` client-side to clear local auth state
- [x] T026 [P] [US3] Update `src/components/Nav.tsx` — when `authState.status === "authenticated"`, show user's email and a logout button that calls `authContext.logout()` and redirects to `/login`; when unauthenticated, show nothing (middleware handles redirect)

**Checkpoint**: Logout flow complete. Session revoked server-side; middleware blocks re-entry.

---

## Phase 6: US4 — Cross-Device Task Access / Firestore Migration (P2)

**Goal**: All task mutations are persisted to Firestore under `/users/{uid}/tasks/{taskId}`. Real-time sync means changes on one device appear on another within 30 seconds. No user can read or write another user's tasks.

**Independent Test**: Log in on device A → create a task → log in same account on device B → task is visible within 30 seconds. Log in as a different user → task list is empty (Firestore rules enforce isolation).

### Tests for User Story 4

- [x] T027 [P] [US4] Write `tests/unit/taskService.test.ts` — cover: `createTask` writes to correct Firestore path scoped to userId, `getTasks` returns only the requesting user's tasks, `updateTask` and `deleteTask` are scoped to userId, tasks are inaccessible when called with a different userId

### Implementation for User Story 4

- [x] T028 [US4] Create `src/lib/taskService.ts` — implement `createTask(userId, data)`, `getTasks(userId, onUpdate: (tasks: Task[]) => void)` using `onSnapshot` for real-time listening, `updateTask(userId, taskId, patch)`, `deleteTask(userId, taskId)` — all operations target `/users/{userId}/tasks/{taskId}` Firestore path
- [x] T029 [P] [US4] Create `firestore.rules` — Firestore Security Rules: `match /users/{userId}/tasks/{taskId} { allow read, write: if request.auth != null && request.auth.uid == userId; }` — deny all other paths
- [x] T030 [US4] Migrate `src/context/TaskContext.tsx` — replace all `taskStorage.ts` calls with `taskService.ts`; subscribe to `authState` changes (start `onSnapshot` listener when authenticated, unsubscribe and clear tasks on logout); remove localStorage dependency for task persistence
- [x] T031 [P] [US4] Implement anonymous task import prompt in `src/context/TaskContext.tsx` — on first login, check localStorage for pre-auth tasks; if found, show one-time confirmation prompt in the UI; on confirm, batch-write tasks to Firestore and set `localStorage.setItem("todo-app:imported", "true")`; on decline, clear localStorage tasks

**Checkpoint**: All tasks persisted in Firestore with real-time sync. Data isolation enforced by Security Rules.

---

## Phase 7: US5 — Password Reset (P3)

**Goal**: A user who forgot their password can request a reset email and set a new password via the link. No user enumeration — response is always neutral.

**Independent Test**: Navigate to `/forgot-password` → submit any email → see neutral success message (no indication if email exists). Click emulator mail link → `/reset-password?oobCode=...` → enter new password → redirect to `/login`.

### Tests for User Story 5

- [x] T032 [P] [US5] Write `tests/unit/authService.test.ts` — cover: `register()` success path, `login()` success path, `sendPasswordReset()` always resolves without exposing whether email exists, `logout()` calls POST /api/auth/logout

### Implementation for User Story 5

- [x] T033 [US5] Add `sendPasswordReset(email: string): Promise<void>` to `src/lib/authService.ts` — call `sendPasswordResetEmail(auth, email)`, swallow any error (do not reject — neutral response regardless of whether email is registered)
- [x] T034 [P] [US5] Create `src/components/ForgotPasswordForm.tsx` — email field, submit calls `authContext.sendPasswordReset(email)`, always shows a neutral success message after submission (e.g. `auth.forgotPassword.sent` i18n key); accessible with ARIA live region for status message
- [x] T035 [US5] Create `src/app/forgot-password/page.tsx` — public page rendering `<ForgotPasswordForm />`, link back to `/login`
- [x] T036 [P] [US5] Create `src/components/ResetPasswordForm.tsx` — reads `oobCode` from `useSearchParams()`, new password field with same validation rules (min 8 chars + 1 digit or symbol), calls Firebase `confirmPasswordReset(auth, oobCode, newPassword)` on submit
- [x] T037 [US5] Create `src/app/reset-password/page.tsx` — public page rendering `<ResetPasswordForm />`, redirect to `/login` with success message on completion; handle invalid/expired `oobCode` with error message

**Checkpoint**: All 5 user stories implemented and independently testable.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T038 [P] Run full test suite (`npm test`) — fix any failures introduced by Firestore migration or new auth components; confirm all 62 existing tests still pass alongside new auth tests
- [x] T039 [P] Deploy Firestore Security Rules — run `firebase deploy --only firestore:rules` and confirm rules are live in Firebase console
- [x] T040 Run `next build` — verify zero TypeScript errors and no build failures across all new pages and components
- [x] T041 [P] Update `README.md` — add "Authentication Setup" section documenting Firebase project creation, required env variables (reference `.env.local.example`), and emulator startup command (`firebase emulators:start`)

**Checkpoint**: Feature complete. All tests passing. Build clean. Deployed to Firebase and Vercel.

---

## Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational — Types, Firebase, i18n)
        ├── Phase 3 (US1: Registration) 🎯 MVP
        │     └── Phase 4 (US2: Login) 🎯 MVP
        │           ├── Phase 5 (US3: Logout)
        │           └── Phase 6 (US4: Cross-Device Firestore)
        └── Phase 7 (US5: Password Reset) [independent of US2/US3/US4]

Phase 8 (Polish) depends on all phases above
```

**Story independence**: US5 (Password Reset) only depends on `authService.ts` being initialized (Phase 3 exists), making it workable in parallel with US3 and US4 by a second developer.

---

## Parallel Execution Examples

### Per-story parallel opportunities

**Phase 3 (US1 — Registration)**:

```
T010 (session API route) ──┐
T012 (AuthContext)         ├── all in parallel → T011 (authService) → T014 (register page) → T015 (layout) → T016 (AuthGuard)
T013 (RegisterForm)        ┘
T009 (integration tests)  ── in parallel with above
```

**Phase 4 (US2 — Login)**:

```
T019 (me API route)   ──┐
T020 (LoginForm)        ├── in parallel → T018 (authService.login) → T021 (login page) → T022 (middleware)
T017 (login tests)    ──┘
```

**Phase 6 (US4 — Firestore)**:

```
T028 (taskService)         ──┐
T029 (firestore.rules)       ├── in parallel → T030 (TaskContext migration) → T031 (import prompt)
T027 (taskService tests)   ──┘
```

---

## Implementation Strategy

**MVP** (deliver first): Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US2)

- Users can register and log in; routes are protected by middleware
- Tasks are not yet in Firestore (still in localStorage) — that is US4

**Increment 2**: Phase 5 (US3: Logout) + Phase 6 (US4: Firestore migration)

- Full session lifecycle working; tasks persisted per-user with real-time sync

**Increment 3**: Phase 7 (US5: Password Reset)

- Self-service account recovery

---

## Statistics

| Scope                          | Count    |
| ------------------------------ | -------- |
| Total tasks                    | 41       |
| Parallelizable tasks [P]       | 22       |
| Phase 1 (Setup)                | 3        |
| Phase 2 (Foundational)         | 5        |
| Phase 3 (US1 – Registration)   | 8        |
| Phase 4 (US2 – Login)          | 6        |
| Phase 5 (US3 – Logout)         | 4        |
| Phase 6 (US4 – Cross-Device)   | 5        |
| Phase 7 (US5 – Password Reset) | 6        |
| Phase 8 (Polish)               | 4        |
| MVP scope (Phase 1–4)          | 22 tasks |
