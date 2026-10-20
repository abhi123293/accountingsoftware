
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CheckCheck, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import MobileSidebar from "./MobileSidebar";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/lib/use-permissions";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/invoices": "Invoices",
  "/contacts": "Contacts",
  "/accounts": "Chart of Accounts",
  "/ledger": "General Ledger",
  "/reports": "Financial Reports",
  "/settings": "Settings",
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { can, loading: permissionsLoading } = usePermissions();
  const canViewNotifications = can("notifications.view");
  const userUid = user?.uid;
  const blockedUid = useRef<string | null>(null);
  const pageTitle = pageTitles[pathname] ?? "Dashboard";

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (
      authLoading ||
      permissionsLoading ||
      !userUid ||
      !canViewNotifications ||
      blockedUid.current === userUid
    ) {
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        blockedUid.current = userUid;
        return;
      }
      if (!response.ok) return;

      const data = await response.json();

      setNotifications(
        Array.isArray(data.notifications) ? data.notifications : []
      );
      setUnreadCount(Number(data.unreadCount ?? 0));
    } catch (error) {
      console.error("Unable to load notifications:", error);
    }
  }, [authLoading, canViewNotifications, permissionsLoading, userUid]);

  useEffect(() => {
    if (authLoading || permissionsLoading || !userUid) {
      blockedUid.current = null;
      return;
    }

    if (!canViewNotifications) return;

    const initialLoad = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30_000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [
    authLoading,
    canViewNotifications,
    loadNotifications,
    permissionsLoading,
    userUid,
  ]);

  const markAllRead = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Unable to mark notifications as read.");

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
      await loadNotifications();
    } finally {
      setLoading(false);
    }
  };

  const openNotification = async (item: NotificationItem) => {
    setUpdatingId(item.id);

    try {
      if (!item.isRead) {
        const response = await fetch(
          `/api/notifications/${encodeURIComponent(item.id)}`,
          { method: "PATCH" }
        );

        if (!response.ok) {
          throw new Error("Unable to mark notification as read.");
        }

        setNotifications((current) =>
          current.map((notification) =>
            notification.id === item.id
              ? { ...notification, isRead: true }
              : notification
          )
        );

        setUnreadCount((count) => Math.max(0, count - 1));
      }

      setIsOpen(false);

      // Only navigate to local application paths.
      const destination =
        item.link.startsWith("/") && !item.link.startsWith("//")
          ? item.link
          : "/dashboard";

      router.push(destination);
    } catch (error) {
      console.error(error);
      await loadNotifications();
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (value: string) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <MobileSidebar />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {pageTitle}
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Manage your business finances
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {canViewNotifications && (
        <div className="relative">
          <button
            type="button"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-background shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold">Notifications</h2>
                  <p className="text-xs text-muted-foreground">
                    {unreadCount} unread
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllRead()}
                      disabled={loading}
                      title="Mark all as read"
                      className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close notifications"
                    className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                    <p className="text-sm font-medium">No notifications yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updates will appear here when you perform actions.
                    </p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => void openNotification(item)}
                      disabled={updatingId === item.id}
                      className={`block w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent/60 disabled:opacity-60 ${
                        item.isRead ? "" : "bg-primary/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            item.isRead ? "bg-transparent" : "bg-primary"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {item.message}
                          </span>
                          <span className="mt-2 block text-xs text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </span>
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-border px-4 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/dashboard");
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Go to dashboard
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        <ThemeToggle />

        <div
          aria-label="Administrator"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
        >
          A
        </div>
      </div>
    </header>
  );
}
