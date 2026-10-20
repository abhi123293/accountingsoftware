import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-permissions";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";
import { normalizePermissions } from "@/lib/permissions";

type RouteContext = { params: Promise<{ uid: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { uid } = await context.params;
    if (!uid || (await isAdminUid(uid))) {
      return NextResponse.json({ error: "The primary Admin account cannot be managed here." }, { status: 403 });
    }
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid permission details." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(input, "permissions")) {
      return NextResponse.json({ error: "Permissions are required." }, { status: 400 });
    }
    const ref = firestore.collection("userPermissions").doc(uid);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ error: "Managed user not found." }, { status: 404 });

    // Admin may intentionally clear every permission to revoke application access.
    const permissions = normalizePermissions(input.permissions);
    const updatedAt = new Date().toISOString();
    await ref.update({ permissions, updatedAt, updatedBy: admin.uid });
    const existing = snapshot.data();
    return NextResponse.json({ user: {
      uid,
      email: String(existing.email ?? ""),
      displayName: String(existing.displayName ?? ""),
      permissions,
      isActive: existing.isActive !== false,
      updatedAt,
    } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (message === "FORBIDDEN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    console.error("User permissions update failed:", error);
    return NextResponse.json({ error: "Unable to update permissions." }, { status: 500 });
  }
}
