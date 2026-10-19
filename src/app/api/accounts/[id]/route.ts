
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

type RouteContext = {
  params: Promise<{ id: string }>;
};


async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) throw new Error("UNAUTHORIZED");

  const decoded = await adminAuth.verifySessionCookie(session, true);

  if (!(await isAdminUid(decoded.uid))) {
    throw new Error("FORBIDDEN");
  }
}


function handleError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Please sign in to continue." },
      { status: 401 }
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 }
    );
  }

  if (
  error instanceof Error &&
  error.message === "ADMIN_NOT_CONFIGURED"
) {
  return NextResponse.json(
    { error: "Firebase Admin is not configured correctly." },
    { status: 500 }
  );
}

  console.error("Account API error:", error);

  return NextResponse.json(
    { error: "Unable to process account request." },
    { status: 500 }
  );
}


async function isAccountUsed(accountId: string) {
  const snapshot = await firestore.collection("transactions").get();

  return snapshot.docs.some((document) => {
  const data = document.data() ?? {};
    const lines = Array.isArray(data.lines) ? data.lines : [];

    return lines.some(
      (line: { accountId?: unknown }) =>
        line?.accountId === accountId
    );
  });
}


export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await verifyAdmin();
const { id } = await context.params;
const accountRef = firestore.collection("accounts").doc(id);
    const accountSnapshot = await accountRef.get();

    if (!accountSnapshot.exists) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const current = (accountSnapshot.data() ?? {}) as Record<string, unknown>;

    const code =
      typeof body.code === "string" ? body.code.trim() : "";
    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const type = body.type as AccountType;

    if (
      !code ||
      !name ||
      code.length > 30 ||
      name.length > 150 ||
      !ACCOUNT_TYPES.includes(type)
    ) {
      return NextResponse.json(
        { error: "Enter a valid account code, name, and type." },
        { status: 400 }
      );
    }

    const accountsRef = firestore.collection("accounts");
    const duplicate = await accountsRef
      .where("code", "==", code)
      .get();

    if (duplicate.docs.some((document) => document.id !== id)) {
      return NextResponse.json(
        { error: "An account with this code already exists." },
        { status: 409 }
      );
    }

    const used = await isAccountUsed(id);

    if (used && type !== current.type) {
      return NextResponse.json(
        {
          error:
            "This account is used in journal entries. Its type cannot be changed.",
        },
        { status: 409 }
      );
    }

    await accountRef.update({ code, name, type });

    await createNotification({
  title: "Account updated",
  message: `${code} — ${name} was updated.`,
  type: "account_updated",
  link: "/accounts",
  entityId: id,
});

    return NextResponse.json({
      account: {
        id,
        code,
        name,
        type,
        isActive: current.isActive !== false,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    await verifyAdmin();
    const { id } = await context.params;
    const accountRef = firestore.collection("accounts").doc(id);
    const accountSnapshot = await accountRef.get();

    if (!accountSnapshot.exists) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    const used = await isAccountUsed(id);

    if (used) {
      await accountRef.update({ isActive: false });

      return NextResponse.json({
        message:
          "This account is used in journal entries, so it has been deactivated instead of deleted.",
        isActive: false,
      });
    }

    await createNotification({
  title: "Account deactivated",
  message: `${String(accountSnapshot.data()?.name ?? "Account")} was deactivated because it is used in journal entries.`,
  type: "account_deactivated",
  link: "/accounts",
  entityId: id,
});

    await accountRef.delete();

    await createNotification({
      title: "Account deleted",
      message: `${String(
        accountSnapshot.data()?.name ?? "Account"
      )} was deleted successfully.`,
      type: "account_deleted",
      link: "/accounts",
      entityId: id,
    });


    return NextResponse.json({
      message: "Account deleted successfully.",
    });
    
  } catch (error) {
    return handleError(error);
  }
}
