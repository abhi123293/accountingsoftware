
import { NextResponse } from "next/server";
import { firestore } from "@/lib/firestore-rest";
import { requirePermission } from "@/lib/server-permissions";

const CONTACT_TYPES = ["customer", "vendor", "both"] as const;

// async function verifyAdmin() {
//   if (!adminAuth) {
//     throw new Error("ADMIN_NOT_CONFIGURED");
//   }

//   const cookieStore = await cookies();
//   const session = cookieStore.get("__session")?.value;

//   if (!session) throw new Error("UNAUTHORIZED");

//   // Verify as session cookie (created by /api/auth/session)
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

  console.error("Contacts API error:", error);

  return NextResponse.json(
    { error: "Unable to process contacts request" },
    { status: 500 }
  );
}

export async function GET() {
  try {
    await requirePermission("contacts.view");

    const snapshot = await firestore.collection("contacts").get();

    const contacts = snapshot.docs.map((doc) => {
      const data = doc.data() ?? {};

      return {
        id: doc.id,
        name: String(data.name ?? ""),
        email: String(data.email ?? ""),
        phone: String(data.phone ?? ""),
        type: String(data.type ?? "customer"),
      };
    });

    contacts.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ contacts });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission("contacts.create");

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim() : "";
    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";
    const type = body.type;

    if (!name || name.length > 150) {
      return NextResponse.json(
        { error: "Enter a valid contact name." },
        { status: 400 }
      );
    }

    if (email.length > 254 || phone.length > 30) {
      return NextResponse.json(
        { error: "Email or phone number is too long." },
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
        {
          error: "Enter a valid 10-digit Indian mobile number.",
        },
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

    const contactData = {
      name,
      email,
      phone,
      type,
      createdAt: new Date().toISOString(),
    };

    const document = firestore.collection("contacts").doc();
    const notification = firestore.collection("notifications").doc();
    const batch = firestore.batch();
    batch.set(document, contactData);
    batch.set(notification, {
      title: "Contact created",
      message: `${name} was added as a ${type}.`,
      type: "contact_created",
      link: "/contacts",
      entityId: document.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    await batch.commit();

    return NextResponse.json(
      {
        contact: {
          id: document.id,
          ...contactData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
