import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";

const ALLOWED_TAXES = ["CGST", "SGST", "IGST", "VAT", "SERVICE_TAX"] as const;
const PRICING_MODES = ["inclusive", "exclusive"] as const;
const TAX_SUMMARY_MODES = ["itemized", "compact", "hidden"] as const;

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

  console.error("Tax settings API error:", error);

  return NextResponse.json(
    { error: "Unable to process tax settings request" },
    { status: 500 }
  );
}

const settingsDoc = () => {
  return firestore.collection("settings").doc("tax");
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
        { error: "Invalid tax settings payload." },
        { status: 400 }
      );
    }

    const gstin =
      typeof body.gstin === "string" ? body.gstin.trim() : "";
    const taxRegistrationDetails =
      typeof body.taxRegistrationDetails === "string"
        ? body.taxRegistrationDetails.trim()
        : "";
    const defaultTaxRate = Number(body.defaultTaxRate);
    const pricingMode = body.pricingMode;
    const taxSummary = body.taxSummary;
    const enabledTaxes = body.enabledTaxes;

    if (gstin.length > 30) {
      return NextResponse.json(
        { error: "Tax identification number must be 30 characters or fewer." },
        { status: 400 }
      );
    }

    if (gstin && !/^[0-9A-Za-z]+$/.test(gstin)) {
      return NextResponse.json(
        { error: "Tax identification number may only contain letters and numbers." },
        { status: 400 }
      );
    }

    if (taxRegistrationDetails.length > 300) {
      return NextResponse.json(
        { error: "Tax registration details must be 300 characters or fewer." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(defaultTaxRate) || defaultTaxRate < 0 || defaultTaxRate > 100) {
      return NextResponse.json(
        { error: "Default tax rate must be between 0 and 100." },
        { status: 400 }
      );
    }

    if (!(PRICING_MODES as readonly string[]).includes(String(pricingMode))) {
      return NextResponse.json(
        { error: "Pricing mode must be inclusive or exclusive." },
        { status: 400 }
      );
    }

    if (!(TAX_SUMMARY_MODES as readonly string[]).includes(String(taxSummary))) {
      return NextResponse.json(
        { error: "Invalid tax summary preference." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(enabledTaxes) ||
      enabledTaxes.length > ALLOWED_TAXES.length ||
      enabledTaxes.some((tax) => !(ALLOWED_TAXES as readonly string[]).includes(String(tax)))
    ) {
      return NextResponse.json(
        { error: "Invalid enabled taxes list." },
        { status: 400 }
      );
    }

    const data = {
      gstin,
      taxRegistrationDetails,
      defaultTaxRate,
      pricingMode,
      taxSummary,
      enabledTaxes: enabledTaxes.map(String),
      updatedAt: new Date().toISOString(),
    };

    await ref.set(data, { merge: true });

    return NextResponse.json({ settings: data });
  } catch (error) {
    return handleError(error);
  }
}
