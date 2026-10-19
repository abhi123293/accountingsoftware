
"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Loader2,
  Receipt,
} from "lucide-react";
import { Download } from "lucide-react";
import { generateInvoicePDF } from "@/lib/generate-invoice-pdf";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useRequireAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Invoice = {
  id: string;
  invoiceNumber?: string;
  customerName?: string;
  issueDate?: string;
  dueDate?: string;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal?: number;
  taxRate?: number;
  tax?: number;
  total?: number;
  status?: string;
  amountPaid: number;
balanceDue: number;
};

export default function InvoicesPage() {
  const { loading: authLoading } = useRequireAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
const [paymentAmount, setPaymentAmount] = useState("");
const [paymentDate, setPaymentDate] = useState(
  new Date().toISOString().slice(0, 10)
);
const [paymentMethod, setPaymentMethod] = useState("upi");
const [paymentReference, setPaymentReference] = useState("");

  useEffect(() => {
    if (authLoading) return;

    async function loadInvoices() {
      try {
        const response = await fetch("/api/invoices");
        const contentType = response.headers.get("content-type");

        if (!contentType?.includes("application/json")) {
          throw new Error("Invoices API is not available yet.");
        }





const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load invoices.");
        }

        setInvoices(data.invoices ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load invoices."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInvoices();
  }, [authLoading]);

  


const today = new Date();
today.setHours(0, 0, 0, 0);

const filteredInvoices = invoices.filter((invoice) => {
  const query = search.toLowerCase();
  const status = (invoice.status ?? "draft").toLowerCase();

  const matchesSearch =
    (invoice.invoiceNumber ?? "").toLowerCase().includes(query) ||
    (invoice.customerName ?? "").toLowerCase().includes(query);

  const dueDate = invoice.dueDate
    ? new Date(`${invoice.dueDate}T00:00:00`)
    : null;

 const effectiveStatus =
  status !== "draft" &&
  status !== "paid" &&
  dueDate &&
  !Number.isNaN(dueDate.getTime()) &&
  dueDate < today
    ? "overdue"
    : status;

  const matchesStatus =
    statusFilter === "all" ||
    effectiveStatus === statusFilter;

  return matchesSearch && matchesStatus;
});


  const handleDownloadPDF = (invoice: Invoice) => {
  if (
    !invoice.invoiceNumber ||
    !invoice.customerName ||
    !invoice.items
  ) {
    setError("Invoice details are incomplete. Please reload the invoices.");
    return;
  }

  try {
    generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      issueDate: invoice.issueDate ?? "",
      dueDate: invoice.dueDate ?? "",
      items: invoice.items,
      subtotal: invoice.subtotal ?? 0,
      taxRate: invoice.taxRate ?? 0,
      tax: invoice.tax ?? 0,
      total: invoice.total ?? 0,
      status: invoice.status ?? "draft",
      amountPaid: invoice.amountPaid ?? 0,
    balanceDue:
      invoice.balanceDue ??
      (invoice.total ?? 0) - (invoice.amountPaid ?? 0),
    });
  } catch {
    setError("Unable to generate the invoice PDF.");
  }
};



const handleIssueInvoice = async (invoice: Invoice) => {
  const confirmed = window.confirm(
    `Issue invoice ${invoice.invoiceNumber}?`
  );

  if (!confirmed) return;

  setActionLoading(invoice.id);
  setError("");

  try {
    const response = await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent" }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to issue invoice.");
    }

    setInvoices((current) =>
      current.map((item) =>
        item.id === invoice.id
          ? { ...item, status: "sent" }
          : item
      )
    );
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to issue invoice."
    );
  } finally {
    setActionLoading("");
  }
};



const handleRecordPayment = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!paymentInvoice) return;

  const amount = Number(paymentAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    setError("Enter a valid payment amount.");
    return;
  }

  setActionLoading(paymentInvoice.id);
  setError("");

  try {
    const response = await fetch(
      `/api/invoices/${paymentInvoice.id}/payments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentDate,
          method: paymentMethod,
          reference: paymentReference,
        }),
      }
    );

    const contentType = response.headers.get("content-type");

if (!contentType?.includes("application/json")) {
  throw new Error(
    `Payment API returned HTML instead of JSON (HTTP ${response.status}). Check the API route path.`
  );
}

const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to record payment.");
    }

    setInvoices((current) =>
      current.map((invoice) =>
        invoice.id === paymentInvoice.id
          ? {
              ...invoice,
              amountPaid: data.amountPaid,
              balanceDue: data.balanceDue,
              status: data.status,
            }
          : invoice
      )
    );

    setPaymentInvoice(null);
    setPaymentAmount("");
    setPaymentReference("");
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Unable to record payment."
    );
  } finally {
    setActionLoading("");
  }
};



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
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Invoices
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Create and manage customer invoices.
              </p>
            </div>

            <Button
              onClick={() => {
                window.location.href = "/invoices/new";
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b p-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">Invoice Directory</h2>
                <p className="text-sm text-muted-foreground">
                  {invoices.length} invoice
                  {invoices.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search invoices..."
                  className="pl-9 sm:w-64"
                  aria-label="Search invoices"
                />
              </div>
              
<select
  value={statusFilter}
  onChange={(event) => setStatusFilter(event.target.value)}
  aria-label="Filter invoices by status"
  className="h-10 rounded-md border border-border bg-background px-3 text-sm"
>
  <option value="all">All statuses</option>
  <option value="draft">Draft</option>
  <option value="sent">Unpaid</option>
  <option value="paid">Paid</option>
  <option value="overdue">Overdue</option>
  <option value="partially_paid">Partially Paid</option>
</select>

            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading invoices...
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-14 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Receipt className="h-7 w-7 text-muted-foreground" />
                </div>

<h3 className="font-semibold">
  {invoices.length === 0
    ? "No invoices yet"
    : "No matching invoices"}
</h3>

<p className="mt-1 text-sm text-muted-foreground">
  {invoices.length === 0
    ? "Create your first invoice to get started."
    : "Try another search term or select a different status filter."}
</p>

                {!search && (
                  <Button
                    className="mt-4"
                    onClick={() => {
                      window.location.href = "/invoices/new";
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px] text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Invoice</th>
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium">Issue Date</th>
                      <th className="px-5 py-3 font-medium">Due Date</th>
                      <th className="px-5 py-3 font-medium">Total</th>
<th className="px-5 py-3 font-medium">Amount Paid</th>
<th className="px-5 py-3 font-medium">Balance Due</th>
<th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-muted/30">
                        <td className="whitespace-nowrap px-5 py-4 font-medium">
  {invoice.invoiceNumber || invoice.id}
</td>
                        <td className="px-5 py-4">
                          {invoice.customerName || "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
  {invoice.issueDate || "—"}
</td>

<td className="whitespace-nowrap px-5 py-4">
  {invoice.dueDate || "—"}
</td>
                        <td className="px-5 py-4">
                          {typeof invoice.total === "number"
                            ? new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                              }).format(invoice.total)
                            : "—"}
                        </td>
                        <td className="px-5 py-4">
  {new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(invoice.amountPaid ?? 0)}
</td>

<td className="px-5 py-4 font-medium">
  {new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(invoice.balanceDue ?? invoice.total ?? 0)}
</td>

{/* Status column */}
<td className="px-5 py-4">
  <InvoiceStatus status={invoice.status} />
</td>

{/* Actions column */}
<td className="px-5 py-4">
  <Button
    type="button"
    variant="outline"
    size="sm"
    className="whitespace-nowrap"
    onClick={() => handleDownloadPDF(invoice)}
  >
    <Download className="mr-2 h-4 w-4" />
    Download PDF
  </Button>
  
{(invoice.status ?? "draft").toLowerCase() === "draft" && (
  <Button
    type="button"
    size="sm"
    className="ml-2 whitespace-nowrap"
    disabled={actionLoading === invoice.id}
    onClick={() => handleIssueInvoice(invoice)}
  >
    {actionLoading === invoice.id ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ) : null}
    Issue Invoice
  </Button>
)}

{["sent", "partially_paid", "overdue"].includes(
  (invoice.status ?? "").toLowerCase()
) && (
  <Button
    type="button"
    size="sm"
    variant="outline"
    className="ml-2 whitespace-nowrap"
    onClick={() => {
      setPaymentInvoice(invoice);
      setPaymentAmount(String(invoice.balanceDue ?? invoice.total ?? 0));
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod("upi");
      setPaymentReference("");
      setError("");
    }}
  >
    Record Payment
  </Button>
)}

</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
      
{paymentInvoice && (
  <section className="rounded-xl border bg-card p-5 shadow-sm">
    <h2 className="text-lg font-semibold">Record Payment</h2>
    <p className="mt-1 text-sm text-muted-foreground">
      Invoice: {paymentInvoice.invoiceNumber}
    </p>
    <p className="mt-1 text-sm">
      Remaining balance:{" "}
      {new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(paymentInvoice.balanceDue)}
    </p>

    <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Payment Amount (₹)</label>
          <Input
            type="number"
            min="0.01"
            max={paymentInvoice.balanceDue}
            step="0.01"
            required
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Payment Date</label>
          <Input
            type="date"
            required
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Reference (Optional)
          </label>
          <Input
            value={paymentReference}
            onChange={(event) => setPaymentReference(event.target.value)}
            placeholder="Transaction ID or reference"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={actionLoading === paymentInvoice.id}>
          {actionLoading === paymentInvoice.id && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Payment
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setPaymentInvoice(null)}
        >
          Cancel
        </Button>
      </div>
    </form>
  </section>
)}

        </div>
      </main>
    </div>
  );
}

function InvoiceStatus({ status }: { status?: string }) {
  const value = (status || "draft").toLowerCase();

  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    paid: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    partially_paid:"bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[value] ?? "bg-muted text-muted-foreground"
      }`}
    >
     {value === "sent"
  ? "Unpaid"
  : value === "partially_paid"
    ? "Partially Paid"
    : value.charAt(0).toUpperCase() + value.slice(1)}
    </span>
  );
}
