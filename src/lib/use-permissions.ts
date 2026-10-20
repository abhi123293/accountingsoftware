"use client";

import { useCallback, useEffect, useState } from "react";
import { emptyPermissions, type PermissionKey, type PermissionMap } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-context";

type PermissionState = {
  loading: boolean;
  isAdmin: boolean;
  isActive: boolean;
  permissions: PermissionMap;
  can: (key: PermissionKey) => boolean;
  canAny: (keys: PermissionKey[]) => boolean;
  refresh: () => Promise<void>;
};

export function usePermissions(): PermissionState {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [permissions, setPermissions] = useState<PermissionMap>(emptyPermissions);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/me/permissions", { cache: "no-store" });
      if (!response.ok) {
        setIsAdmin(false);
        setIsActive(false);
        setPermissions(emptyPermissions());
        return;
      }
      const data = await response.json() as {
        isAdmin?: boolean;
        isActive?: boolean;
        permissions?: Partial<PermissionMap>;
      };
      setIsAdmin(data.isAdmin === true);
      setIsActive(data.isActive === true);
      setPermissions({ ...emptyPermissions(), ...(data.permissions ?? {}) });
    } catch (error) {
      console.error("Unable to load user permissions:", error);
      setIsAdmin(false);
      setIsActive(false);
      setPermissions(emptyPermissions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setIsActive(false);
      setPermissions(emptyPermissions());
      setLoading(false);
      return;
    }
    void refresh();
  }, [authLoading, user, refresh]);

  const can = useCallback((key: PermissionKey) => {
    return isAdmin || (isActive && permissions[key] === true);
  }, [isAdmin, isActive, permissions]);

  const canAny = useCallback((keys: PermissionKey[]) => {
    return isAdmin || (isActive && keys.some((key) => permissions[key] === true));
  }, [isAdmin, isActive, permissions]);

  return { loading: authLoading || loading, isAdmin, isActive, permissions, can, canAny, refresh };
}
