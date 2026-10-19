
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";
import { createNotification } from "@/lib/notifications";

async function verifyAdmin() {
  if (!adminAuth) {
    throw new Error("ADMIN_NOT_CONFIGURED");
  }

  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) throw new Error("UNAUTHORIZED");

const decoded = await adminAuth.verifySessionCookie(session, true);

  if (!(await isAdminUid(decoded.uid))) {
    throw new Error("FORBIDDEN");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin();

    const { id } = await params;
    const body = await request.json();

    if (body.status !== "sent") {
      return NextResponse.json(
        { error: "Only issuing a draft invoice is supported." },
        { status: 400 }
      );
    }

    const invoiceRef = firestore.collection("invoices").doc(id);
    const invoice = await invoiceRef.get();

    if (!invoice.exists) {
      return NextResponse.json(
        { error: "Invoice not found." },
        { status: 404 }
      );
    }

    if (invoice.data()?.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft invoices can be issued." },
        { status: 400 }
      );
    }

    await invoiceRef.update({
      status: "sent",
      sentAt: new Date().toISOString(),
    });

    await createNotification({
  title: "Invoice issued",
  message: `Invoice ${id} was issued successfully.`,
  type: "invoice_issued",
  link: "/invoices",
  entityId: id,
});

    return NextResponse.json({
      success: true,
      status: "sent",
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

    if (message === "FIREBASE_ADMIN_NOT_INITIALIZED") {
  return NextResponse.json(
    {
      error:
        "Firebase Admin is not initialized. Check your server configuration.",
    },
    { status: 500 }
  );
}
    

    console.error("Issue invoice error:", error);

    return NextResponse.json(
      { error: "Unable to issue invoice." },
      { status: 500 }
    );
  }
}
