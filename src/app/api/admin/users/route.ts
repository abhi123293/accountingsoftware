import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/server-permissions";
import { firestore } from "@/lib/firestore-rest";
import { normalizePermissions } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type AuthSignUpResponse = { localId?: string; idToken?: string; email?: string; error?: { message?: string } };

async function getApiKey(): Promise<string | undefined> {
  try {
    const context = await getCloudflareContext({ async: true });
    const value = context.env["NEXT_PUBLIC_FIREBASE_API_KEY" as keyof CloudflareEnv];
    if (typeof value === "string" && value.trim()) return value.trim();
  } catch {
    // Local Next.js development does not always have a Cloudflare Worker context.
  }
  const value = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return value?.trim() || undefined;
}

async function rollbackCreatedUser(apiKey: string, idToken: string): Promise<void> {
  try {
    await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch (error) {
    console.error("Could not roll back Firebase user after permissions write failed.", error);
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const snapshot = await firestore.collection("userPermissions").get();
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: String(data.email ?? ""),
        displayName: String(data.displayName ?? ""),
        isActive: data.isActive !== false,
        permissions: normalizePermissions(data.permissions),
        createdAt: String(data.createdAt ?? ""),
        updatedAt: String(data.updatedAt ?? ""),
      };
    });
    users.sort((a, b) => a.email.localeCompare(b.email));
    return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (message === "FORBIDDEN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    console.error("Admin user list failed:", error);
    return NextResponse.json({ error: "Unable to load users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid user details." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const displayName = typeof input.displayName === "string" ? input.displayName.trim() : "";
    const password = typeof input.password === "string" ? input.password : "";
    const permissions = normalizePermissions(input.permissions);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (displayName.length < 2 || displayName.length > 100) {
      return NextResponse.json({ error: "Name must be between 2 and 100 characters." }, { status: 400 });
    }
    if (password.length < 6 || password.length > 128) {
      return NextResponse.json({ error: "Initial password must be at least 6 characters." }, { status: 400 });
    }
    if (!Object.values(permissions).some(Boolean)) {
      return NextResponse.json({ error: "Grant at least one permission before creating the user." }, { status: 400 });
    }

    const apiKey = await getApiKey();
    if (!apiKey) return NextResponse.json({ error: "Firebase API key is not configured on the server." }, { status: 503 });

    const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const authResult = (await authResponse.json().catch(() => ({}))) as AuthSignUpResponse;
    if (!authResponse.ok || !authResult.localId || !authResult.idToken) {
      const code = authResult.error?.message ?? "";
      if (code.includes("EMAIL_EXISTS")) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      if (code.includes("WEAK_PASSWORD") || code.includes("INVALID_PASSWORD")) return NextResponse.json({ error: "Firebase rejected the password. Use at least 6 characters." }, { status: 400 });
      if (code.includes("OPERATION_NOT_ALLOWED")) return NextResponse.json({ error: "Email/password sign-in is not enabled in Firebase Authentication." }, { status: 503 });
      console.error("Firebase user creation failed:", { status: authResponse.status, code });
      return NextResponse.json({ error: "Unable to create the Firebase account." }, { status: 502 });
    }

    const uid = authResult.localId;
    const now = new Date().toISOString();
    try {
      await firestore.collection("userPermissions").doc(uid).set({
        uid,
        email,
        displayName,
        permissions,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: admin.uid,
      });
    } catch (error) {
      await rollbackCreatedUser(apiKey, authResult.idToken);
      throw error;
    }

    return NextResponse.json({ user: { uid, email, displayName, permissions, isActive: true, createdAt: now, updatedAt: now } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (message === "FORBIDDEN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    console.error("Admin user creation failed:", error);
    return NextResponse.json({ error: "Unable to create user." }, { status: 500 });
  }
}
