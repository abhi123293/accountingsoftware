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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin();

    const { id } = await params;
    const body = await request.json();

    const amount = Number(body.amount);
    const paymentDate =
      typeof body.paymentDate === "string" ? body.paymentDate : "";
    const method =
      typeof body.method === "string" ? body.method : "";
    const reference =
      typeof body.reference === "string" ? body.reference.trim() : "";

    const allowedMethods = [
      "cash",
      "bank_transfer",
      "card",
      "upi",
      "cheque",
      "other",
    ];

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) ||
      !Number.isFinite(Date.parse(`${paymentDate}T00:00:00Z`)) ||
      !allowedMethods.includes(method)
    ) {
      return NextResponse.json(
        { error: "Enter a valid amount, payment date, and method." },
        { status: 400 }
      );
    }

    const invoiceRef = firestore.collection("invoices").doc(id);
    const paymentRef = invoiceRef.collection("payments").doc();

    const result = await firestore.runTransaction(async (transaction) => {
      const invoiceDoc = await transaction.get(invoiceRef);

      if (!invoiceDoc.exists) throw new Error("INVOICE_NOT_FOUND");

      const invoice = (invoiceDoc.data() ?? {}) as Record<string, unknown>;
      const invoiceStatus = typeof invoice.status === "string" ? invoice.status : "draft";
      const invoiceDueDate = typeof invoice.dueDate === "string" ? invoice.dueDate : "";

      if (invoiceStatus === "draft") {
        throw new Error("ISSUE_INVOICE_FIRST");
      }

      if (invoiceStatus === "paid") {
        throw new Error("INVOICE_ALREADY_PAID");
      }

      const paymentsSnapshot = await transaction.get(
        invoiceRef.collection("payments")
      );

      const amountPaidCents = paymentsSnapshot.docs.reduce(
        (sum, doc) => {
          const payment = (doc.data() ?? {}) as Record<string, unknown>;
          return sum + Math.round(Number(payment.amount ?? 0) * 100);
        },
        0
      );

      const totalCents = Math.round(Number(invoice.total ?? 0) * 100);
      const paymentCents = Math.round(amount * 100);
      const balanceCents = totalCents - amountPaidCents;

      if (
        !Number.isFinite(totalCents) ||
        totalCents <= 0 ||
        balanceCents <= 0
      ) {
        throw new Error("INVALID_INVOICE_TOTAL");
      }

      if (paymentCents > balanceCents) {
        throw new Error("PAYMENT_EXCEEDS_BALANCE");
      }

      const newPaidCents = amountPaidCents + paymentCents;
      const newBalanceCents = totalCents - newPaidCents;
      const today = new Date().toISOString().slice(0, 10);

      const status =
        newBalanceCents === 0
          ? "paid"
          : invoiceDueDate < today
            ? "overdue"
            : "partially_paid";

      transaction.set(paymentRef, {
        amount: paymentCents / 100,
        paymentDate,
        method,
        reference,
        createdAt: new Date().toISOString(),
      });

      transaction.update(invoiceRef, {
        amountPaid: newPaidCents / 100,
        balanceDue: newBalanceCents / 100,
        status,
        updatedAt: new Date().toISOString(),
      });

      return {
        amountPaid: newPaidCents / 100,
        balanceDue: newBalanceCents / 100,
        status,
      };
    });

    await createNotification({
  title: result.status === "paid" ? "Invoice fully paid" : "Payment recorded",
  message:
    result.status === "paid"
      ? `Invoice ${id} has been fully paid.`
      : `A payment of ${new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount)} was recorded for invoice ${id}. Remaining balance: ${new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(result.balanceDue)}.`,
  type: result.status === "paid" ? "invoice_paid" : "payment_recorded",
  link: "/invoices",
  entityId: id,
});

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    const errors: Record<string, { error: string; status: number }> = {
      UNAUTHORIZED: {
        error: "Authentication required.",
        status: 401,
      },
      FORBIDDEN: {
        error: "Admin access required.",
        status: 403,
      },
      INVOICE_NOT_FOUND: {
        error: "Invoice not found.",
        status: 404,
      },
      ISSUE_INVOICE_FIRST: {
        error: "Issue the invoice before recording a payment.",
        status: 400,
      },
      INVOICE_ALREADY_PAID: {
        error: "This invoice is already paid.",
        status: 400,
      },
      INVALID_INVOICE_TOTAL: {
        error: "The invoice total or remaining balance is invalid.",
        status: 400,
      },
      PAYMENT_EXCEEDS_BALANCE: {
        error: "Payment cannot exceed the remaining balance.",
        status: 400,
      },
      FIREBASE_ADMIN_NOT_INITIALIZED: {
  error: "Firebase Admin is not initialized. Check your server configuration.",
  status: 500,
},
    };

    const knownError = errors[message];

    if (knownError) {
      return NextResponse.json(
        { error: knownError.error },
        { status: knownError.status }
      );
    }

    console.error("Record invoice payment error:", error);

    return NextResponse.json(
      { error: "Unable to record invoice payment." },
      { status: 500 }
    );
  }
}
