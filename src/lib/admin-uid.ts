import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function isAdminUid(uid: string): Promise<boolean> {
  let raw: string | undefined;

  try {
    const context = await getCloudflareContext({ async: true });
    const value = context.env.FIREBASE_ADMIN_UID;
    if (typeof value === "string") raw = value;
  } catch {
    // Next.js development and unit-test processes do not have a Worker context.
  }

  raw ||= process.env.FIREBASE_ADMIN_UID;
  if (!raw) return false;
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(uid);
}
