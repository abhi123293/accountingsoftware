"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  BookOpen,
  ChartNoAxesCombined,
  Settings,
} from "lucide-react";
import { useUser } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Accounts", href: "/accounts", icon: Wallet },
  { label: "Ledger", href: "/ledger", icon: BookOpen },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const { user, loading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";

    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="shrink-0 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] md:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 h-full w-full bg-black/50"
            />

            <aside
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="fixed inset-y-0 left-0 z-[10000] flex w-[min(18rem,85vw)] flex-col overflow-hidden border-r border-border bg-background shadow-2xl"
            >
              {/* Header */}
              <div className="flex min-h-20 shrink-0 items-center justify-between border-b border-border px-5 py-4">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="min-w-0 text-lg font-bold"
                >
                  LedgerFlow
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    Accounting Suite
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                <div className="flex flex-col gap-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>

              {/* User profile */}
              <div className="shrink-0 border-t border-border bg-background p-4">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      {user?.photoURL ? (
                        <AvatarImage
                          src={user.photoURL}
                          alt={user.displayName ?? "User"}
                        />
                      ) : (
                        <AvatarFallback className="text-xs font-medium">
                          {getInitials(user?.displayName)}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {user?.displayName ?? "Admin User"}
                      </p>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {user?.email ?? "Business administrator"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}