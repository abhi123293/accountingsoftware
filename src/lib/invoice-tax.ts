
import { firestore } from "@/lib/firestore-rest";

export type PricingMode = "inclusive" | "exclusive";

export type InvoiceTaxSettings = {
  defaultTaxRate: number;
  pricingMode: PricingMode;
  taxSummary: "itemized" | "compact" | "hidden";
  enabledTaxes: string[];
};

const ALLOWED_TAXES = [
  "CGST",
  "SGST",
  "IGST",
  "VAT",
  "SERVICE_TAX",
];

export async function getInvoiceTaxSettings(): Promise<InvoiceTaxSettings> {
  const snapshot = await firestore
    .collection("settings")
    .doc("tax")
    .get();

  const data = snapshot.exists ? snapshot.data() ?? {} : {};

  const defaultTaxRate = Number(data.defaultTaxRate ?? 0);

  return {
    defaultTaxRate:
      Number.isFinite(defaultTaxRate) &&
      defaultTaxRate >= 0 &&
      defaultTaxRate <= 100
        ? defaultTaxRate
        : 0,

    pricingMode:
      data.pricingMode === "inclusive" ? "inclusive" : "exclusive",

   taxSummary:
  data.taxSummary === "itemized" ||
  data.taxSummary === "compact" ||
  data.taxSummary === "hidden"
    ? data.taxSummary
    : "itemized",
    enabledTaxes: Array.isArray(data.enabledTaxes)
      ? data.enabledTaxes.filter(
          (tax: unknown): tax is string =>
            typeof tax === "string" && ALLOWED_TAXES.includes(tax)
        )
      : [],
  };
}

export function calculateInvoiceTotals(
  items: { lineTotal: number }[],
  taxRate: number,
  pricingMode: PricingMode
) {
  // Work in integer cents to reduce floating-point rounding errors.
  const enteredAmountCents = items.reduce(
    (sum, item) => sum + Math.round(item.lineTotal * 100),
    0
  );

  let subtotalCents: number;
  let taxCents: number;
  let totalCents: number;

  if (pricingMode === "inclusive") {
    // The entered price already includes tax.
    subtotalCents = Math.round(
      enteredAmountCents * 100 / (100 + taxRate)
    );

    taxCents = enteredAmountCents - subtotalCents;
    totalCents = enteredAmountCents;
  } else {
    // Tax is added to the entered price.
    subtotalCents = enteredAmountCents;
    taxCents = Math.round(subtotalCents * taxRate / 100);
    totalCents = subtotalCents + taxCents;
  }

  return {
    subtotal: subtotalCents / 100,
    tax: taxCents / 100,
    total: totalCents / 100,
    pricingMode,
  };
}
