import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

const SESSION_DURATION_MS = 60 * 60 * 24 * 7 * 1000; // 7 days

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { idToken?: unknown };
    const idToken = body.idToken;

    if (typeof idToken !== "string" || !idToken) {
      return NextResponse.json({ error: "idToken required" }, { status: 400 });
    }

    // Verify the ID token before creating a session cookie
    const decoded = await adminAuth.verifyIdToken(idToken);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({
      uid: decoded.uid,
      email: decoded.email ?? "",
    });

    response.cookies.set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_DURATION_MS / 1000,
      path: "/",
    });

    return response;
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    console.error("[/api/auth/session] error:", code, err);
    if (code === "auth/argument-error" || code === "auth/invalid-argument") {
      return NextResponse.json(
        { error: "Invalid ID token", code },
        { status: 401 },
      );
    }
    const message =
      (err as { message?: string }).message ?? "Internal server error";
    return NextResponse.json({ error: message, code }, { status: 500 });
  }
}
