import "server-only";

import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";
import {
  emptyPermissions,
  normalizePermissions,
  type PermissionKey,
  type PermissionMap,
} from "@/lib/permissions";

export type CurrentAccess = {
  uid: string;
  isAdmin: boolean;
  isActive: boolean;
  permissions: PermissionMap;
  email?: string;
  displayName?: string;
};

export async function getCurrentAccess(): Promise<CurrentAccess> {
  if (!adminAuth) throw new Error("ADMIN_NOT_CONFIGURED");

  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;
  if (!session) throw new Error("UNAUTHORIZED");

  const decoded = await adminAuth.verifySessionCookie(session, true);
  const isAdmin = await isAdminUid(decoded.uid);

  if (isAdmin) {
    const permissions = emptyPermissions();
    for (const key of Object.keys(permissions) as PermissionKey[]) permissions[key] = true;
    return {
      uid: decoded.uid,
      isAdmin: true,
      isActive: true,
      permissions,
      email: typeof decoded.email === "string" ? decoded.email : undefined,
    };
  }

  const snapshot = await firestore.collection("userPermissions").doc(decoded.uid).get();
  if (!snapshot.exists) {
    return {
      uid: decoded.uid,
      isAdmin: false,
      isActive: false,
      permissions: emptyPermissions(),
      email: typeof decoded.email === "string" ? decoded.email : undefined,
    };
  }

  const data = snapshot.data();
  return {
    uid: decoded.uid,
    isAdmin: false,
    isActive: data.isActive !== false,
    permissions: normalizePermissions(data.permissions),
    email: typeof data.email === "string" ? data.email : (typeof decoded.email === "string" ? decoded.email : undefined),
    displayName: typeof data.displayName === "string" ? data.displayName : undefined,
  };
}

export async function requirePermission(permission: PermissionKey): Promise<CurrentAccess> {
  const access = await getCurrentAccess();
  if (access.isAdmin) return access;
  if (!access.isActive || access.permissions[permission] !== true) {
    throw new Error("FORBIDDEN");
  }
  return access;
}

export async function requireAdmin(): Promise<CurrentAccess> {
  const access = await getCurrentAccess();
  if (!access.isAdmin) throw new Error("FORBIDDEN");
  return access;
}
