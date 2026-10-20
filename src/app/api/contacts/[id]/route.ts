import { NextResponse } from "next/server";
import { firestore } from "@/lib/firestore-rest";
import { createNotification } from "@/lib/notifications";
import { requirePermission } from "@/lib/server-permissions";

const CONTACT_TYPES = ["customer", "vendor", "both"] as const;

type RouteContext = {
  params: Promise<{ id: string }>;
};

// async function verifyAdmin() {
//   if (!adminAuth) {
//     throw new Error("FIREBASE_ADMIN_NOT_INITIALIZED");
//   }

//   const cookieStore = await cookies();
//   const session = cookieStore.get("__session")?.value;

//   if (!session) throw new Error("UNAUTHORIZED");

//   const decoded = await adminAuth.verifySessionCookie(session, true);

//   if (!(await isAdminUid(decoded.uid))) {
//     throw new Error("FORBIDDEN");
//   }
// }

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

if (message === "FORBIDDEN") {
  return NextResponse.json(
    { error: "You do not have permission to perform this action." },
    { status: 403 }
  );
}

  if (message === "FIREBASE_ADMIN_NOT_INITIALIZED") {
    return NextResponse.json(
      { error: "Authentication service is not configured." },
      { status: 503 }
    );
  }

  if (message === "FIREBASE_DB_NOT_INITIALIZED") {
    return NextResponse.json(
      { error: "Database service is not configured." },
      { status: 503 }
    );
  }

  console.error("Contact item API error:", error);

  return NextResponse.json(
    { error: "Unable to process contact request" },
    { status: 500 }
  );
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    await requirePermission("contacts.edit");

    const { id } = await params;
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim() : "";
    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";
    const type = body.type;

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required." },
        { status: 400 }
      );
    }

    if (!name || name.length > 150) {
      return NextResponse.json(
        { error: "Enter a valid contact name." },
        { status: 400 }
      );
    }

    if (email.length > 254) {
      return NextResponse.json(
        { error: "Email address is too long." },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    if (
      !CONTACT_TYPES.includes(
        type as (typeof CONTACT_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Choose a valid contact type." },
        { status: 400 }
      );
    }

    const contactRef = firestore.collection("contacts").doc(id);
    const contactDoc = await contactRef.get();

    if (!contactDoc.exists) {
      return NextResponse.json(
        { error: "Contact not found." },
        { status: 404 }
      );
    }

    await contactRef.update({
      name,
      email,
      phone,
      type,
      updatedAt: new Date().toISOString(),
    });

    await createNotification({
  title: "Contact updated",
  message: `${name}'s contact details were updated.`,
  type: "contact_updated",
  link: "/contacts",
  entityId: id,
});

    return NextResponse.json({
      contact: {
        id,
        name,
        email,
        phone,
        type,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    await requirePermission("contacts.delete");

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required." },
        { status: 400 }
      );
    }

    const contactRef = firestore.collection("contacts").doc(id);
    const contactDoc = await contactRef.get();

    if (!contactDoc.exists) {
      return NextResponse.json(
        { error: "Contact not found." },
        { status: 404 }
      );
    }

    const deletedName = String(contactDoc.data()?.name ?? "Contact");

    const notificationRef = firestore.collection("notifications").doc();
    const batch = firestore.batch();
    batch.delete(contactRef);
    batch.set(notificationRef, {
      title: "Contact deleted",
      message: `${deletedName} was deleted.`,
      type: "contact_deleted",
      link: "/contacts",
      entityId: id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    await batch.commit();

    return NextResponse.json({ message: "Contact deleted successfully." });
  } catch (error) {
    return handleError(error);
  }
}