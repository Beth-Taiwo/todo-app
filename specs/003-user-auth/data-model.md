# Data Model: User Authentication & Secure Data Access

**Branch**: `003-user-auth` | **Generated**: 2026-03-21  
**Source**: research.md decisions + spec.md Key Entities

---

## Overview

This feature introduces two new first-class entities (**UserAccount**, **Session**) and extends the existing **Task** entity with user ownership. All persistent data moves from `localStorage` to Cloud Firestore under path-based per-user subcollections.

---

## Entity 1: UserAccount

Managed by Firebase Authentication. The app does **not** store a separate user record in Firestore — Firebase Auth is the source of truth for identity.

| Field         | Type             | Source                 | Notes                                                                                                   |
| ------------- | ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `uid`         | `string`         | Firebase Auth          | Unique, immutable. Used as the Firestore document path segment (`/users/{uid}`)                         |
| `email`       | `string`         | Firebase Auth          | Case-insensitive equality enforced in app layer (normalized to lowercase). Unique per Firebase project. |
| `displayName` | `string \| null` | Firebase Auth          | Optional. Not required for this feature.                                                                |
| `createdAt`   | `Timestamp`      | Firebase Auth metadata | `user.metadata.creationTime`                                                                            |
| `lastLoginAt` | `Timestamp`      | Firebase Auth metadata | `user.metadata.lastSignInTime`                                                                          |

**Validation rules**:

- Email must match RFC 5322 format. Normalized to lowercase before comparison.
- Password must be at least 8 characters and contain at least one digit or symbol (enforced client-side before calling Firebase; Firebase itself requires minimum 6 characters).
- Registration rejects duplicate emails (Firebase returns `auth/email-already-in-use`).

**State transitions**:

```
[unregistered] → register() → [registered, logged out]
[registered, logged out] → login() → [registered, logged in]
[registered, logged in] → logout() → [registered, logged out]
[registered, logged out] → sendPasswordResetEmail() → [password reset pending]
[password reset pending] → confirmPasswordReset(oobCode) → [registered, logged out]
```

**TypeScript shape** (`src/types/auth.ts`):

```ts
export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: string; // ISO 8601
  lastLoginAt: string; // ISO 8601
}

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: AuthUser };
```

---

## Entity 2: Session

Managed by Firebase Administration SDK. Sessions are represented as HTTP-only session cookies (`__session`), not stored in Firestore.

| Field        | Type                                             | Notes                                                     |
| ------------ | ------------------------------------------------ | --------------------------------------------------------- |
| Cookie name  | `__session`                                      | HTTP-only, Secure, SameSite=Strict                        |
| Token type   | Firebase session cookie                          | Minted via `admin.auth().createSessionCookie()`           |
| Duration     | 7 days                                           | Configurable via `expiresIn` parameter                    |
| Revocation   | `admin.auth().revokeRefreshTokens(uid)`          | Called on logout; invalidates all sessions for the user   |
| Verification | `admin.auth().verifySessionCookie(cookie, true)` | `checkRevoked=true` ensures revoked sessions are rejected |

**Session lifecycle**:

```
POST /api/auth/session (with Firebase ID token)
  → Admin SDK creates session cookie
  → Set-Cookie: __session=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800

GET /protected-route
  → middleware.ts reads __session cookie
  → Admin SDK verifies: valid → proceed | invalid/expired → redirect /login

POST /api/auth/logout
  → Admin SDK revokes refresh tokens for uid
  → Response: Set-Cookie: __session=; Max-Age=0 (clears cookie)
```

**Security properties**:

- HTTP-only: inaccessible to JavaScript (XSS protection)
- Secure: transmitted only over HTTPS
- SameSite=Strict: CSRF protection
- `checkRevoked=true` on verification: ensures logout takes effect immediately across all devices

---

## Entity 3: Task (extended from 001-task-management)

Existing `Task` entity gains a `userId` field. Storage migrates from `localStorage` to Firestore.

### Firestore Path

```
/users/{userId}/tasks/{taskId}
```

### Firestore Document Shape

| Field         | Type                                  | Notes                                                                              |
| ------------- | ------------------------------------- | ---------------------------------------------------------------------------------- |
| `id`          | `string`                              | nanoid-generated UUID. Same as the Firestore document ID.                          |
| `userId`      | `string`                              | Firebase Auth UID of the owning user. Always equal to the `{userId}` path segment. |
| `title`       | `string`                              | 1–200 characters. Required.                                                        |
| `status`      | `"open" \| "completed" \| "archived"` | Default: `"open"`                                                                  |
| `createdAt`   | `Timestamp`                           | Firestore server timestamp on creation                                             |
| `completedAt` | `Timestamp \| null`                   | Set when status transitions to `"completed"`                                       |
| `archivedAt`  | `Timestamp \| null`                   | Set when status transitions to `"archived"`                                        |
| `updatedAt`   | `Timestamp`                           | Server timestamp updated on every write                                            |

### TypeScript shape update (`src/types/task.ts`)

```ts
// Add to existing Task interface:
export interface Task {
  id: string;
  userId: string; // NEW: Firebase Auth uid
  title: string;
  status: TaskStatus;
  createdAt: string; // ISO 8601 (serialized from Firestore Timestamp)
  completedAt: string | null;
  archivedAt: string | null;
  updatedAt: string; // NEW: track last mutation
}
```

### Validation rules (unchanged from 001, applied before Firestore write)

- `title` must be non-empty after trimming whitespace.
- `title` must be ≤ 200 characters.
- `status` must be one of `"open"`, `"completed"`, `"archived"`.
- `userId` must equal the authenticated user's `uid` — enforced in both app layer and Firestore Security Rules.

### State transitions (unchanged from 001-task-management)

```
open → COMPLETE_TASK → completed
open → ARCHIVE_TASK → archived
completed → RESTORE_TASK → open
archived → RESTORE_TASK → open
open → UPDATE_TASK (title edit)
* → DELETE_TASK → removed (permanent, no soft delete)
```

---

## Entity 4: PasswordResetRequest

Not stored in Firestore. Managed entirely by Firebase Authentication.

| Field     | Managed by                                                                     |
| --------- | ------------------------------------------------------------------------------ |
| `oobCode` | Firebase (embedded in reset link URL)                                          |
| `email`   | Firebase (looked up from oobCode)                                              |
| `expiry`  | Firebase (24 hours from issuance; not configurable on Spark plan)              |
| `used`    | Firebase (single-use; Firebase invalidates after first `confirmPasswordReset`) |

---

## Firestore Collection Structure

```
Firestore (database)
└── users/
    └── {userId}/                  ← document (no fields; container only)
        └── tasks/
            └── {taskId}/          ← task document (all Task fields)
```

**No top-level `tasks` collection.** All task data is nested under the owning user's document path.

---

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users may only read/write their own task subcollection.
    match /users/{userId}/tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Explicitly block all other paths.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**What these rules enforce**:

- `request.auth != null`: user must be authenticated.
- `request.auth.uid == userId`: user may only access their own subcollection. Even if a client sends a forged `userId` in a request, Firestore blocks it at the database level.
- Implicit deny on all other paths prevents accidental exposure from future collections.

---

## Indexes

Default single-field indexes created automatically by Firestore:

| Collection | Index field | Purpose                                        |
| ---------- | ----------- | ---------------------------------------------- |
| `tasks`    | `status`    | Filter by status (open / completed / archived) |
| `tasks`    | `createdAt` | Sort tasks by creation date                    |

No composite indexes required at this scale.

---

## localStorage (deprecated as source of truth)

After migration:

- `localStorage` key `"todo-app:tasks"` is used only as a **read-cache** when Firestore is offline; Firestore's own offline persistence layer handles this transparently.
- A new key `"todo-app:imported"` is written (value: `"true"`) when the one-time anonymous task import prompt has been dismissed or completed.
- On successful import or dismissal, `"todo-app:tasks"` is cleared.

---

## Entity Relationship Summary

```
UserAccount (Firebase Auth)
  │
  └─── owns many ──▶ Task (Firestore /users/{uid}/tasks/{taskId})

Session (HTTP-only cookie)
  │
  └─── authenticates ──▶ UserAccount
  │
  └─── authorizes access to ──▶ Task (via Firestore Security Rules)
```
