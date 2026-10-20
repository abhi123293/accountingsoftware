
import { NextResponse } from "next/server";
import { firestore } from "@/lib/firestore-rest";
import { createNotification } from "@/lib/notifications";
import {requirePermission,requireAdmin,} from "@/lib/server-permissions";


// async function verifyAdmin() {
//   if (!adminAuth) throw new Error("ADMIN_NOT_CONFIGURED");

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

  const knownErrors: Record<string, { error: string; status: number }> = {
    UNAUTHORIZED: { error: "Authentication required.", status: 401 },
    FORBIDDEN: {
  error: "You do not have permission to perform this action.",
  status: 403,
},
    INVOICE_NOT_FOUND: { error: "Invoice not found.", status: 404 },
    NOT_EDITABLE: {
      error: "Only draft invoices can be edited or deleted.",
      status: 400,
    },
    HAS_PAYMENTS: {
      error: "This invoice has payments and cannot be edited or deleted.",
      status: 409,
    },
    ADMIN_NOT_CONFIGURED: {
      error: "Admin authentication is not configured.",
      status: 500,
    },
  };

  const known = knownErrors[message];
  if (known) {
    return NextResponse.json(
      { error: known.error },
      { status: known.status }
    );
  }

  console.error("Invoice operation error:", error);
  return NextResponse.json(
    { error: "Unable to process invoice request." },
    { status: 500 }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("invoices.edit");

    const { id } = await params;
    const body = await request.json();
    const invoiceRef = firestore.collection("invoices").doc(id);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) throw new Error("INVOICE_NOT_FOUND");

    const invoice = invoiceDoc.data() ?? {};

    // Preserve the existing Issue Invoice operation.
    if (body.status === "sent") {
  await requireAdmin();
      if (invoice.status !== "draft") {
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

      return NextResponse.json({ success: true, status: "sent" });
    }

    // Editing is limited to draft invoices.
    if (invoice.status !== "draft") throw new Error("NOT_EDITABLE");

    const payments = await invoiceRef.collection("payments").get();
    if (!payments.empty) throw new Error("HAS_PAYMENTS");

    const customerId =
      typeof body.customerId === "string" ? body.customerId.trim() : "";
    const issueDate =
      typeof body.issueDate === "string" ? body.issueDate : "";
    const dueDate =
      typeof body.dueDate === "string" ? body.dueDate : "";
    const items = body.items;
    const taxRate = Number(body.taxRate ?? 0);

    if (
      !customerId ||
      !/^\d{4}-\d{2}-\d{2}$/.test(issueDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      dueDate < issueDate
    ) {
      return NextResponse.json(
        { error: "Enter a customer and valid invoice and due dates." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 100
    ) {
      return NextResponse.json(
        { error: "Add between 1 and 100 invoice line items." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(taxRate) ||
      taxRate < 0 ||
      taxRate > 100
    ) {
      return NextResponse.json(
        { error: "Tax rate must be between 0 and 100." },
        { status: 400 }
      );
    }

    const customerDoc = await firestore
      .collection("contacts")
      .doc(customerId)
      .get();

    if (!customerDoc.exists) {
      return NextResponse.json(
        { error: "Selected customer was not found." },
        { status: 400 }
      );
    }

    const customer = customerDoc.data() ?? {};

    if (!["customer", "both"].includes(String(customer.type))) {
      return NextResponse.json(
        { error: "The selected contact is not a customer." },
        { status: 400 }
      );
    }

    const normalizedItems = [];

    for (const item of items) {
      const description =
        typeof item.description === "string"
          ? item.description.trim()
          : "";
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      if (
        !description ||
        description.length > 300 ||
        !Number.isFinite(quantity) ||
        !Number.isFinite(unitPrice) ||
        quantity <= 0 ||
        unitPrice < 0 ||
        quantity > 1_000_000 ||
        unitPrice > 1_000_000_000
      ) {
        return NextResponse.json(
          { error: "Check each item's description, quantity, and price." },
          { status: 400 }
        );
      }

      const lineTotal =
        Math.round(quantity * unitPrice * 100) / 100;

      normalizedItems.push({
        description,
        quantity,
        unitPrice,
        lineTotal,
      });
    }

    const subtotalCents = normalizedItems.reduce(
      (sum, item) => sum + Math.round(item.lineTotal * 100),
      0
    );
    const taxCents = Math.round(subtotalCents * taxRate / 100);
    const totalCents = subtotalCents + taxCents;

    await invoiceRef.update({
      customerId,
      customerName: String(customer.name ?? ""),
      issueDate,
      dueDate,
      items: normalizedItems,
      subtotal: subtotalCents / 100,
      taxRate,
      tax: taxCents / 100,
      total: totalCents / 100,
      amountPaid: 0,
      balanceDue: totalCents / 100,
      updatedAt: new Date().toISOString(),
    });

    await createNotification({
      title: "Invoice updated",
      message: `Invoice ${String(invoice.invoiceNumber ?? id)} was updated.`,
      type: "invoice_updated",
      link: "/invoices",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("invoices.delete");

    const { id } = await params;
    const invoiceRef = firestore.collection("invoices").doc(id);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) throw new Error("INVOICE_NOT_FOUND");

    const invoice = invoiceDoc.data() ?? {};

    if (invoice.status !== "draft") throw new Error("NOT_EDITABLE");

    const payments = await invoiceRef.collection("payments").get();

    if (!payments.empty) throw new Error("HAS_PAYMENTS");

    await invoiceRef.delete();

    await createNotification({
      title: "Invoice deleted",
      message: `Draft invoice ${String(invoice.invoiceNumber ?? id)} was deleted.`,
      type: "invoice_deleted",
      link: "/invoices",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
