import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function getLocalAdminUids(): string | undefined {
  try {
    const devVarsPath = join(process.cwd(), ".dev.vars");
    if (!existsSync(devVarsPath)) return undefined;

    const line = readFileSync(devVarsPath, "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith("FIREBASE_ADMIN_UID="));
    if (!line) return undefined;

    let value = line.slice(line.indexOf("=") + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      const quotedValue = value;
      try {
        const decoded: unknown = JSON.parse(quotedValue);
        value =
          typeof decoded === "string" ? decoded : quotedValue.slice(1, -1);
      } catch {
        value = quotedValue.slice(1, -1);
      }
    }

    return value || undefined;
  } catch (error) {
    console.error("Unable to read local admin configuration.", error);
    return undefined;
  }
}

export async function isAdminUid(uid: string): Promise<boolean> {
  let raw: string | undefined;

  try {
    const context = await getCloudflareContext({ async: true });
    const value = context.env.FIREBASE_ADMIN_UID;
    if (typeof value === "string") raw = value;
  } catch {
    // Next.js development and unit-test processes do not have a Worker context.
  }

  raw ||= process.env.FIREBASE_ADMIN_UID || getLocalAdminUids();
  if (!raw) return false;
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(uid);
}
