
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";
import { createNotification } from "@/lib/notifications";

const ACCOUNT_TYPES = ["asset","liability","equity","revenue","expense",];

async function verifyAdmin() {
  if (!adminAuth) {
    throw new Error("ADMIN_NOT_CONFIGURED");
  }

  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  // Verify as session cookie (created by /api/auth/session)
  const decoded = await adminAuth.verifySessionCookie(session, true);

  if (!isAdminUid(decoded.uid)) {
    throw new Error("FORBIDDEN");
  }
}

function handleError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 }
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 }
    );
  }

  console.error("Ledger API error:", error);

  return NextResponse.json(
    { error: "Unable to process journal entry." },
    { status: 500 }
  );
}

export async function GET() {
  try {
    await verifyAdmin();

    const snapshot = await firestore
      .collection("transactions")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin();

    const body = await request.json();
    const date = typeof body.date === "string" ? body.date : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";
    const lines = body.lines;

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !description ||
      description.length > 500 ||
      !Array.isArray(lines) ||
      lines.length < 2 ||
      lines.length > 100
    ) {
      return NextResponse.json(
        { error: "Enter valid journal entry details." },
        { status: 400 }
      );
    }

    const normalizedLines: {
      accountId: string;
      debit: number;
      credit: number;
    }[] = [];

    for (const line of lines) {
      const accountId =
        typeof line.accountId === "string" ? line.accountId.trim() : "";
      const debit = Number(line.debit);
      const credit = Number(line.credit);

      if (
        !accountId ||
        !Number.isFinite(debit) ||
        !Number.isFinite(credit) ||
        debit < 0 ||
        credit < 0 ||
        (debit > 0 && credit > 0) ||
        (debit === 0 && credit === 0)
      ) {
        return NextResponse.json(
          { error: "Each line needs an account and either a debit or credit." },
          { status: 400 }
        );
      }

      normalizedLines.push({ accountId, debit, credit });
    }

    const totalDebits = normalizedLines.reduce(
      (sum, line) => sum + Math.round(line.debit * 100),
      0
    );
    const totalCredits = normalizedLines.reduce(
      (sum, line) => sum + Math.round(line.credit * 100),
      0
    );

    if (totalDebits <= 0 || totalDebits !== totalCredits) {
      return NextResponse.json(
        { error: "Total debits must equal total credits." },
        { status: 400 }
      );
    }

    const accountsRef = firestore.collection("accounts");
    const accountSnapshots = await Promise.all(
      [...new Set(normalizedLines.map((line) => line.accountId))].map(
        (accountId) => accountsRef.doc(accountId).get()
      )
    );

    const accountMap = new Map<string, Record<string, unknown>>(
      accountSnapshots
        .filter((snapshot) => snapshot.exists)
        .map((snapshot) => [snapshot.id, (snapshot.data() ?? {}) as Record<string, unknown>])
    );

    for (const line of normalizedLines) {
      const account = accountMap.get(line.accountId);
      const accountType = typeof account?.type === "string" ? account.type : "";

      if (
        !account ||
        account.isActive === false ||
        !ACCOUNT_TYPES.includes(accountType as (typeof ACCOUNT_TYPES)[number])
      ) {
        return NextResponse.json(
          { error: `Invalid or inactive account: ${line.accountId}` },
          { status: 400 }
        );
      }
    }

    const entry = {
      date,
      description,
      lines: normalizedLines,
      totalDebits: totalDebits / 100,
      totalCredits: totalCredits / 100,
      status: "posted",
      createdAt: new Date().toISOString(),
    };

    const document = await firestore
      .collection("transactions")
      .add(entry);

      await createNotification({
  title: "Journal entry created",
  message: `${description} — total ${new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(totalDebits / 100)}.`,
  type: "ledger_created",
  link: "/ledger",
  entityId: document.id,
});

    return NextResponse.json(
      { entry: { id: document.id, ...entry } },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
