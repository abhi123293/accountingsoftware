import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";
import { createNotification } from "@/lib/notifications";

const ACCOUNT_TYPES = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
] as const;

type AccountType = (typeof ACCOUNT_TYPES)[number];

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) throw new Error("UNAUTHORIZED");

  const decoded = await adminAuth.verifySessionCookie(session, true);
  if (!(await isAdminUid(decoded.uid))) throw new Error("FORBIDDEN");
}

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Please sign in to continue." },
      { status: 401 }
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 }
    );
  }

  console.error("Accounts API error:", error);
  return NextResponse.json(
    { error: "Unable to process accounts request." },
    { status: 500 }
  );
}

export async function GET() {
  try {
    await verifyAdmin();

    const snapshot = await firestore.collection("accounts").get();
    const accounts = snapshot.docs.map((document) => {
      const data = document.data() ?? {};
      return {
        id: document.id,
        code: String(data.code ?? ""),
        name: String(data.name ?? ""),
        type: data.type as AccountType,
        isActive: data.isActive !== false,
      };
    });

    accounts.sort((a, b) => a.code.localeCompare(b.code));
    return NextResponse.json({ accounts });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin();
    const body: unknown = await request.json().catch(() => null);

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid account details." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const code = typeof input.code === "string" ? input.code.trim() : "";
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const type = input.type;

    if (!code || !name || code.length > 30 || name.length > 150) {
      return NextResponse.json(
        { error: "Enter a valid account code and name." },
        { status: 400 }
      );
    }

    if (
      typeof type !== "string" ||
      !(ACCOUNT_TYPES as readonly string[]).includes(type)
    ) {
      return NextResponse.json(
        { error: "Select a valid account type." },
        { status: 400 }
      );
    }

    const accounts = firestore.collection("accounts");
    const document = accounts.doc();
    const account = {
      code,
      name,
      type: type as AccountType,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(
        accounts.where("code", "==", code)
      );

      if (!existing.empty) throw new Error("DUPLICATE_ACCOUNT_CODE");
      transaction.set(document, account);
    });

    await createNotification({
      title: "Account created",
      message: `${account.code} — ${account.name} was added to the chart of accounts.`,
      type: "account_created",
      link: "/accounts",
      entityId: document.id,
    });

    return NextResponse.json(
      { account: { id: document.id, ...account } },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "DUPLICATE_ACCOUNT_CODE"
    ) {
      return NextResponse.json(
        { error: "An account with this code already exists." },
        { status: 409 }
      );
    }
    return handleError(error);
  }
}
