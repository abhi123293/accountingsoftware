
import { NextResponse } from "next/server";
import {
  getCurrentAccess,
  requireAdmin,
  requirePermission,
} from "@/lib/server-permissions";
import { firestore } from "@/lib/firestore-rest";

const ALLOWED_TAXES = ["CGST", "SGST", "IGST", "VAT", "SERVICE_TAX"] as const;
const PRICING_MODES = ["inclusive", "exclusive"] as const;
const TAX_SUMMARY_MODES = ["itemized", "compact", "hidden"] as const;

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

  if (message === "ADMIN_NOT_CONFIGURED") {
    return NextResponse.json(
      { error: "Authentication service is not configured." },
      { status: 503 }
    );
  }

  console.error("Tax settings API error:", error);

  return NextResponse.json(
    { error: "Unable to process tax settings request" },
    { status: 500 }
  );
}

const settingsDoc = () => firestore.collection("settings").doc("tax");

export async function GET() {
  try {
    // Active admins can access all settings.
    // Other users must have permission to create invoices.
    const access = await getCurrentAccess();

    if (!access.isAdmin) {
      await requirePermission("invoices.create");
    }

    const snapshot = await settingsDoc().get();

    return NextResponse.json({
      settings: snapshot.exists ? snapshot.data() : {},
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    // Only admins can change global tax settings.
    await requireAdmin();

    const body = await request.json().catch(() => null);

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
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
        {
          error:
            "Tax identification number may only contain letters and numbers.",
        },
        { status: 400 }
      );
    }

    if (taxRegistrationDetails.length > 300) {
      return NextResponse.json(
        {
          error:
            "Tax registration details must be 300 characters or fewer.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(defaultTaxRate) ||
      defaultTaxRate < 0 ||
      defaultTaxRate > 100
    ) {
      return NextResponse.json(
        { error: "Default tax rate must be between 0 and 100." },
        { status: 400 }
      );
    }

    if (
      !(PRICING_MODES as readonly string[]).includes(String(pricingMode))
    ) {
      return NextResponse.json(
        { error: "Pricing mode must be inclusive or exclusive." },
        { status: 400 }
      );
    }

    if (
      !(TAX_SUMMARY_MODES as readonly string[]).includes(String(taxSummary))
    ) {
      return NextResponse.json(
        { error: "Invalid tax summary preference." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(enabledTaxes) ||
      enabledTaxes.length > ALLOWED_TAXES.length ||
      new Set(enabledTaxes).size !== enabledTaxes.length ||
      enabledTaxes.some(
        (tax: unknown) =>
          typeof tax !== "string" ||
          !(ALLOWED_TAXES as readonly string[]).includes(tax)
      )
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
      enabledTaxes,
      updatedAt: new Date().toISOString(),
    };

    await settingsDoc().set(data, { merge: true });

    return NextResponse.json({ settings: data });
  } catch (error) {
    return handleError(error);
  }
}
