
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-permissions";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";
import { resetManagedUserPassword } from "@/lib/firebase-admin-auth";

type RouteContext = {
  params: Promise<{ uid: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const admin = await requireAdmin();
    const { uid } = await context.params;

    // Protect the primary Admin account.
    if (!uid || (await isAdminUid(uid))) {
      return NextResponse.json(
        { error: "The primary Admin account cannot be managed here." },
        { status: 403 }
      );
    }

    const body: unknown = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const newPassword = (body as Record<string, unknown>).password;

    if (
      typeof newPassword !== "string" ||
      newPassword.length < 6 ||
      newPassword.length > 128
    ) {
      return NextResponse.json(
        { error: "Password must be between 6 and 128 characters." },
        { status: 400 }
      );
    }

    const userRef = firestore.collection("userPermissions").doc(uid);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Managed user not found." },
        { status: 404 }
      );
    }

    const userData = snapshot.data();

    if (userData.isActive === false) {
      return NextResponse.json(
        { error: "Enable this account before resetting its password." },
        { status: 403 }
      );
    }

    // Change the Firebase password.
    await resetManagedUserPassword(uid, newPassword);

    // Record the successful password reset.
    const passwordResetAt = new Date().toISOString();

    await userRef.update({
      passwordResetAt,
      passwordResetBy: admin.uid,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully.",
      sessionsRevoked: false,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Please sign in again." },
        { status: 401 }
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Only the primary Admin can reset managed-user passwords." },
        { status: 403 }
      );
    }

    if (message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: "Firebase user not found." },
        { status: 404 }
      );
    }

    console.error("Admin password reset error:", error);

    return NextResponse.json(
      { error: "Unable to reset the user's password." },
      { status: 500 }
    );
  }
}
