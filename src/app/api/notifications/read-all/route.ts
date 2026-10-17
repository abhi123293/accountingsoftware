
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";

async function verifyAdmin() {
  if (!adminAuth) throw new Error("ADMIN_NOT_CONFIGURED");

  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) throw new Error("UNAUTHORIZED");

  const decoded = await adminAuth.verifySessionCookie(session, true);

  if (!isAdminUid(decoded.uid)) throw new Error("FORBIDDEN");
}

export async function POST() {
  try {
    await verifyAdmin();

    const snapshot = await firestore
      .collection("notifications")
      .where("isRead", "==", false)
      .limit(450)
      .get();

    if (!snapshot.empty) {
      const batch = firestore.batch();

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      updated: snapshot.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    console.error("Mark all notifications read error:", error);

    return NextResponse.json(
      { error: "Unable to update notifications." },
      { status: 500 }
    );
  }
}
