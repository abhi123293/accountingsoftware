
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";

type Account = {
  name?: string;
  type?: string;
  isActive?: boolean;
};

type JournalLine = {
  accountId?: string;
  debit?: number;
  credit?: number;
};

type Transaction = {
  date?: string;
  status?: string;
  lines?: JournalLine[];
};

function isValidDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

export async function GET(request: Request) {
  try {
    // Verify the administrator session.
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    if (!isAdminUid(decoded.uid)) {
      return NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 }
      );
    }

    // Validate the requested reporting period.
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return NextResponse.json(
        { error: "Valid startDate and endDate are required." },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "End date must be on or after start date." },
        { status: 400 }
      );
    }

    // Read accounts and transactions from Firestore.
    const [accountsSnapshot, transactionsSnapshot] =
      await Promise.all([
        firestore.collection("accounts").get(),
        firestore.collection("transactions").get(),
      ]);

    const accounts = new Map<string, Account>();

    accountsSnapshot.docs.forEach((doc) => {
      const account = doc.data() as Account;

      if (account.isActive !== false) {
        accounts.set(doc.id, account);
      }
    });

    const incomeTotals = new Map<string, number>();
    const expenseTotals = new Map<string, number>();

    // Aggregate posted journal entries for the selected dates.
    transactionsSnapshot.docs.forEach((doc) => {
      const transaction = doc.data() as Transaction;

      if (
        transaction.status !== "posted" ||
        !transaction.date ||
        transaction.date < startDate ||
        transaction.date > endDate ||
        !Array.isArray(transaction.lines)
      ) {
        return;
      }

      transaction.lines.forEach((line) => {
        if (!line.accountId) return;

        const account = accounts.get(line.accountId);
        if (!account) return;

        const debit = Number(line.debit ?? 0);
        const credit = Number(line.credit ?? 0);

        if (
          !Number.isFinite(debit) ||
          !Number.isFinite(credit) ||
          debit < 0 ||
          credit < 0
        ) {
          return;
        }

        // Revenue normally increases with credits.
        if (account.type === "revenue") {
          const amount = credit - debit;

          incomeTotals.set(
            line.accountId,
            (incomeTotals.get(line.accountId) ?? 0) + amount
          );
        }

        // Expenses normally increase with debits.
        if (account.type === "expense") {
          const amount = debit - credit;

          expenseTotals.set(
            line.accountId,
            (expenseTotals.get(line.accountId) ?? 0) + amount
          );
        }
      });
    });

    const toLines = (totals: Map<string, number>) =>
      Array.from(totals.entries())
        .map(([accountId, amount]) => ({
          accountId,
          accountName: accounts.get(accountId)?.name ?? "Unnamed account",
          amount: Math.round((amount + Number.EPSILON) * 100) / 100,
        }))
        .filter((line) => line.amount !== 0)
        .sort((a, b) => a.accountName.localeCompare(b.accountName));

    const incomeAccounts = toLines(incomeTotals);
    const expenseAccounts = toLines(expenseTotals);

    const sum = (lines: { amount: number }[]) =>
      Math.round(
        (lines.reduce((total, line) => total + line.amount, 0) +
          Number.EPSILON) *
          100
      ) / 100;

    const revenue = sum(incomeAccounts);
    const expenses = sum(expenseAccounts);

    return NextResponse.json({
      startDate,
      endDate,
      revenue,
      expenses,
      netProfit: Math.round((revenue - expenses + Number.EPSILON) * 100) / 100,
      incomeAccounts,
      expenseAccounts,
    });
  } catch (error) {
    console.error("Profit & Loss API error:", error);

    if (
      error instanceof Error &&
      (error.message.includes("session cookie") ||
        error.message.includes("Session cookie"))
    ) {
      return NextResponse.json(
        { error: "Your session has expired. Please sign in again." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Unable to generate the Profit & Loss report." },
      { status: 500 }
    );
  }
}
