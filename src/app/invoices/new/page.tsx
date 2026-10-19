
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  FileText,
} from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useRequireAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Customer = {
  id: string;
  name: string;
  type: string;
};

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

export default function NewInvoicePage() {
  const { loading: authLoading } = useRequireAuth();
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [taxRate, setTaxRate] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

 useEffect(() => {
  if (authLoading) return;

  fetch("/api/contacts")
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load customers.");
      }

      setCustomers(
        (data.contacts ?? []).filter(
          (contact: Customer) =>
            contact.type === "customer" || contact.type === "both"
        )
      );
    })
    .catch((err) => {
      setError(
        err instanceof Error ? err.message : "Unable to load customers."
      );
    })
    .finally(() => setCustomersLoading(false));
}, [authLoading]);

  const subtotal = items.reduce(
    (sum, item) =>
      sum + Math.max(0, item.quantity) * Math.max(0, item.unitPrice),
    0
  );
  const tax = subtotal * taxRate / 100;
  const total = subtotal + tax;

  function updateItem(
    index: number,
    field: keyof InvoiceItem,
    value: string
  ) {
    setItems((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]:
                field === "description" ? value : Number(value),
            }
          : item
      )
    );
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    if (dueDate < issueDate) {
      setError("Due date cannot be earlier than the invoice date.");
      return;
    }

    if (
      items.some(
        (item) =>
          !item.description.trim() ||
          !Number.isFinite(item.quantity) ||
          !Number.isFinite(item.unitPrice) ||
          item.quantity <= 0 ||
          item.unitPrice < 0
      )
    ) {
      setError("Enter a description, positive quantity, and valid price for every item.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          issueDate,
          dueDate,
          taxRate,
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create invoice.");
      }

      router.push("/invoices");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create invoice."
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }


return (
  <div className="flex min-h-screen w-full min-w-0 bg-background text-foreground">
    <div className="hidden shrink-0 md:block">
      <Sidebar />
    </div>

    <main className="min-w-0 flex-1">
      <Header />


        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <button
            type="button"
            onClick={() => router.push("/invoices")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </button>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create Invoice
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add customer details and invoice line items.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Invoice Details</h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="customer" className="text-sm font-medium">
                    Customer *
                  </label>
                  <select
                    id="customer"
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    required
                    disabled={customersLoading}
                  >
                    <option value="">
                      {customersLoading
                        ? "Loading customers..."
                        : "Select customer"}
                    </option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {!customersLoading && customers.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Add a customer in Contacts before creating an invoice.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="issue-date" className="text-sm font-medium">
                    Invoice Date *
                  </label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={issueDate}
                    onChange={(event) => {
                      setIssueDate(event.target.value);
                      if (dueDate < event.target.value) {
                        setDueDate(event.target.value);
                      }
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="due-date" className="text-sm font-medium">
                    Due Date *
                  </label>
                  <Input
                    id="due-date"
                    type="date"
                    min={issueDate}
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-semibold">Invoice Items</h2>
                  <p className="text-sm text-muted-foreground">
                    Add descriptions, quantities, and unit prices.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setItems((current) => [
                      ...current,
                      { description: "", quantity: 1, unitPrice: 0 },
                    ])
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Quantity</th>
                      <th className="px-4 py-3 font-medium">Unit Price (₹)</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="min-w-52 px-4 py-3">
                          <Input
                            value={item.description}
                            onChange={(event) =>
                              updateItem(index, "description", event.target.value)
                            }
                            placeholder="Item description"
                            maxLength={300}
                            required
                          />
                        </td>
                        <td className="min-w-28 px-4 py-3">
                          <Input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(index, "quantity", event.target.value)
                            }
                            required
                          />
                        </td>
                        <td className="min-w-36 px-4 py-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(event) =>
                              updateItem(index, "unitPrice", event.target.value)
                            }
                            required
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                          {money(
                            Math.max(0, item.quantity) *
                              Math.max(0, item.unitPrice)
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={items.length === 1}
                            onClick={() =>
                              setItems((current) =>
                                current.filter((_, i) => i !== index)
                              )
                            }
                            aria-label={`Remove item ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="ml-auto max-w-md space-y-4 rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-medium">{money(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label htmlFor="tax-rate" className="text-sm text-muted-foreground">
                  Tax (%)
                </label>
                <Input
                  id="tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(event) => setTaxRate(Number(event.target.value))}
                  className="w-28"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tax Amount</span>
                <span className="font-medium">{money(tax)}</span>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">{money(total)}</span>
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/invoices")}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  saving ||
                  customersLoading ||
                  customers.length === 0
                }
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Invoice
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
