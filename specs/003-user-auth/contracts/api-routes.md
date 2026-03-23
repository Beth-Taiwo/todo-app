# API Route Contracts

**Branch**: `003-user-auth` | **Generated**: 2026-03-21  
**Scope**: Next.js App Router API Routes (`/api/*`) introduced by this feature

All routes return JSON. All error responses include a `{ error: string }` body with a human-readable (non-technical) message. No raw Firebase error codes are ever surfaced in responses.

---

## POST `/api/auth/session`

Creates a Firebase session cookie for an authenticated user.

**When called**: Immediately after a successful Firebase client-side `signInWithEmailAndPassword()` or `createUserWithEmailAndPassword()`.

### Request

```
Method:       POST
Content-Type: application/json
Cookie:       (none required)
```

```json
{
  "idToken": "string" // Firebase ID token from client SDK (required)
}
```

### Response — 200 OK

Sets an HTTP-only session cookie and returns the authenticated user's public profile.

```
Set-Cookie: __session=<session-cookie>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
```

```json
{
  "uid": "string",
  "email": "string"
}
```

### Error Responses

| Status | Condition                           | Body                                                             |
| ------ | ----------------------------------- | ---------------------------------------------------------------- |
| `400`  | `idToken` missing or malformed      | `{ "error": "Invalid request." }`                                |
| `401`  | Firebase cannot verify the ID token | `{ "error": "Authentication failed." }`                          |
| `500`  | Firebase Admin SDK error            | `{ "error": "An unexpected error occurred. Please try again." }` |

### Security notes

- Only the Firebase Admin SDK can mint session cookies; the client cannot forge them.
- Session expiry: 7 days (`Max-Age=604800`).
- Cookie is HTTP-only (no JavaScript access) and Secure (HTTPS only).

---

## POST `/api/auth/logout`

Revokes the current session and clears the session cookie.

**When called**: When the user clicks "Log out."

### Request

```
Method:       POST
Content-Type: application/json
Cookie:       __session=<session-cookie>  (required)
```

```json
{} // Empty body accepted
```

### Response — 200 OK

Clears the session cookie and revokes the user's Firebase refresh tokens.

```
Set-Cookie: __session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
```

```json
{
  "success": true
}
```

### Error Responses

| Status | Condition                                    | Body                                              |
| ------ | -------------------------------------------- | ------------------------------------------------- |
| `401`  | No session cookie present or already expired | `{ "error": "Not authenticated." }`               |
| `500`  | Firebase Admin SDK error during revocation   | `{ "error": "Logout failed. Please try again." }` |

### Security notes

- `revokeRefreshTokens(uid)` is called before the cookie is cleared.
- `verifySessionCookie(cookie, checkRevoked=true)` in middleware will immediately reject subsequent requests with this session.
- Revocation affects all devices/sessions for the user.

---

## GET `/api/auth/me`

Returns the authenticated user's public profile. Used by the client `AuthContext` to rehydrate session state on page load.

### Request

```
Method:       GET
Cookie:       __session=<session-cookie>  (required)
```

### Response — 200 OK

```json
{
  "uid": "string",
  "email": "string",
  "createdAt": "2026-03-21T10:00:00.000Z", // ISO 8601
  "lastLoginAt": "2026-03-21T10:30:00.000Z" // ISO 8601
}
```

### Error Responses

| Status | Condition                              | Body                                |
| ------ | -------------------------------------- | ----------------------------------- |
| `401`  | No session cookie, expired, or revoked | `{ "error": "Not authenticated." }` |

### Security notes

- No sensitive data (password hash, refresh token, internal Firebase credentials) is ever returned.
- Email is returned as stored in Firebase Auth (already normalized to lowercase at registration).

---

## Middleware Contract: `middleware.ts`

Not an API route, but part of the server-side contract surface.

**Protects**: All routes matching `/`, `/completed`, `/archived` (and any future authenticated pages).  
**Passes through**: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/api/auth/*`, `/_next/*`, static assets.

**Behaviour**:

| Condition                 | Action                                                              |
| ------------------------- | ------------------------------------------------------------------- |
| Valid `__session` cookie  | Request proceeds to the page/route handler unchanged                |
| No cookie                 | `302` redirect to `/login`                                          |
| Expired or revoked cookie | `302` redirect to `/login`; old cookie cleared                      |
| Firebase Admin SDK error  | `302` redirect to `/login` (fail-safe: never grant access on error) |

**Security notes**:

- All checks use `verifySessionCookie(cookie, { checkRevoked: true })` — revoked sessions are rejected immediately.
- On error, the middleware always fails **closed** (denies access), never open.
- The middleware does not log the session cookie value; it only logs the `uid` on successful verification.

---

## Firestore Task API (client-side service, not an HTTP route)

The task CRUD layer operates directly against Firestore using the client SDK — there are no intermediate Next.js API routes for task operations. The contract is enforced by Firestore Security Rules (see `data-model.md`).

All operations require the user to be authenticated (`auth.currentUser !== null`).

### `getTasks(userId: string): Promise<Task[]>`

- Reads all documents from `/users/{userId}/tasks` ordered by `createdAt` ascending.
- Returns an empty array (not an error) if the user has no tasks.

### `createTask(userId: string, title: string): Promise<Task>`

- Validates `title` (non-empty, ≤ 200 chars) before writing.
- Auto-generates `taskId` (nanoid), sets `status: "open"`, `createdAt: serverTimestamp()`, `userId`.
- Returns the created task with Firestore-resolved timestamps.

### `updateTask(userId: string, taskId: string, updates: Partial<Pick<Task, "title" | "status" | "completedAt" | "archivedAt">>): Promise<void>`

- Merges `updates` into the existing document using Firestore `updateDoc()`.
- Always writes `updatedAt: serverTimestamp()`.
- Throws if `taskId` does not exist under `{userId}`'s collection.

### `deleteTask(userId: string, taskId: string): Promise<void>`

- Permanently deletes the document. No soft delete.
- Throws if `taskId` does not belong to the authenticated user (Firestore Security Rules enforce this regardless).
