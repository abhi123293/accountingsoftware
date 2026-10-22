
"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  FileText,
  ChevronDown,
} from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  getReportingDateRange,
  type ReportingPeriod,
} from "@/lib/reporting-period";



type ReportLine = {
  accountId: string;
  accountName: string;
  amount: number;
};

type ProfitLossData = {
  revenue: number;
  expenses: number;
  netProfit: number;
  incomeAccounts: ReportLine[];
  expenseAccounts: ReportLine[];
};



const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

export default function ReportsPage() {
  const [period, setPeriod] =
    useState<ReportingPeriod>("this-month");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [report, setReport] =
    useState<ProfitLossData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dateRange = getReportingDateRange(
    period,
    startDate,
    endDate
  );
  
const invalidDateRange =
  period === "custom" &&
  startDate !== "" &&
  endDate !== "" &&
  startDate > endDate;


useEffect(() => {
  if (!dateRange) {
    setReport(null);
    setLoading(false);
    return;
  }

  const controller = new AbortController();

  async function loadReport() {
    setLoading(true);
    setError("");

    try {
    
if (!dateRange) return;

const response = await fetch(
  `/api/reports/profit-loss?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
  { signal: controller.signal }
);


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load report.");
      }

      setReport(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setReport(null);
      setError(
        err instanceof Error ? err.message : "Failed to load report."
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  loadReport();
  return () => controller.abort();
}, [dateRange?.startDate, dateRange?.endDate]);

  return (
   <div className="min-h-screen bg-background text-foreground">
  <div className="hidden md:block">
    <Sidebar />
  </div>

  <main className="min-w-0 flex-1 md:ml-64">
        <Header />

        <div className="space-y-7 p-5 sm:p-8">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Financial Reports
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Review your business performance and profitability.
              </p>
            </div>

            


<div className="flex flex-wrap items-end justify-start gap-3 sm:justify-end">
  {/* Reporting Period */}
  <div className="space-y-1">
    <label
      htmlFor="report-period"
      className="text-sm text-muted-foreground"
    >
      Reporting period
    </label>

    <div className="relative">
      <select
        id="report-period"
        value={period}
        onChange={(event) =>
          setPeriod(event.target.value as ReportingPeriod)
        }
        className="h-10 w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="this-month">This Month</option>
        <option value="last-month">Last Month</option>
        <option value="this-year">This Year</option>
        <option value="custom">Custom Range</option>
      </select>

      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  </div>

  {/* Custom Date Range */}
  {period === "custom" && (
    <>
      <div className="space-y-1">
        <label
          htmlFor="start-date"
          className="text-sm text-muted-foreground"
        >
          Start date
        </label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          aria-invalid={invalidDateRange}
          max={endDate || undefined}
          onChange={(event) => setStartDate(event.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="end-date"
          className="text-sm text-muted-foreground"
        >
          End date
        </label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          aria-invalid={invalidDateRange}
          min={startDate || undefined}
          onChange={(event) => setEndDate(event.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        
{invalidDateRange && (
  <p className="text-sm text-red-600" role="alert">
    End date must be on or after the start date.
  </p>
)}

      </div>
    </>
  )}

  {/* Selected Date Range */}
  <p
    className="w-full text-right text-xs text-muted-foreground"
    aria-live="polite"
  >
 
{invalidDateRange
  ? "End date must be on or after the start date."
  : !dateRange
    ? period === "custom"
      ? "Select both dates to continue."
      : "Select a valid reporting period."
    : `Showing ${dateRange.startDate} to ${dateRange.endDate}`}

  </p>
</div>



          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
              title="Total Revenue"
              amount={report?.revenue ?? 0}
              icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
              description="Income recorded in the selected period"
              loading={loading}
            />

            <SummaryCard
              title="Total Expenses"
              amount={report?.expenses ?? 0}
              icon={<TrendingDown className="h-5 w-5 text-rose-600" />}
              description="Expenses recorded in the selected period"
              loading={loading}
            />

            <SummaryCard
              title="Net Profit"
              amount={report?.netProfit ?? 0}
              icon={<Wallet className="h-5 w-5 text-blue-600" />}
              description="Revenue minus expenses"
              loading={loading}
            />
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
            >
              <p className="font-medium">Unable to load the report</p>
              <p className="mt-1 text-muted-foreground">{error}</p>
              <button
                onClick={() => setPeriod((current) => current)}
                className="mt-3 inline-flex items-center gap-2 font-medium underline"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          )}

          <section className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                  Profit &amp; Loss Statement
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
               Income and expenses for{" "}
{dateRange
  ? `${dateRange.startDate} to ${dateRange.endDate}`
  : "the selected period"}
              </p>
            </div>

            {loading ? (
              <p className="p-6 text-sm text-muted-foreground">
                Loading financial report...
              </p>
            ) : error ? (
              <p className="p-6 text-sm text-muted-foreground">
                The statement will appear when the report data loads.
              </p>
            ) : (
              <div className="p-5 sm:p-6">
                <ReportSection
                  title="Revenue"
                  lines={report?.incomeAccounts ?? []}
                  total={report?.revenue ?? 0}
                />

                <div className="my-6 border-t border-border" />

                <ReportSection
                  title="Expenses"
                  lines={report?.expenseAccounts ?? []}
                  total={report?.expenses ?? 0}
                />

                <div className="mt-6 flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <span className="font-semibold">Net Profit</span>
                  <span
                    className={`text-lg font-bold ${
                      (report?.netProfit ?? 0) < 0
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {money(report?.netProfit ?? 0)}
                  </span>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Based on posted accounting transactions for the selected period.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  title,
  amount,
  icon,
  description,
  loading,
}: {
  title: string;
  amount: number;
  icon: React.ReactNode;
  description: string;
  loading: boolean;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        {icon}
      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight">
        {loading ? "Loading..." : money(amount)}
      </p>

      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </article>
  );
}

function ReportSection({
  title,
  lines,
  total,
}: {
  title: string;
  lines: ReportLine[];
  total: number;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="font-semibold">{money(total)}</span>
      </div>

      {lines.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">
          No accounts with activity in this period.
        </p>
      ) : (
        <div className="space-y-3">
          {lines.map((line) => (
            <div
              key={line.accountId}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted-foreground">
                {line.accountName}
              </span>
              <span className="font-medium">{money(line.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
