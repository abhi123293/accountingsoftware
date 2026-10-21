
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-permissions";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";
import { normalizePermissions } from "@/lib/permissions";
import { setManagedUserDisabled } from "@/lib/firebase-admin-auth";
import { deleteManagedFirebaseUser } from "@/lib/firebase-admin-auth";

type RouteContext = {
  params: Promise<{ uid: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const admin = await requireAdmin();
    const { uid } = await context.params;

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

    const input = body as Record<string, unknown>;
    const userRef = firestore.collection("userPermissions").doc(uid);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Managed user not found." },
        { status: 404 }
      );
    }

    const existing = snapshot.data();
    const updatedAt = new Date().toISOString();

    // Handle account enable/disable requests.
    if (typeof input.isActive === "boolean") {
      await setManagedUserDisabled(uid, !input.isActive);

      try {
        await userRef.update({
          isActive: input.isActive,
          updatedAt,
          updatedBy: admin.uid,
        });
      } catch (error) {
        // Avoid leaving Firebase and Firestore in different states.
        try {
          await setManagedUserDisabled(uid, existing.isActive === false);
        } catch (rollbackError) {
          console.error("Account status rollback failed.", rollbackError);
        }
        throw error;
      }

      return NextResponse.json({
        success: true,
        user: {
          uid,
          isActive: input.isActive,
          updatedAt,
        },
      });
    }

    // Handle permission updates.
    if (Object.prototype.hasOwnProperty.call(input, "permissions")) {
      const permissions = normalizePermissions(input.permissions);

      await userRef.update({
        permissions,
        updatedAt,
        updatedBy: admin.uid,
      });

      return NextResponse.json({
        success: true,
        user: {
          uid,
          email: String(existing.email ?? ""),
          displayName: String(existing.displayName ?? ""),
          permissions,
          isActive: existing.isActive !== false,
          updatedAt,
        },
      });
    }

    return NextResponse.json(
      { error: "Provide either isActive or permissions." },
      { status: 400 }
    );
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
        { error: "You are not authorized to manage users." },
        { status: 403 }
      );
    }

    if (message === "ACCOUNT_STATUS_UPDATE_FAILED") {
      return NextResponse.json(
        { error: "Unable to update the Firebase account status." },
        { status: 502 }
      );
    }

    console.error("Managed-user update failed.", error);

    return NextResponse.json(
      { error: "Unable to update the managed user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const admin = await requireAdmin();
    const { uid } = await context.params;

    // Never allow deletion of the primary Admin account.
    if (!uid || (await isAdminUid(uid))) {
      return NextResponse.json(
        { error: "The primary Admin account cannot be deleted." },
        { status: 403 }
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

    // Delete the Firebase Authentication account first.
    await deleteManagedFirebaseUser(uid);

    // Remove the managed user's permissions record.
    await userRef.delete();

    return NextResponse.json({
      success: true,
      message: "Managed user deleted successfully.",
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
        { error: "Only the primary Admin can delete managed users." },
        { status: 403 }
      );
    }

    if (message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: "Firebase user not found." },
        { status: 404 }
      );
    }

    console.error("Managed-user deletion failed.", error);

    return NextResponse.json(
      {
        error:
          "Unable to complete user deletion. Check Firebase and Firestore status.",
      },
      { status: 500 }
    );
  }
}

