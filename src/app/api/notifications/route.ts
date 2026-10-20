
import { NextResponse } from "next/server";
import { firestore } from "@/lib/firestore-rest";
import { requirePermission } from "@/lib/server-permissions";

export async function GET() {
  try {
    await requirePermission("notifications.view");

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
        { error: "You do not have permission to view notifications." },
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
