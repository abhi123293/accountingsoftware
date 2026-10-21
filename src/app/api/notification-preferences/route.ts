
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/server-permissions";
import { firestore } from "@/lib/firestore-rest";

type NotificationPreferences = {
  emailEnabled: boolean;
  inAppEnabled: boolean;
};

const defaults: NotificationPreferences = {
  emailEnabled: true,
  inAppEnabled: true,
};

export async function GET() {
  try {
    const access = await requirePermission("settings.notifications.view");

    const snapshot = await firestore
      .collection("notificationPreferences")
      .doc(access.uid)
      .get();

    const data = snapshot.exists ? snapshot.data() : {};

    return NextResponse.json({
      preferences: {
        emailEnabled:
          typeof data?.emailEnabled === "boolean"
            ? data.emailEnabled
            : defaults.emailEnabled,
        inAppEnabled:
          typeof data?.inAppEnabled === "boolean"
            ? data.inAppEnabled
            : defaults.inAppEnabled,
      },
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
        { error: "You do not have permission to view notification settings." },
        { status: 403 }
      );
    }

    console.error("Load notification preferences error:", error);

    return NextResponse.json(
      { error: "Unable to load notification preferences." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requirePermission("settings.notifications.edit");
    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      (typeof body.emailEnabled !== "boolean" &&
        typeof body.inAppEnabled !== "boolean")
    ) {
      return NextResponse.json(
        { error: "Provide at least one valid notification preference." },
        { status: 400 }
      );
    }

    const updates: Partial<NotificationPreferences> = {};

    if (typeof body.emailEnabled === "boolean") {
      updates.emailEnabled = body.emailEnabled;
    }

    if (typeof body.inAppEnabled === "boolean") {
      updates.inAppEnabled = body.inAppEnabled;
    }

    await firestore
      .collection("notificationPreferences")
      .doc(access.uid)
      .set(
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    const snapshot = await firestore
      .collection("notificationPreferences")
      .doc(access.uid)
      .get();

    const data = snapshot.data() ?? {};

    return NextResponse.json({
      preferences: {
        emailEnabled:
          typeof data.emailEnabled === "boolean"
            ? data.emailEnabled
            : defaults.emailEnabled,
        inAppEnabled:
          typeof data.inAppEnabled === "boolean"
            ? data.inAppEnabled
            : defaults.inAppEnabled,
      },
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
        { error: "You do not have permission to edit notification settings." },
        { status: 403 }
      );
    }

    console.error("Save notification preferences error:", error);

    return NextResponse.json(
      { error: "Unable to save notification preferences." },
      { status: 500 }
    );
  }
}
