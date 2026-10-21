
import { NextResponse } from "next/server";
import { firestore } from "@/lib/firestore-rest";
import { requirePermission } from "@/lib/server-permissions";

export async function POST() {
  try {
    const access = await requirePermission("notifications.view");

    const snapshot = await firestore
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(450)
      .get();

    if (!snapshot.empty) {
      const batch = firestore.batch();

      snapshot.docs.forEach((doc) => {
        const stateId = `${access.uid}_${doc.id}`;

        batch.set(
          firestore
            .collection("userNotificationStates")
            .doc(stateId),
          {
            userId: access.uid,
            notificationId: doc.id,
            isRead: true,
            isCleared: true,
            updatedAt: new Date().toISOString(),
          }
        );
      });

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      cleared: snapshot.size,
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
        { error: "You do not have permission to clear notifications." },
        { status: 403 }
      );
    }

    console.error("Clear notifications error:", error);

    return NextResponse.json(
      { error: "Unable to clear notifications." },
      { status: 500 }
    );
  }
}
