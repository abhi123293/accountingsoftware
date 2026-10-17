
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";

async function verifyAdmin() {
  if (!adminAuth) {
    throw new Error("ADMIN_NOT_CONFIGURED");
  }

  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  const decoded = await adminAuth.verifySessionCookie(session, true);

  if (!isAdminUid(decoded.uid)) {
    throw new Error("FORBIDDEN");
  }
}

export async function GET() {
  try {
    await verifyAdmin();

    const snapshot = await firestore
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data() ?? {};

      return {
        id: doc.id,
        title: String(data.title ?? ""),
        message: String(data.message ?? ""),
        type: String(data.type ?? "general"),
        link: String(data.link ?? "/dashboard"),
        entityId: data.entityId ?? null,
        isRead: data.isRead === true,
        createdAt: String(data.createdAt ?? ""),
      };
    });

    const unreadCount = notifications.filter(
      (notification) => !notification.isRead
    ).length;

    return NextResponse.json({ notifications, unreadCount });
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

    console.error("Notifications GET error:", error);

    return NextResponse.json(
      { error: "Unable to load notifications." },
      { status: 500 }
    );
  }
}
