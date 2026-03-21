import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { AuthError, AuthUser } from "@/types/auth";

// Maps Firebase error codes to i18n message values
function mapFirebaseError(code: string): AuthError {
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password":
      "Password must be at least 8 characters and include a digit or symbol.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests":
      "Too many attempts. Please wait a moment and try again.",
  };
  return {
    code,
    message: messages[code] ?? "Something went wrong. Please try again.",
  };
}

async function mintSessionCookie(idToken: string): Promise<void> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw { code: "auth/session-error" };
}

function toAuthUser(firebaseUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  metadata: { creationTime?: string; lastSignInTime?: string };
}): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    displayName: firebaseUser.displayName,
    createdAt: firebaseUser.metadata.creationTime ?? new Date().toISOString(),
    lastLoginAt:
      firebaseUser.metadata.lastSignInTime ?? new Date().toISOString(),
  };
}

export async function register(
  email: string,
  password: string,
): Promise<AuthUser> {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const idToken = await credential.user.getIdToken();
    await mintSessionCookie(idToken);
    return toAuthUser(credential.user);
  } catch (err) {
    throw mapFirebaseError((err as { code?: string }).code ?? "unknown");
  }
}

export async function login(
  email: string,
  password: string,
): Promise<AuthUser> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();
    await mintSessionCookie(idToken);
    return toAuthUser(credential.user);
  } catch (err) {
    throw mapFirebaseError((err as { code?: string }).code ?? "unknown");
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
  await signOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch {
    // Always resolve — do not expose whether the email is registered (no enumeration)
  }
}
