
import { NextResponse } from "next/server";
import { firestore } from "@/lib/firestore-rest";
import { requirePermission } from "@/lib/server-permissions";

type NotificationData = {
  title?: string;
  message?: string;
  type?: string;
  link?: string;
  entityId?: string | null;
  isRead?: boolean;
  createdAt?: string;
};

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("notifications.view");

    const { id } = await params;

    if (!id || id.includes("/")) {
      return NextResponse.json(
        { error: "Invalid notification ID." },
        { status: 400 }
      );
    }

    const notificationRef = firestore
      .collection("notifications")
      .doc(id);

    const notification = await notificationRef.get();

    if (!notification.exists) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      );
    }

    await notificationRef.update({ isRead: true });

    return NextResponse.json({ success: true });
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
        { error: "You do not have permission to update notifications." },
        { status: 403 }
      );
    }

    console.error("Mark notification read error:", error);

    return NextResponse.json(
      { error: "Unable to update notification." },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    await requirePermission("notifications.view");

    const snapshot = await firestore
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as NotificationData),
    }));

    const unreadCount = notifications.filter(
      (notification) => notification.isRead !== true
    ).length;

    return NextResponse.json(
      { notifications, unreadCount },
      { headers: { "Cache-Control": "no-store" } }
    );
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

    console.error("Get notifications error:", error);

    return NextResponse.json(
      { error: "Unable to load notifications." },
      { status: 500 }
    );
  }
}
