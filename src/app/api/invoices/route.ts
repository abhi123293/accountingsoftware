
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";
import { createNotification } from "@/lib/notifications";
import { requirePermission } from "@/lib/server-permissions";
import {getInvoiceTaxSettings,calculateInvoiceTotals,} from "@/lib/invoice-tax";

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


async function verifyInvoicePermission(
  permission: "invoices.view" | "invoices.create"
) {
  await requirePermission(permission);
}


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

  if (
    message === "INVALID_ISSUE_DATE" ||
    message === "INVALID_INVOICE_FORMAT" ||
    message === "INVALID_INVOICE_SEQUENCE"
  ) {
    return NextResponse.json(
      { error: "Invalid invoice numbering settings or invoice date." },
      { status: 400 }
    );
  }


  console.error("Invoices API error:", error);

  return NextResponse.json(
    { error: "Unable to process invoices request" },
    { status: 500 }
  );
}



async function createInvoiceWithNumber(
  invoiceData: Record<string, unknown>,
  issueDate: string
): Promise<{ id: string; invoiceNumber: string }> {
  const yearMatch = /^(\d{4})-\d{2}-\d{2}$/.exec(issueDate);

  if (!yearMatch) {
    throw new Error("INVALID_ISSUE_DATE");
  }

  const year = yearMatch[1];
  const settingsRef = firestore.collection("settings").doc("accounting");

  return firestore.runTransaction(async (transaction) => {
    const settingsSnapshot = await transaction.get(settingsRef);
    const settings = settingsSnapshot.data();

    const configuredFormat =
      typeof settings.invoiceFormat === "string"
        ? settings.invoiceFormat
        : "INV-{YYYY}-{SEQ}";

    if (
      configuredFormat.length > 50 ||
      !configuredFormat.includes("{SEQ}") ||
      !/^[A-Za-z0-9_{}-]+$/.test(configuredFormat) ||
      /\{(?!YYYY\}|SEQ\})[^{}]*\}/.test(configuredFormat)
    ) {
      throw new Error("INVALID_INVOICE_FORMAT");
    }

    const counterKey = configuredFormat.includes("{YYYY}")
      ? year
      : "global";

    const counterRef = firestore
      .collection("invoiceSequences")
      .doc(counterKey);

    const counterSnapshot = await transaction.get(counterRef);

    const previousSequence = counterSnapshot.exists
      ? Number(counterSnapshot.data().lastSequence ?? 0)
      : 0;

    if (
      !Number.isSafeInteger(previousSequence) ||
      previousSequence < 0 ||
      previousSequence >= Number.MAX_SAFE_INTEGER
    ) {
      throw new Error("INVALID_INVOICE_SEQUENCE");
    }

    const nextSequence = previousSequence + 1;

    const invoiceNumber = configuredFormat
      .replaceAll("{YYYY}", year)
      .replaceAll("{SEQ}", String(nextSequence).padStart(4, "0"));

    const invoiceRef = firestore.collection("invoices").doc();

    transaction.set(counterRef, {
      lastSequence: nextSequence,
      updatedAt: new Date().toISOString(),
    });

    transaction.set(invoiceRef, {
      ...invoiceData,
      invoiceNumber,
    });

    return {
      id: invoiceRef.id,
      invoiceNumber,
    };
  });
}



export async function GET() {
  try {
    await verifyInvoicePermission("invoices.view");

    const snapshot = await firestore.collection("invoices").get();

    const invoices = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        invoiceNumber: String(data.invoiceNumber ?? ""),
        customerId: String(data.customerId ?? ""),
        customerName: String(data.customerName ?? ""),
        issueDate: String(data.issueDate ?? ""),
        dueDate: String(data.dueDate ?? ""),
        items: Array.isArray(data.items) ? data.items : [],
        subtotal: Number(data.subtotal ?? 0),
        taxRate: Number(data.taxRate ?? 0),
        tax: Number(data.tax ?? 0),
        total: Number(data.total ?? 0),
        status: String(data.status ?? "draft"),
        amountPaid: data.amountPaid ?? 0,
balanceDue: data.balanceDue ?? data.total ?? 0,
      };
    });

    invoices.sort((a, b) =>
      b.issueDate.localeCompare(a.issueDate)
    );

    return NextResponse.json({ invoices });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await verifyInvoicePermission("invoices.create");

    const body = await request.json();

    const customerId =
      typeof body.customerId === "string"
        ? body.customerId.trim()
        : "";

    const issueDate =
      typeof body.issueDate === "string" ? body.issueDate : "";

    const dueDate =
      typeof body.dueDate === "string" ? body.dueDate : "";

    const items = body.items;

    if (!customerId) {
      return NextResponse.json(
        { error: "Select a customer." },
        { status: 400 }
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(issueDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      dueDate < issueDate
    ) {
      return NextResponse.json(
        { error: "Enter valid invoice and due dates." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      return NextResponse.json(
        { error: "Add between 1 and 100 invoice line items." },
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

    const customer = customerDoc.data()!;

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
        quantity > 1000000 ||
        unitPrice > 1000000000
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

    // const subtotalCents = normalizedItems.reduce(
    //   (sum, item) =>
    //     sum + Math.round(item.lineTotal * 100),
    //   0
    // );

   
const taxSettings = await getInvoiceTaxSettings();

const taxRate = Number(
  body.taxRate ?? taxSettings.defaultTaxRate
);

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

const totals = calculateInvoiceTotals(
  normalizedItems,
  taxRate,
  taxSettings.pricingMode
);


const invoiceData: Record<string, unknown> = {
  customerId,
  customerName: String(customer.name ?? ""),
  issueDate,
  dueDate,
  items: normalizedItems,
  subtotal: totals.subtotal,
  taxRate,
  tax: totals.tax,
  total: totals.total,
  taxSettingsSnapshot: {
    pricingMode: taxSettings.pricingMode,
    taxSummary: taxSettings.taxSummary,
    enabledTaxes: taxSettings.enabledTaxes,
  },
  status: "draft",
  amountPaid: 0,
  balanceDue: totals.total,
  createdAt: new Date().toISOString(),
};

const createdInvoice = await createInvoiceWithNumber(
  invoiceData,
  issueDate
);

await createNotification({
  title: "Invoice created",
  message: `${createdInvoice.invoiceNumber} was created for ${String(
    customer.name ?? "customer"
  )}.`,
  type: "invoice_created",
  link: "/invoices",
  entityId: createdInvoice.id,
});

return NextResponse.json(
  {
    invoice: {
      id: createdInvoice.id,
      ...invoiceData,
      invoiceNumber: createdInvoice.invoiceNumber,
    },
  },
  { status: 201 }
);

  } catch (error) {
    return handleError(error);
  }
}
