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

export interface AuthError {
  code: string;
  message: string; // i18n key value (human-readable, not raw Firebase error code)
}
