import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"] as const;
const PAYMENT_TERMS = [
  "due_receipt",
  "net_7",
  "net_15",
  "net_30",
  "net_45",
  "net_60",
] as const;

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

  console.error("Accounting preferences API error:", error);

  return NextResponse.json(
    { error: "Unable to process accounting preferences request" },
    { status: 500 }
  );
}

const settingsDoc = () => {
  return firestore.collection("settings").doc("accounting");
};

export async function GET() {
  try {
    await verifyAdmin();

    const ref = settingsDoc();
    const snapshot = await ref.get();

    return NextResponse.json({
      settings: snapshot.exists ? snapshot.data() : {},
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin();

    const ref = settingsDoc();
    const body = await request.json().catch(() => null);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid accounting preferences payload." },
        { status: 400 }
      );
    }

    const baseCurrency =
      typeof body.baseCurrency === "string" ? body.baseCurrency.trim() : "";
    const fyStartDate =
      typeof body.fyStartDate === "string" ? body.fyStartDate.trim() : "";
    const dateFormat = body.dateFormat;
    const paymentTerms = body.paymentTerms;
    const invoiceFormat =
      typeof body.invoiceFormat === "string" ? body.invoiceFormat.trim() : "";
    const defaultSalesAccount =
      typeof body.defaultSalesAccount === "string"
        ? body.defaultSalesAccount.trim()
        : "";
    const defaultExpenseAccount =
      typeof body.defaultExpenseAccount === "string"
        ? body.defaultExpenseAccount.trim()
        : "";

    if (!/^[A-Z]{3}$/.test(baseCurrency)) {
      return NextResponse.json(
        { error: "Base currency must be a 3-letter ISO code (e.g., INR)." },
        { status: 400 }
      );
    }

    const fyMatch = /^(\d{2})-(\d{2})$/.exec(fyStartDate);
    if (
      !fyMatch ||
      Number(fyMatch[1]) < 1 ||
      Number(fyMatch[1]) > 12 ||
      Number(fyMatch[2]) < 1 ||
      Number(fyMatch[2]) > 31
    ) {
      return NextResponse.json(
        { error: "Financial year start date must be a valid MM-DD date." },
        { status: 400 }
      );
    }

    if (!(DATE_FORMATS as readonly string[]).includes(String(dateFormat))) {
      return NextResponse.json(
        { error: "Invalid date format." },
        { status: 400 }
      );
    }

    if (!(PAYMENT_TERMS as readonly string[]).includes(String(paymentTerms))) {
      return NextResponse.json(
        { error: "Invalid default payment terms." },
        { status: 400 }
      );
    }

    if (!invoiceFormat || invoiceFormat.length > 50) {
      return NextResponse.json(
        { error: "Invoice numbering format is required (max 50 characters)." },
        { status: 400 }
      );
    }

    if (!/^[A-Za-z0-9_\-{}]+$/.test(invoiceFormat)) {
      return NextResponse.json(
        {
          error:
            "Invoice numbering format may only contain letters, numbers, hyphens, underscores, and tokens like {YYYY} or {SEQ}.",
        },
        { status: 400 }
      );
    }

    if (!invoiceFormat.includes("{SEQ}")) {
      return NextResponse.json(
        { error: "Invoice numbering format must include the {SEQ} token." },
        { status: 400 }
      );
    }

    const accountsRef = firestore.collection("accounts");
    const accountIds = [defaultSalesAccount, defaultExpenseAccount].filter(
      Boolean
    );
    if (accountIds.length > 0) {
      const snapshots = await Promise.all(
        accountIds.map((id) => accountsRef.doc(id).get())
      );
      if (snapshots.some((snapshot) => !snapshot.exists)) {
        return NextResponse.json(
          { error: "One of the selected default accounts no longer exists." },
          { status: 400 }
        );
      }
    }

    const data = {
      baseCurrency,
      fyStartDate,
      dateFormat,
      paymentTerms,
      invoiceFormat,
      defaultSalesAccount,
      defaultExpenseAccount,
      updatedAt: new Date().toISOString(),
    };

    await ref.set(data, { merge: true });

    return NextResponse.json({ settings: data });
  } catch (error) {
    return handleError(error);
  }
}
