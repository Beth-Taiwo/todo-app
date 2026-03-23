# Auth Context Contract

**Branch**: `003-user-auth` | **Generated**: 2026-03-21  
**Scope**: The `AuthContext` React context interface exposed to all client components

This contract defines what the `AuthContext` provides to the component tree. Components depend on this interface; they MUST NOT import Firebase SDK directly.

---

## Context Shape

```ts
// src/context/AuthContext.tsx

export interface AuthContextValue {
  // Current authentication state.
  // "loading" while the session cookie is being verified on mount.
  authState: AuthState;

  // Register a new user account.
  // Throws AuthError on failure (email already in use, weak password, etc.)
  register(email: string, password: string): Promise<void>;

  // Log in with email and password.
  // Throws AuthError on failure (wrong credentials, too many attempts, etc.)
  login(email: string, password: string): Promise<void>;

  // Log out the current user.
  // Invalidates the session cookie server-side and redirects to /login.
  logout(): Promise<void>;

  // Send a password reset email.
  // Returns normally regardless of whether the email is registered (no enumeration).
  sendPasswordReset(email: string): Promise<void>;
}

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: AuthUser };

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: string; // ISO 8601
  lastLoginAt: string; // ISO 8601
}

export interface AuthError {
  code: string; // Internal code (e.g., "auth/email-already-in-use") — NOT shown to user
  message: string; // Localised, human-readable message — shown to user
}
```

---

## Behaviour Contract

### `authState`

| Value                               | When                                                      |
| ----------------------------------- | --------------------------------------------------------- |
| `{ status: "loading" }`             | Before the initial session check completes on mount       |
| `{ status: "unauthenticated" }`     | No valid session; user must log in                        |
| `{ status: "authenticated", user }` | Valid session exists; `user` contains public profile data |

Components that render protected content MUST check `authState.status === "authenticated"` before accessing `authState.user`. The `AuthGuard` component handles this gate automatically.

---

### `register(email, password)`

| Outcome                     | Effect                                                            |
| --------------------------- | ----------------------------------------------------------------- |
| Success                     | `authState` transitions to `{ status: "authenticated", user }`    |
| `auth/email-already-in-use` | Throws `AuthError` — message: i18n key `auth.errors.emailInUse`   |
| `auth/invalid-email`        | Throws `AuthError` — message: i18n key `auth.errors.invalidEmail` |
| `auth/weak-password`        | Throws `AuthError` — message: i18n key `auth.errors.weakPassword` |
| Other Firebase error        | Throws `AuthError` — message: i18n key `auth.errors.generic`      |

**Security**: Raw Firebase error codes are caught internally and mapped to localised messages. They are never surfaced to the UI or logged.

---

### `login(email, password)`

| Outcome                  | Effect                                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Success                  | `authState` transitions to `{ status: "authenticated", user }`                                                        |
| Invalid credentials      | Throws `AuthError` — message: i18n key `auth.errors.invalidCredentials` (generic — does not say which field is wrong) |
| `auth/too-many-requests` | Throws `AuthError` — message: i18n key `auth.errors.tooManyAttempts`                                                  |
| Other Firebase error     | Throws `AuthError` — message: i18n key `auth.errors.generic`                                                          |

**Security**: The error message for invalid credentials intentionally does not specify whether the email or password was wrong (prevents user enumeration).

---

### `logout()`

| Outcome       | Effect                                                                                 |
| ------------- | -------------------------------------------------------------------------------------- |
| Success       | Calls `POST /api/auth/logout`; session cookie cleared; `authState` → `unauthenticated` |
| Network error | Logs internally; `authState` → `unauthenticated` anyway (fail-safe)                    |

**Security**: The session is revoked server-side (on all devices) regardless of network error handling.

---

### `sendPasswordReset(email)`

| Outcome              | Effect                                                                       |
| -------------------- | ---------------------------------------------------------------------------- |
| Email registered     | Firebase sends reset email; function returns without error                   |
| Email not registered | Function returns without error (Firebase silently suppresses the email send) |
| Network error        | Throws `AuthError` — message: i18n key `auth.errors.resetFailed`             |

**Security**: The same success path is taken whether the email is registered or not. The caller MUST show a neutral confirmation ("Check your email if an account exists with that address") — never confirm or deny.

---

## i18n Keys Required

The following keys MUST be added to `messages/en.json` under a new `auth` namespace:

```json
{
  "auth": {
    "register": {
      "title": "Create an account",
      "emailLabel": "Email address",
      "passwordLabel": "Password",
      "submitButton": "Create account",
      "loginLink": "Already have an account? Log in"
    },
    "login": {
      "title": "Log in",
      "emailLabel": "Email address",
      "passwordLabel": "Password",
      "submitButton": "Log in",
      "registerLink": "Don't have an account? Create one",
      "forgotPasswordLink": "Forgot your password?"
    },
    "logout": {
      "buttonLabel": "Log out"
    },
    "forgotPassword": {
      "title": "Reset your password",
      "emailLabel": "Email address",
      "submitButton": "Send reset link",
      "confirmation": "If an account exists for that address, we've sent a reset link. Check your email."
    },
    "resetPassword": {
      "title": "Set a new password",
      "passwordLabel": "New password",
      "submitButton": "Update password",
      "success": "Password updated. You can now log in."
    },
    "importPrompt": {
      "title": "You have local tasks",
      "message": "We found {count} task(s) saved on this device. Would you like to import them into your account?",
      "confirmButton": "Import tasks",
      "dismissButton": "No thanks"
    },
    "errors": {
      "emailInUse": "An account with this email address already exists.",
      "invalidEmail": "Please enter a valid email address.",
      "weakPassword": "Password must be at least 8 characters and include a number or symbol.",
      "invalidCredentials": "Incorrect email or password. Please try again.",
      "tooManyAttempts": "Too many login attempts. Please wait a moment and try again.",
      "resetFailed": "Could not send reset email. Please check your connection and try again.",
      "generic": "Something went wrong. Please try again."
    }
  }
}
```
