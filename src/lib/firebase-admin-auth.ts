import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

type AdminAuth = ReturnType<typeof getAuth>;

class AdminAuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthConfigurationError";
  }
}

let authInstance: AdminAuth | undefined;
let initialization: Promise<AdminAuth> | undefined;

function readLocalDevVars(): Record<string, string> {
  try {
    const devVarsPath = join(process.cwd(), ".dev.vars");
    if (!existsSync(devVarsPath)) return {};

    const content = readFileSync(devVarsPath, "utf8");
    const parsed: Record<string, string> = {};

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

      const separatorIndex = trimmed.indexOf("=");
      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (key && value) {
        parsed[key] = value.replace(/\\n/g, "\n");
      }
    }

    return parsed;
  } catch {
    return {};
  }
}

async function getEnvironmentValue(name: string): Promise<string | undefined> {
  try {
    const context = await getCloudflareContext({ async: true });
    const value = context.env[name as keyof CloudflareEnv];
    if (typeof value === "string" && value.length > 0) return value;
  } catch {
    // Next.js development and unit-test processes do not have a Worker context.
  }

  const localValue = process.env[name] || readLocalDevVars()[name];
  if (typeof localValue === "string" && localValue.length > 0) return localValue;

  return undefined;
}

async function initializeAuth(): Promise<AdminAuth> {
  if (authInstance) return authInstance;

  const raw = await getEnvironmentValue("FIREBASE_SERVICE_ACCOUNT_JSON");
  let projectId: string | undefined;
  let clientEmail: string | undefined;
  let privateKey: string | undefined;

  if (raw) {
    let serviceAccount: Record<string, unknown>;

    try {
      serviceAccount = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new AdminAuthConfigurationError(
        "FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON."
      );
    }

    projectId =
      typeof serviceAccount.project_id === "string"
        ? serviceAccount.project_id
        : undefined;
    clientEmail =
      typeof serviceAccount.client_email === "string"
        ? serviceAccount.client_email
        : undefined;
    privateKey =
      typeof serviceAccount.private_key === "string"
        ? serviceAccount.private_key
        : undefined;
  } else {
    [projectId, clientEmail, privateKey] = await Promise.all([
      getEnvironmentValue("FIREBASE_PROJECT_ID"),
      getEnvironmentValue("FIREBASE_CLIENT_EMAIL"),
      getEnvironmentValue("FIREBASE_PRIVATE_KEY"),
    ]);
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new AdminAuthConfigurationError(
      "Firebase Admin Auth credentials are not configured."
    );
  }

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
          storageBucket: "accounting-software-505d5.firebasestorage.app",
        });

  authInstance = getAuth(app);
  return authInstance;
}

function getAdminAuth(): Promise<AdminAuth> {
  initialization ??= initializeAuth().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

function isInvalidSessionCookieError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const code = error.code;
  return (
    typeof code === "string" &&
    [
      "auth/argument-error",
      "auth/invalid-session-cookie",
      "auth/session-cookie-expired",
      "auth/session-cookie-revoked",
      "auth/user-disabled",
      "auth/user-not-found",
    ].includes(code)
  );
}

export const adminAuth = {
  verifySessionCookie(
    sessionCookie: string,
    checkRevoked?: boolean
  ): ReturnType<AdminAuth["verifySessionCookie"]> {
    return getAdminAuth()
      .then((auth) => auth.verifySessionCookie(sessionCookie, checkRevoked))
      .catch((error: unknown) => {
        if (isInvalidSessionCookieError(error)) {
          throw new Error("UNAUTHORIZED");
        }
        throw error;
      });
  },

  verifyIdToken(
    idToken: string,
    checkRevoked?: boolean
  ): ReturnType<AdminAuth["verifyIdToken"]> {
    return getAdminAuth().then((auth) =>
      auth.verifyIdToken(idToken, checkRevoked)
    );
  },

  createSessionCookie(
    idToken: string,
    options: { expiresIn: number }
  ): ReturnType<AdminAuth["createSessionCookie"]> {
    return getAdminAuth().then((auth) =>
      auth.createSessionCookie(idToken, options)
    );
  },
};

export { AdminAuthConfigurationError };
