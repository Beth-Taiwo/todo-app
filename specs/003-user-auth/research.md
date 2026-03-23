# Research: User Authentication & Secure Data Access

**Branch**: `003-user-auth` | **Generated**: 2026-03-21  
**Phase**: 0 — Resolves all NEEDS CLARIFICATION items from Technical Context

---

## Decision 1: Authentication Provider — Firebase Auth

**Decision**: Use **Firebase Authentication** (email/password provider) in preference to Auth0.

**Rationale**:

- **Data colocation**: Firebase Auth and Cloud Firestore share the same Google Cloud project and authentication context. This eliminates a separate database integration and allows Firestore Security Rules to reference `request.auth.uid` directly — no custom authorization middleware layer required.
- **TDD support (Constitution IV, non-negotiable)**: Firebase Emulator Suite runs fully offline and emulates both Auth and Firestore locally. Auth0 requires calls to an external Dev tenant during tests, which blocks offline CI and violates the Red-Green-Refactor cycle.
- **Simplest proven mechanism (Constitution I + VI)**: Firebase uses OAuth 2.0-compatible token flows and is listed as a vetted provider. It handles credential hashing, token issuance, rotation, and revocation out of the box — no custom protocol code required.
- **Next.js 14 App Router fit**: Firebase Admin SDK is used in server-side middleware to verify session cookies; the client SDK manages auth state client-side. This is the idiomatic pattern for App Router hybrid rendering.
- **Pricing**: Both Firebase and Auth0 are free at personal scale. No cost advantage either way.

**Alternatives considered**:

- **Auth0**: Strong enterprise option (SSO, SAML, customizable flows). Rejected because it requires `next-auth` or a custom middleware layer that adds integration surface area, requires an external API call for testing (violating TDD), and confers no simplicity advantage at this scale.
- **Custom authentication**: Immediately rejected by Constitution Principle VI — building a custom auth protocol risks timing attacks, weak credential hashing, and token theft. Proven library required.

---

## Decision 2: Server-Side Data Storage — Cloud Firestore

**Decision**: Migrate task persistence from `localStorage` to **Cloud Firestore**, using a per-user subcollection structure: `/users/{userId}/tasks/{taskId}`.

**Rationale**:

- **Implicit data isolation**: The subcollection path encodes the owner. Firestore Security Rules become trivially simple (`request.auth.uid == userId`), leaving no room for accidental cross-user data leakage.
- **Offline persistence built-in**: The Firestore client SDK enables offline persistence by default on the web. Writes made offline are queued automatically and synced when connectivity is restored — satisfying Constitution Principle VIII (Cross-Device Continuity / offline queue requirement) without any custom code.
- **Real-time listeners**: `onSnapshot()` delivers changes to all authenticated clients within seconds, meeting the ≤ 30-second cross-device sync SLA (SC-003).
- **Colocation with Auth**: Same Firebase project, same SDK, same Admin service account — no additional credentials or network configurations.

**Alternatives considered**:

- **Flat `/tasks/{taskId}` with `userId` field**: Requires a compound index for per-user queries, and Security Rules must filter on a document field rather than a path parameter — slightly more error-prone. Rejected in favour of the subcollection pattern.
- **Supabase (PostgreSQL-backed)**: Strong relational option. Rejected because it introduces a second vendor and requires a separate auth integration alongside Firebase, violating Radical Simplicity.
- **Vercel KV / Upstash**: Suitable for key-value caching, not for structured relational task data with real-time sync capabilities. Rejected.

---

## Decision 3: Next.js 14 Middleware — Session Cookie Pattern

**Decision**: Use **Firebase session cookies** (HTTP-only, Secure, SameSite=Strict) set by a server-side API route (`/api/auth/session`), verified in `middleware.ts` using Firebase Admin SDK.

**Flow**:

1. User signs in client-side via Firebase client SDK (`signInWithEmailAndPassword`).
2. Client sends the Firebase ID token to `/api/auth/session` (POST).
3. `/api/auth/session` uses Admin SDK `getAuth().createSessionCookie()` to mint a long-lived session cookie (7 days), and sets it as an HTTP-only cookie in the response.
4. `middleware.ts` reads `__session` cookie on every protected request and calls `getAuth().verifySessionCookie()` via the Admin SDK.
5. Valid → request proceeds. Invalid/missing → redirect to `/login`.

**Protected routes**: `/` (dashboard), `/completed`, `/archived`.  
**Public routes**: `/login`, `/register`, `/forgot-password`, `/reset-password`.

**Rationale**:

- HTTP-only cookies prevent JavaScript-based theft (XSS mitigation).
- Session cookies can be revoked server-side on logout (`getAuth().revokeRefreshTokens(uid)`) — satisfying FR-006 (immediate session invalidation).
- Firebase Admin SDK is available in Node.js edge middleware in Next.js 14.

**Alternatives considered**:

- **Storing ID token in client state only**: Tokens are ephemeral (1-hour expiry), require client-side renewal, and cannot be revoked centrally on logout. Rejected.
- **NextAuth.js with Firebase adapter**: Adds an abstraction layer. Rejected as unnecessary complexity (Constitution Principle I) for a single-provider email/password setup.

---

## Decision 4: Rate Limiting — Firebase Built-In (No Additional Layer)

**Decision**: Rely entirely on **Firebase Auth's built-in rate limiting** for login and registration. No additional application-level rate limiting at this stage.

**Rationale**:

- Firebase automatically rate-limits authentication attempts after repeated failures per IP (approximately 5 failures per 15-minute window), returning `auth/too-many-requests`.
- At personal scale, this is sufficient. Adding Upstash Redis or in-memory tracking would introduce a dependency without benefit (Constitution Principle I).
- If the app grows and the personal-scale assumption changes, Upstash Rate Limit (edge-compatible, zero-config) is the recommended next step.

**UX on lockout**: Display "Too many login attempts. Please wait a moment and try again." Disable the submit button for 60 seconds, then re-enable.

---

## Decision 5: Anonymous Task Migration — One-Time Import Prompt

**Decision**: On first login, **detect** any tasks stored in `localStorage` and **prompt the user** to import them into their Firestore account. Do not auto-import silently.

**Rationale**:

- The spec assumption states anonymous tasks are not auto-merged (Assumptions section). A prompt respects user intent and is non-destructive.
- If the user declines or there are no local tasks, `localStorage` is left untouched and eventually becomes irrelevant.
- If the user accepts, tasks are batch-written to Firestore and then cleared from `localStorage`.
- This is a one-time flow triggered only when: (a) the user has just logged in for the first time on a device, AND (b) localStorage contains at least one task.

**Implementation note**: Detect "first login on this device" by checking for a `"todo-app:imported"` flag in `localStorage`. Once import is complete, set the flag.

---

## Decision 6: Password Reset — Firebase `sendPasswordResetEmail()` + Custom Pages

**Decision**: Use **Firebase's built-in `sendPasswordResetEmail()`** for sending the reset link. Build two custom app pages to handle the flow: `/forgot-password` and `/reset-password`.

**Flow**:

1. User navigates to `/forgot-password` and enters their email.
2. App calls `sendPasswordResetEmail(auth, email)`.
3. Same success message shown regardless of whether the email is registered (prevents user enumeration — satisfies FR-014).
4. Firebase sends an email with a link containing `?oobCode=...&mode=resetPassword`.
5. Clicking the link opens `/reset-password?oobCode=...` in the app.
6. User enters a new password. App calls `confirmPasswordReset(auth, oobCode, newPassword)`.
7. On success, user is redirected to `/login`.

**Security**:

- Firebase does not reveal whether an email is registered in the reset response — FR-014 is satisfied natively.
- Reset links expire after **24 hours** (Firebase default, not configurable without Blaze plan).
- Reset links are single-use.

**App-side components needed**: `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx` (accepts `oobCode` from URL search params).

---

## Decision 7: Firestore Security Rules Strategy

**Decision**: Implement strict **path-based, uid-matched Security Rules** at the Firestore database level as the primary authorization layer.

**Key rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Block all other paths by default (implicit deny)
  }
}
```

**Rationale**:

- Server-side enforcement is required by Constitution Principle VI. UI-only enforcement is explicitly prohibited.
- These rules ensure that even if the client sends a forged `userId`, Firestore rejects the request at the database boundary.
- The implicit deny on all unmatched paths means no accidental data exposure from new collections.

---

## Summary: All NEEDS CLARIFICATION Items Resolved

| Item                      | Decision                                                                         |
| ------------------------- | -------------------------------------------------------------------------------- |
| Auth provider             | Firebase Authentication (email/password)                                         |
| Server-side DB            | Cloud Firestore (`/users/{userId}/tasks/{taskId}` subcollections)                |
| Middleware pattern        | Firebase session cookies + Admin SDK `verifySessionCookie()`                     |
| Rate limiting             | Firebase built-in (sufficient at personal scale)                                 |
| Anonymous task handling   | One-time user-prompted import on first login                                     |
| Password reset            | `sendPasswordResetEmail()` + custom `/forgot-password` + `/reset-password` pages |
| Authorization enforcement | Firestore Security Rules (server-side, uid-matched)                              |
| Testing strategy          | Firebase Emulator Suite (Auth + Firestore, fully offline)                        |
