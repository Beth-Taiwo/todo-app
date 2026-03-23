# Quickstart: User Authentication & Secure Data Access

**Branch**: `003-user-auth` | **Generated**: 2026-03-21  
**Purpose**: Get local development running with Firebase Auth + Firestore emulators, and understand the end-to-end authentication flow.

---

## Prerequisites

| Tool         | Version | Install                              |
| ------------ | ------- | ------------------------------------ |
| Node.js      | 18+     | https://nodejs.org                   |
| npm          | 9+      | Bundled with Node                    |
| Java JDK     | 11+     | Required for Firebase Emulator Suite |
| Firebase CLI | latest  | `npm install -g firebase-tools`      |

Verify:

```bash
node --version    # 18+
java --version    # 11+
firebase --version
```

---

## 1. Firebase Project Setup

### Create a Firebase project (one-time)

1. Go to https://console.firebase.google.com and create a new project (e.g., `todo-app-dev`).
2. In **Authentication** → **Sign-in method**, enable **Email/Password**.
3. In **Firestore Database**, create a database in **production mode** (Security Rules will be deployed separately).
4. In **Project Settings** → **General**, find your web app config. It looks like:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

### Create environment variables

Create a `.env.local` file in the project root (never commit this file):

```bash
# Firebase client SDK (public — safe to embed in browser)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin SDK (server-only — never expose to client)
FIREBASE_PROJECT_ID=...          # same as above
FIREBASE_CLIENT_EMAIL=...        # from Service Account JSON
FIREBASE_PRIVATE_KEY=...         # from Service Account JSON (keep quotes)

# Emulator flag (set to "true" for local dev)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

### Generate an Admin SDK service account

1. Firebase Console → Project Settings → Service accounts → **Generate new private key**.
2. Download the JSON file; extract `project_id`, `client_email`, and `private_key` into `.env.local`.
3. Store the JSON file securely outside the repository. **Do not commit it.**

---

## 2. Firebase Emulator Setup (local development & testing)

Initialize emulators from the project root:

```bash
firebase init emulators
```

When prompted:

- Enable: **Authentication** and **Firestore**
- Authentication port: `9099` (default)
- Firestore port: `8080` (default)
- Enable the Emulator UI: **Yes** (port `4000`)

This creates a `firebase.json` and `.firebaserc` at the project root.

### Start emulators

```bash
# Terminal 1 — keep running during development and testing
npx firebase emulators:start --only auth,firestore
```

The Emulator UI is available at http://localhost:4000 — useful for inspecting user accounts and Firestore documents during development.

### Connecting the app to emulators

The Firebase client is initialized in `src/lib/firebase.ts`. When `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`, it connects to local emulators instead of the live Firebase project:

```ts
// src/lib/firebase.ts (simplified)
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}
```

---

## 3. Run the App Locally

```bash
# Install dependencies (run once after cloning)
npm install

# Terminal 1: Firebase emulators
npx firebase emulators:start --only auth,firestore

# Terminal 2: Next.js dev server
npm run dev
```

The app is available at http://localhost:3000.

**First run flow**:

1. Navigate to http://localhost:3000 → middleware redirects to `/login` (no session).
2. Click **Create account** → fill in email + password → submit.
3. You are redirected to the task dashboard (`/`).
4. Create a task — it appears instantly in the Emulator UI under Firestore → `users/{uid}/tasks`.

---

## 4. Run the Test Suite

Emulators must be running before integration tests execute:

```bash
# Terminal 1: Firebase emulators (must be running)
npx firebase emulators:start --only auth,firestore

# Terminal 2: Run all tests
npm test

# Run only auth-related tests
npm test -- tests/unit/authService.test.ts tests/integration/register.test.tsx
```

Tests connect to the emulators automatically (same `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` env var). Each test suite clears emulator state by calling the emulator REST API at setup/teardown.

---

## 5. Key Authentication Flows

### Registration flow

```
User → /register (RegisterForm)
  → client: createUserWithEmailAndPassword(email, password)
  → client: getIdToken() → POST /api/auth/session { idToken }
  → server: Admin SDK createSessionCookie(idToken, { expiresIn: 7 days })
  → server: Set-Cookie __session (HttpOnly)
  → client: router.push("/")
```

### Login flow

```
User → /login (LoginForm)
  → client: signInWithEmailAndPassword(email, password)
  → client: getIdToken() → POST /api/auth/session { idToken }
  → server: Admin SDK createSessionCookie(idToken, { expiresIn: 7 days })
  → server: Set-Cookie __session (HttpOnly)
  → client: router.push("/")
```

### Protected page access (middleware)

```
Browser → GET /
  → middleware.ts reads __session cookie
  → Admin SDK verifySessionCookie(cookie, { checkRevoked: true })
  → Valid: request proceeds to page
  → Invalid/missing: 302 redirect to /login
```

### Logout flow

```
User clicks "Log out"
  → client: POST /api/auth/logout
  → server: Admin SDK revokeRefreshTokens(uid)
  → server: Set-Cookie __session=; Max-Age=0 (clears cookie)
  → client: router.push("/login")
```

### Password reset flow

```
User → /forgot-password (ForgotPasswordForm)
  → client: sendPasswordResetEmail(auth, email)
  → UI shows neutral confirmation (no email/account confirmation)

User clicks link in email → /reset-password?oobCode=...
  → client: confirmPasswordReset(auth, oobCode, newPassword)
  → On success: router.push("/login")
```

### First-login import prompt

```
User logs in for the first time on a device:
  → TaskContext checks localStorage for "todo-app:tasks"
  → If tasks found AND localStorage "todo-app:imported" !== "true":
      → Show ImportPromptModal
      → User confirms → batch write to Firestore → clear localStorage
      → User dismisses → set "todo-app:imported" = "true" (don't ask again)
```

---

## 6. Project Structure Reference

| Path                                    | Purpose                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `src/lib/firebase.ts`                   | Firebase app init; emulator connections                                        |
| `src/lib/authService.ts`                | `register()`, `login()`, `logout()`, `sendPasswordReset()`                     |
| `src/lib/taskService.ts`                | Firestore CRUD for tasks (replaces `taskStorage.ts`)                           |
| `src/context/AuthContext.tsx`           | React context providing `authState` + auth actions                             |
| `src/context/TaskContext.tsx`           | Extended to use `taskService.ts` + subscribe to auth state                     |
| `src/middleware.ts`                     | Edge middleware for route protection                                           |
| `src/app/login/page.tsx`                | Login page                                                                     |
| `src/app/register/page.tsx`             | Registration page                                                              |
| `src/app/forgot-password/page.tsx`      | Password reset request page                                                    |
| `src/app/reset-password/page.tsx`       | Password reset confirmation page                                               |
| `src/components/LoginForm.tsx`          | Login form UI                                                                  |
| `src/components/RegisterForm.tsx`       | Registration form UI                                                           |
| `src/components/ForgotPasswordForm.tsx` | Password reset request form UI                                                 |
| `src/components/ResetPasswordForm.tsx`  | Password reset confirmation form UI                                            |
| `src/components/AuthGuard.tsx`          | Client-side loading gate (prevents flash of unauthenticated content)           |
| `src/types/auth.ts`                     | `AuthUser`, `AuthState`, `AuthError` types                                     |
| `firestore.rules`                       | Firestore Security Rules (deploy via `firebase deploy --only firestore:rules`) |

---

## 7. Deploying to Production

```bash
# 1. Deploy Firestore Security Rules
firebase deploy --only firestore:rules

# 2. Build and deploy the Next.js app (e.g., Vercel)
vercel --prod

# Production environment variables must be set in Vercel Dashboard:
# NEXT_PUBLIC_FIREBASE_* (client config)
# FIREBASE_* (Admin SDK: project_id, client_email, private_key)
# NEXT_PUBLIC_USE_FIREBASE_EMULATOR must be absent or "false" in production
```

**Important**: Set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` to `false` (or remove it) in the Vercel production environment. The emulator connection is only for local development and testing.

---

## 8. Common Issues

| Problem                                         | Likely cause                                | Fix                                                                                  |
| ----------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| "Cannot find module 'firebase-admin'"           | Admin SDK not installed                     | `npm install firebase-admin`                                                         |
| "Firebase: Error (auth/network-request-failed)" | Emulators not running                       | Start emulators in Terminal 1                                                        |
| Middleware redirects all pages to /login        | `__session` cookie not being set            | Check `/api/auth/session` route; verify Admin SDK env vars                           |
| Firestore permission denied in emulator         | Security rules not loaded                   | Add `--import=./emulator-data` flag or copy rules to `firestore.rules`               |
| Token expired after 1 hour in dev               | ID token (not session cookie) used for auth | Ensure `/api/auth/session` mints a session cookie, not storing the ID token directly |
| Tasks not syncing across tabs                   | Firestore real-time listener not set up     | Use `onSnapshot()` in `taskService.ts`, not `getDocs()`                              |
