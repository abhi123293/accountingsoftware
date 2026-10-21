
import { NextResponse } from "next/server";
import { firestore } from "@/lib/firestore-rest";
import { requirePermission } from "@/lib/server-permissions";

export async function GET() {
  try {
    const access = await requirePermission("notifications.view");

    const preferencesDoc = await firestore
      .collection("notificationPreferences")
      .doc(access.uid)
      .get();

    const preferences = preferencesDoc.data() ?? {};

    if (preferences.inAppEnabled === false) {
      return NextResponse.json(
        {
          notifications: [],
          unreadCount: 0,
          inAppEnabled: false,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const snapshot = await firestore
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const statesSnapshot = await firestore
      .collection("userNotificationStates")
      .where("userId", "==", access.uid)
      .limit(450)
      .get();

   
const readStateByNotificationId = new Map<string, boolean>();
const clearedNotificationIds = new Set<string>();

statesSnapshot.docs.forEach((doc) => {
  const state = doc.data() ?? {};

  if (typeof state.notificationId === "string") {
    readStateByNotificationId.set(
      state.notificationId,
      state.isRead === true
    );

    if (state.isCleared === true) {
      clearedNotificationIds.add(state.notificationId);
    }
  }
});



const notifications = snapshot.docs
  .filter((doc) => !clearedNotificationIds.has(doc.id))
  .map((doc) => {
    const data = doc.data() ?? {};

    return {
      id: doc.id,
      title: String(data.title ?? ""),
      message: String(data.message ?? ""),
      type: String(data.type ?? "general"),
      link: String(data.link ?? "/dashboard"),
      entityId: data.entityId ?? null,
      isRead: readStateByNotificationId.get(doc.id) === true,
      createdAt: String(data.createdAt ?? ""),
    };
  });

const unreadCount = notifications.filter(
  (notification) => !notification.isRead
).length;


    return NextResponse.json(
      { notifications, unreadCount, inAppEnabled: true },
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

    console.error("Notifications GET error:", error);

    return NextResponse.json(
      { error: "Unable to load notifications." },
      { status: 500 }
    );
  }
}
