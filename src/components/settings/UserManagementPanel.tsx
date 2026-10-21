"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Save, UserPlus, ShieldCheck,Power, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSION_DEFINITIONS, emptyPermissions, type PermissionKey, type PermissionMap } from "@/lib/permissions";

type ManagedUser = {
  uid: string;
  email: string;
  displayName: string;
  permissions: PermissionMap;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Message = { type: "success" | "error"; text: string } | null;

export default function UserManagementPanel() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<PermissionMap>(emptyPermissions);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Array<(typeof PERMISSION_DEFINITIONS)[number]>>();
    for (const definition of PERMISSION_DEFINITIONS) {
      const list = groups.get(definition.module) ?? [];
      list.push(definition);
      groups.set(definition.module, list);
    }
    return Array.from(groups.entries());
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const body = await response.json().catch(() => ({})) as { users?: ManagedUser[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to load users.");
      setUsers(Array.isArray(body.users) ? body.users : []);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to load users." });
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  function resetForm() {
    setDisplayName("");
    setEmail("");
    setPassword("");
    setPermissions(emptyPermissions());
    setEditingUid(null);
  }

  function togglePermission(key: PermissionKey, checked: boolean) {
    setPermissions((current) => ({ ...current, [key]: checked }));
  }

  function editUser(user: ManagedUser) {
    setEditingUid(user.uid);
    setDisplayName(user.displayName);
    setEmail(user.email);
    setPassword("");
    setPermissions({ ...emptyPermissions(), ...user.permissions });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const selectedCount = Object.values(permissions).filter(Boolean).length;
    if (!editingUid && !selectedCount) {
      setMessage({ type: "error", text: "Select at least one permission for a new user." });
      return;
    }
    if (!editingUid && password.length < 6) {
      setMessage({ type: "error", text: "Initial password must be at least 6 characters." });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(editingUid ? `/api/admin/users/${encodeURIComponent(editingUid)}` : "/api/admin/users", {
        method: editingUid ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUid
          ? { permissions }
          : { displayName: displayName.trim(), email: email.trim(), password, permissions }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string; user?: ManagedUser };
      if (!response.ok) throw new Error(body.error || "Unable to save user.");
      setMessage({ type: "success", text: editingUid ? "Permissions updated successfully." : "User created and permissions saved." });
      resetForm();
      await loadUsers();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save user." });
    } finally {
      setSaving(false);
    }
  }


  
async function toggleUserStatus(user: ManagedUser) {
  const nextStatus = !user.isActive;

  const confirmed = window.confirm(
    `${nextStatus ? "Enable" : "Disable"} ${user.displayName || user.email}?`
  );

  if (!confirmed) return;

  setMessage(null);
  setSaving(true);

  try {
    const response = await fetch(
      `/api/admin/users/${encodeURIComponent(user.uid)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      }
    );

    const body = await response.json().catch(() => ({})) as {
      error?: string;
      user?: ManagedUser;
    };

    if (!response.ok) {
      throw new Error(body.error || "Unable to update account status.");
    }

    setUsers((current) =>
      current.map((item) =>
        item.uid === user.uid
          ? { ...item, isActive: nextStatus }
          : item
      )
    );

    setMessage({
      type: "success",
      text: `${user.displayName || user.email} has been ${
        nextStatus ? "enabled" : "disabled"
      }.`,
    });
  } catch (error) {
    setMessage({
      type: "error",
      text:
        error instanceof Error
          ? error.message
          : "Unable to update account status.",
    });
  } finally {
    setSaving(false);
  }
}



async function deleteManagedUser(user: ManagedUser) {
  const confirmed = window.confirm(
    `Are you sure you want to permanently delete ${user.email}? This action cannot be undone.`
  );

  if (!confirmed) return;

  setMessage(null);
  setSaving(true);

  try {
    const response = await fetch(
      `/api/admin/users/${encodeURIComponent(user.uid)}`,
      { method: "DELETE" }
    );

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(body.error || "Unable to delete user.");
    }

    setMessage({
      type: "success",
      text: `User ${user.email} was deleted successfully.`,
    });

    await loadUsers();
  } catch (error) {
    setMessage({
      type: "error",
      text:
        error instanceof Error
          ? error.message
          : "Unable to delete user.",
    });
  } finally {
    setSaving(false);
  }
}



async function resetUserPassword(user: ManagedUser) {
  const newPassword = window.prompt(
    `Enter a new password for ${user.displayName || user.email}:`
  );

  if (newPassword === null) return;

  if (newPassword.length < 6 || newPassword.length > 128) {
    setMessage({
      type: "error",
      text: "Password must contain between 6 and 128 characters.",
    });
    return;
  }

  const confirmed = window.confirm(
    `Reset the password for ${user.email}?`
  );

  if (!confirmed) return;

  setMessage(null);
  setSaving(true);

  try {
    const response = await fetch(
      `/api/admin/users/${encodeURIComponent(user.uid)}/password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      }
    );

    const body = await response.json().catch(() => ({})) as {
      error?: string;
      message?: string;
    };

    if (!response.ok) {
      throw new Error(body.error || "Unable to reset password.");
    }

    setMessage({
      type: "success",
      text: `Password reset successfully for ${user.email}.`,
    });
  } catch (error) {
    setMessage({
      type: "error",
      text: error instanceof Error
        ? error.message
        : "Unable to reset password.",
    });
  } finally {
    setSaving(false);
  }
}



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> User Management & Permissions</CardTitle>
          <CardDescription>Create app users and select exactly which modules and actions they can access. User Management itself is reserved for Admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="managed-user-name">Full name</Label>
                <Input id="managed-user-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} maxLength={100} disabled={saving || Boolean(editingUid)} placeholder="User's name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="managed-user-email">Email address</Label>
                <Input id="managed-user-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={saving || Boolean(editingUid)} placeholder="user@company.com" />
              </div>
              {!editingUid && <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="managed-user-password">Initial password</Label>
                <Input id="managed-user-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} maxLength={128} disabled={saving} placeholder="At least 6 characters" />
                <p className="text-xs text-muted-foreground">The password is sent to Firebase Authentication only and is never stored in Firestore.</p>
              </div>}
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Grant permissions</h3>
                <p className="text-xs text-muted-foreground">Delete actions and User Management are intentionally not grantable to normal users.</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {groupedPermissions.map(([module, definitions]) => (
                  <section key={module} className="rounded-lg border border-border p-4">
                    <h4 className="mb-3 font-medium">{module}</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {definitions.map(({ key, action }) => (
                        <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" checked={permissions[key]} onChange={(event) => togglePermission(key, event.target.checked)} disabled={saving} />
                          <span>{action}</span>
                        </label>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            {message && <p role={message.type === "error" ? "alert" : "status"} className={`rounded-md border p-3 text-sm ${message.type === "error" ? "border-destructive/40 text-destructive" : "border-emerald-600/40 text-emerald-700"}`}>{message.text}</p>}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingUid ? <Save className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                {saving ? "Saving…" : editingUid ? "Save Permissions" : "Create User"}
              </Button>
              {editingUid && <Button type="button" variant="outline" disabled={saving} onClick={resetForm}>Cancel editing</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Managed Users</CardTitle>
          <CardDescription>Users created through this Admin panel.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading users…</div> : users.length === 0 ? <p className="py-6 text-sm text-muted-foreground">No managed users yet.</p> : <div className="divide-y divide-border">
            {users.map((user) => (
              <div key={user.uid} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{user.displayName || user.email}</p>
                  <p className="break-all text-sm text-muted-foreground">{user.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{Object.values(user.permissions ?? {}).filter(Boolean).length} permissions granted</p>
                </div>
                
<div className="flex flex-wrap items-center gap-2">
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
      user.isActive
        ? "bg-green-500/10 text-green-700 dark:text-green-400"
        : "bg-red-500/10 text-red-700 dark:text-red-400"
    }`}
  >
    {user.isActive ? "Active" : "Disabled"}
  </span>

  
<Button
  type="button"
  variant="destructive"
  size="sm"
  disabled={saving}
  onClick={() => deleteManagedUser(user)}
>
  Delete
</Button>


<Button
  type="button"
  variant="outline"
  size="sm"
  disabled={saving || !user.isActive}
  onClick={() => resetUserPassword(user)}
>
  Reset Password
</Button>

  <Button
    type="button"
    variant="outline"
    size="sm"
    disabled={saving}
    onClick={() => editUser(user)}
  >
    Manage permissions
  </Button>

  <Button
    type="button"
    variant="outline"
    size="sm"
    disabled={saving}
    onClick={() => toggleUserStatus(user)}
  >
    <Power className="mr-2 h-4 w-4" />
    {user.isActive ? "Disable" : "Enable"}
  </Button>
</div>

              </div>
            ))}
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
