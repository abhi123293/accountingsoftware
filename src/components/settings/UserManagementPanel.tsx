"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Save, UserPlus, ShieldCheck } from "lucide-react";
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
                <Button type="button" variant="outline" size="sm" onClick={() => editUser(user)}>Manage permissions</Button>
              </div>
            ))}
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
