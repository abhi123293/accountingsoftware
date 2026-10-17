import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";

const RECORD_COLLECTIONS = ["accounts", "contacts", "invoices", "transactions"] as const;
const MAX_ITEMS_PER_COLLECTION = 20000;
const VALID_DOC_ID = /^[A-Za-z0-9_-]{1,1200}$/;

async function verifyAdmin() {
  if (!adminAuth) {
    throw new Error("ADMIN_NOT_CONFIGURED");
  }

  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) throw new Error("UNAUTHORIZED");

  const decoded = await adminAuth.verifySessionCookie(session, true);

  if (!isAdminUid(decoded.uid)) {
    throw new Error("FORBIDDEN");
  }
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
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  console.error("Data API error:", error);

  return NextResponse.json(
    { error: "Unable to process data request" },
    { status: 500 }
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  try {
    await verifyAdmin();

    const db = firestore;

    const [accountsSnap, contactsSnap, invoicesSnap, transactionsSnap] =
      await Promise.all([
        db.collection("accounts").get(),
        db.collection("contacts").get(),
        db.collection("invoices").get(),
        db.collection("transactions").get(),
      ]);

    const invoices = await Promise.all(
      invoicesSnap.docs.map(async (doc) => {
        const paymentsSnap = await doc.ref.collection("payments").get();
        return {
          id: doc.id,
          ...doc.data(),
          payments: paymentsSnap.docs.map((payment) => ({
            id: payment.id,
            ...payment.data(),
          })),
        };
      })
    );

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      accounts: accountsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      contacts: contactsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      invoices,
      transactions: transactionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin();

    const db = firestore;
    const body = await request.json().catch(() => null);

    if (!isPlainObject(body)) {
      return NextResponse.json(
        { error: "Invalid import payload." },
        { status: 400 }
      );
    }

    const collections = ["accounts", "contacts", "invoices", "transactions"];

    for (const name of collections) {
      const value = body[name];
      if (value !== undefined && !Array.isArray(value)) {
        return NextResponse.json(
          { error: `"${name}" must be an array.` },
          { status: 400 }
        );
      }
      if (Array.isArray(value) && value.length > MAX_ITEMS_PER_COLLECTION) {
        return NextResponse.json(
          { error: `"${name}" exceeds the maximum of ${MAX_ITEMS_PER_COLLECTION} items.` },
          { status: 400 }
        );
      }
    }

    const summary: Record<string, number> = {
      accounts: 0,
      contacts: 0,
      invoices: 0,
      transactions: 0,
      payments: 0,
    };
    let skipped = 0;

    const writer = db.bulkWriter();

    const writeItem = (
      collection: string,
      item: unknown,
      key: keyof typeof summary
    ) => {
      if (!isPlainObject(item)) {
        skipped += 1;
        return;
      }

      const { id, payments, ...data } = item as {
        id?: unknown;
        payments?: unknown;
        [key: string]: unknown;
      };

      const ref =
        typeof id === "string" && VALID_DOC_ID.test(id)
          ? db.collection(collection).doc(id)
          : db.collection(collection).doc();

      writer.set(ref, data);
      summary[key] += 1;
      return { ref, payments };
    };

    for (const item of (body.accounts as unknown[]) ?? []) {
      writeItem("accounts", item, "accounts");
    }

    for (const item of (body.contacts as unknown[]) ?? []) {
      writeItem("contacts", item, "contacts");
    }

    for (const item of (body.transactions as unknown[]) ?? []) {
      writeItem("transactions", item, "transactions");
    }

    for (const item of (body.invoices as unknown[]) ?? []) {
      const written = writeItem("invoices", item, "invoices");
      if (written && Array.isArray(written.payments)) {
        for (const payment of written.payments) {
          if (!isPlainObject(payment)) {
            skipped += 1;
            continue;
          }
          const { id, ...paymentData } = payment as {
            id?: unknown;
            [key: string]: unknown;
          };
          const paymentRef =
            typeof id === "string" && VALID_DOC_ID.test(id)
              ? written.ref.collection("payments").doc(id)
              : written.ref.collection("payments").doc();
          writer.set(paymentRef, paymentData);
          summary.payments += 1;
        }
      }
    }

    await writer.close();

    return NextResponse.json({ imported: summary, skipped });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE() {
  try {
    await verifyAdmin();

    const db = firestore;
    const writer = db.bulkWriter();
    let deleted = 0;

    const invoicesSnap = await db.collection("invoices").get();

    for (const doc of invoicesSnap.docs) {
      const paymentsSnap = await doc.ref.collection("payments").get();
      for (const payment of paymentsSnap.docs) {
        writer.delete(payment.ref);
        deleted += 1;
      }
      writer.delete(doc.ref);
      deleted += 1;
    }

    for (const name of RECORD_COLLECTIONS) {
      if (name === "invoices") continue;
      const snapshot = await db.collection(name).get();
      for (const doc of snapshot.docs) {
        writer.delete(doc.ref);
        deleted += 1;
      }
    }

    await writer.close();

    return NextResponse.json({ deleted });
  } catch (error) {
    return handleError(error);
  }
}
