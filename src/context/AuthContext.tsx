"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  register as registerUser,
  login as loginUser,
  logout as logoutUser,
  sendPasswordReset as sendReset,
} from "@/lib/authService";
import type { AuthState, AuthUser, AuthError } from "@/types/auth";

interface AuthContextValue {
  authState: AuthState;
  register: (email: string, password: string) => Promise<AuthUser>;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const user: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          displayName: firebaseUser.displayName,
          createdAt:
            firebaseUser.metadata.creationTime ?? new Date().toISOString(),
          lastLoginAt:
            firebaseUser.metadata.lastSignInTime ?? new Date().toISOString(),
        };
        setAuthState({ status: "authenticated", user });
      } else {
        setAuthState({ status: "unauthenticated" });
      }
    });
    return unsubscribe;
  }, []);

  async function register(email: string, password: string): Promise<AuthUser> {
    const user = await registerUser(email, password);
    setAuthState({ status: "authenticated", user });
    return user;
  }

  async function login(email: string, password: string): Promise<AuthUser> {
    const user = await loginUser(email, password);
    setAuthState({ status: "authenticated", user });
    return user;
  }

  async function logout(): Promise<void> {
    await logoutUser();
    setAuthState({ status: "unauthenticated" });
  }

  async function sendPasswordReset(email: string): Promise<void> {
    await sendReset(email);
  }

  return (
    <AuthContext.Provider
      value={{ authState, register, login, logout, sendPasswordReset }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
}

// Re-export AuthError so consumers can type catch blocks
export type { AuthError };
