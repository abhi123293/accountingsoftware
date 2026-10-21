import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  decodeProtectedHeader,
  errors as joseErrors,
  importX509,
  jwtVerify,
  type JWTPayload,
} from "jose";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

type FirebaseUserLookup = {
  localId: string;
  disabled?: boolean;
  validSince?: string;
};

type FirebaseApiErrorResponse = {
  error?: { message?: string };
};

export type DecodedFirebaseToken = JWTPayload & {
  uid: string;
};

export class AdminAuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthConfigurationError";
  }
}

class FirebaseAuthError extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message);
    this.name = "FirebaseAuthError";
  }
}

let cachedAccessToken:
  | {
      value: string;
      expiresAt: number;
      keyFingerprint: string;
    }
  | undefined;

const certificateCache = new Map<
  string,
  { certificates: Record<string, string>; expiresAt: number }
>();

function readLocalDevVars(): Record<string, string> {
  try {
    const devVarsPath = join(process.cwd(), ".dev.vars");
    if (!existsSync(devVarsPath)) return {};

    const parsed: Record<string, string> = {};

    for (const line of readFileSync(devVarsPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        const quotedValue = value;
        try {
          const decoded: unknown = JSON.parse(quotedValue);
          if (typeof decoded === "string") {
            value = decoded;
          } else {
            value = quotedValue.slice(1, -1);
          }
        } catch {
          value = quotedValue.slice(1, -1);
        }
      }

      if (key && value) parsed[key] = value;
    }

    return parsed;
  } catch (error) {
    console.error("Unable to read local Worker variables.", error);
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
  return typeof localValue === "string" && localValue.length > 0
    ? localValue
    : undefined;
}

async function getServiceAccount(): Promise<ServiceAccount> {
  const raw = await getEnvironmentValue("FIREBASE_SERVICE_ACCOUNT_JSON");

  if (raw) {
    let account: Partial<ServiceAccount>;

    try {
      account = JSON.parse(raw) as Partial<ServiceAccount>;
    } catch {
      throw new AdminAuthConfigurationError(
        "FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON."
      );
    }

    if (
      typeof account.project_id === "string" &&
      typeof account.client_email === "string" &&
      typeof account.private_key === "string" &&
      account.project_id &&
      account.client_email &&
      account.private_key
    ) {
      return {
        project_id: account.project_id,
        client_email: account.client_email,
        private_key: account.private_key,
      };
    }

    throw new AdminAuthConfigurationError(
      "Firebase service account JSON is missing required fields."
    );
  }

  const [project_id, client_email, private_key] = await Promise.all([
    getEnvironmentValue("FIREBASE_PROJECT_ID"),
    getEnvironmentValue("FIREBASE_CLIENT_EMAIL"),
    getEnvironmentValue("FIREBASE_PRIVATE_KEY"),
  ]);

  if (!project_id || !client_email || !private_key) {
    throw new AdminAuthConfigurationError(
      "Firebase Admin Auth credentials are not configured."
    );
  }

  return { project_id, client_email, private_key };
}

function base64Url(value: string | Uint8Array): string {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getGoogleAccessToken(
  account: ServiceAccount
): Promise<string> {
  const normalizedKey = account.private_key.replace(/\\n/g, "\n");
  const fingerprintBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalizedKey)
  );
  const keyFingerprint = base64Url(new Uint8Array(fingerprintBuffer));

  if (
    cachedAccessToken?.keyFingerprint === keyFingerprint &&
    cachedAccessToken.expiresAt > Date.now() + 60_000
  ) {
    return cachedAccessToken.value;
  }

  const pem = normalizedKey.replace(
    /-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,
    ""
  );
  let keyBytes: Uint8Array;

  try {
    keyBytes = Uint8Array.from(atob(pem), (character) =>
      character.charCodeAt(0)
    );
  } catch {
    throw new AdminAuthConfigurationError(
      "Firebase service account private key is malformed."
    );
  }

  const keyBuffer = new ArrayBuffer(keyBytes.byteLength);
  new Uint8Array(keyBuffer).set(keyBytes);
  const signingKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    signingKey,
    new TextEncoder().encode(unsigned)
  );
  const assertion = `${unsigned}.${base64Url(new Uint8Array(signature))}`;

  let response: Response;
  try {
    response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
  } catch (error) {
    console.error("Google OAuth token request failed.", error);
    throw new Error("Unable to reach Google OAuth.");
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const apiError = body as FirebaseApiErrorResponse | null;
    console.error("Google OAuth token request failed.", {
      status: response.status,
      error: apiError?.error?.message,
    });
    throw new Error(
      `Google OAuth rejected the Firebase service account (${response.status}).`
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("access_token" in body) ||
    typeof body.access_token !== "string" ||
    !("expires_in" in body) ||
    typeof body.expires_in !== "number"
  ) {
    throw new Error("Google OAuth returned an invalid token response.");
  }

  cachedAccessToken = {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
    keyFingerprint,
  };

  return cachedAccessToken.value;
}

function isAuthTokenError(error: unknown): boolean {
  return error instanceof joseErrors.JOSEError;
}

async function getSigningKey(
  token: string,
  certificateUrl: string
): Promise<CryptoKey> {
  const header = decodeProtectedHeader(token);
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new FirebaseAuthError(
      "Firebase token has an unsupported signing algorithm.",
      "auth/invalid-id-token"
    );
  }

  let cached = certificateCache.get(certificateUrl);
  if (!cached || cached.expiresAt <= Date.now()) {
    const response = await fetch(certificateUrl);
    if (!response.ok) {
      throw new Error(
        `Unable to retrieve Firebase token signing keys (${response.status}).`
      );
    }

    const certificates: unknown = await response.json();
    if (
      typeof certificates !== "object" ||
      certificates === null ||
      Array.isArray(certificates)
    ) {
      throw new Error("Firebase returned an invalid signing key set.");
    }

    const cacheControl = response.headers.get("cache-control") ?? "";
    const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] ?? 3600);
    cached = {
      certificates: certificates as Record<string, string>,
      expiresAt: Date.now() + Math.max(60, maxAge) * 1000,
    };
    certificateCache.set(certificateUrl, cached);
  }

  const certificate = cached.certificates[header.kid];
  if (!certificate) {
    certificateCache.delete(certificateUrl);
    throw new FirebaseAuthError(
      "Firebase token signing key was not found.",
      "auth/invalid-id-token"
    );
  }

  try {
    return await importX509(certificate, "RS256");
  } catch (error) {
    console.error("Unable to import Firebase token signing key.", error);
    throw new Error("Firebase returned an invalid token signing certificate.");
  }
}

async function verifyFirebaseToken(
  token: string,
  kind: "idToken" | "sessionCookie"
): Promise<DecodedFirebaseToken> {
  const account = await getServiceAccount();
  const certificateUrl =
    kind === "idToken"
      ? "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
      : "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys";

  try {
    const key = await getSigningKey(token, certificateUrl);
    const issuer =
      kind === "idToken"
        ? `https://securetoken.google.com/${account.project_id}`
        : `https://session.firebase.google.com/${account.project_id}`;
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["RS256"],
      audience: account.project_id,
      issuer,
    });

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      throw new FirebaseAuthError(
        "Firebase token does not contain a user ID.",
        "auth/invalid-id-token"
      );
    }

    return { ...payload, uid: payload.sub };
  } catch (error) {
    if (error instanceof FirebaseAuthError) throw error;
    if (isAuthTokenError(error)) {
      throw new FirebaseAuthError(
        "Firebase token is invalid or expired.",
        kind === "idToken"
          ? "auth/invalid-id-token"
          : "auth/invalid-session-cookie"
      );
    }
    throw error;
  }
}

async function checkRevocation(
  token: DecodedFirebaseToken
): Promise<void> {
  const account = await getServiceAccount();
  const accessToken = await getGoogleAccessToken(account);
  const url =
    `https://identitytoolkit.googleapis.com/v1/projects/` +
    `${encodeURIComponent(account.project_id)}/accounts:lookup`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ localId: [token.uid] }),
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const apiError = body as FirebaseApiErrorResponse | null;
    const message = apiError?.error?.message ?? "";
    if (message.includes("USER_NOT_FOUND")) {
      throw new FirebaseAuthError("Firebase user was not found.", "auth/user-not-found");
    }
    console.error("Firebase user lookup failed.", {
      status: response.status,
      message,
    });
    throw new Error(
      `Firebase user lookup failed (${response.status}).`
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("users" in body) ||
    !Array.isArray(body.users)
  ) {
    throw new Error("Firebase returned an invalid user lookup response.");
  }

  const user = body.users[0] as FirebaseUserLookup | undefined;
  if (!user || user.localId !== token.uid) {
    throw new FirebaseAuthError("Firebase user was not found.", "auth/user-not-found");
  }
  if (user.disabled) {
    throw new FirebaseAuthError("Firebase user is disabled.", "auth/user-disabled");
  }

  const validSince = Number(user.validSince ?? 0);
  if (
    !Number.isFinite(validSince) ||
    (validSince > 0 &&
      (typeof token.auth_time !== "number" || token.auth_time < validSince))
  ) {
    throw new FirebaseAuthError(
      "Firebase token has been revoked.",
      "auth/id-token-revoked"
    );
  }
}

async function verifyToken(
  token: string,
  kind: "idToken" | "sessionCookie",
  checkRevoked = false
): Promise<DecodedFirebaseToken> {
  if (!token) {
    throw new FirebaseAuthError("A Firebase token is required.", "auth/argument-error");
  }

  const decoded = await verifyFirebaseToken(token, kind);
  if (checkRevoked) await checkRevocation(decoded);
  return decoded;
}

async function createSessionCookie(
  idToken: string,
  options: { expiresIn: number }
): Promise<string> {
  const account = await getServiceAccount();
  const accessToken = await getGoogleAccessToken(account);
  const url =
    `https://identitytoolkit.googleapis.com/v1/projects/` +
    `${encodeURIComponent(account.project_id)}:createSessionCookie`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idToken,
      validDuration: Math.floor(options.expiresIn / 1000),
    }),
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const apiError = body as FirebaseApiErrorResponse | null;
    const message = apiError?.error?.message ?? "";
    if (
      message.includes("INVALID_ID_TOKEN") ||
      message.includes("TOKEN_EXPIRED") ||
      message.includes("USER_DISABLED")
    ) {
      throw new FirebaseAuthError(
        "Firebase ID token is invalid or expired.",
        "auth/invalid-id-token"
      );
    }
    console.error("Firebase session-cookie creation failed.", {
      status: response.status,
      message,
    });
    throw new Error(
      `Firebase session-cookie creation failed (${response.status}).`
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("sessionCookie" in body) ||
    typeof body.sessionCookie !== "string" ||
    body.sessionCookie.length === 0
  ) {
    throw new Error("Firebase returned an invalid session-cookie response.");
  }

  return body.sessionCookie;
}


// export async function resetFirebaseUserPassword(
//   uid: string,
//   newPassword: string
// ): Promise<{ sessionsRevoked: boolean }> {

// const account = await getServiceAccount();
// const accessToken = await getGoogleAccessToken(account);

// const projectId = account.project_id;


//   if (!projectId) {
//     throw new Error("FIREBASE_PROJECT_ID_MISSING");
//   }

//   const updateResponse = await fetch(
//     `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         localId: uid,
//         password: newPassword,
//       }),
//     }
//   );

//   if (!updateResponse.ok) {
//     const errorText = await updateResponse.text();
//     console.error("Firebase password update failed:", errorText);
//     throw new Error("PASSWORD_RESET_FAILED");
//   }

//   // Revoke existing refresh tokens so existing sessions can be rejected
//   // by protected routes that verify session revocation.
//   const revokeResponse = await fetch(
//     `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:revokeRefreshTokens`,
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         localId: uid,
//       }),
//     }
//   );

//   return {
//     sessionsRevoked: revokeResponse.ok,
//   };
// }



export async function resetManagedUserPassword(
  uid: string,
  newPassword: string
): Promise<void> {
  if (!uid || newPassword.length < 6 || newPassword.length > 128) {
    throw new Error("INVALID_PASSWORD_DETAILS");
  }

  const account = await getServiceAccount();
  const accessToken = await getGoogleAccessToken(account);

  const url =
    `https://identitytoolkit.googleapis.com/v1/projects/` +
    `${encodeURIComponent(account.project_id)}/accounts:update`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      localId: uid,
      password: newPassword,
    }),
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const apiError = body as {
      error?: { message?: string };
    } | null;

    const message = apiError?.error?.message ?? "";

    if (message.includes("USER_NOT_FOUND")) {
      throw new Error("USER_NOT_FOUND");
    }

    console.error("Managed-user password reset failed.", {
      status: response.status,
      message,
    });

    throw new Error("PASSWORD_RESET_FAILED");
  }
}



export async function setManagedUserDisabled(
  uid: string,
  disabled: boolean
): Promise<void> {
  if (!uid) {
    throw new Error("INVALID_USER_ID");
  }

  const account = await getServiceAccount();
  const accessToken = await getGoogleAccessToken(account);

  const url =
    `https://identitytoolkit.googleapis.com/v1/projects/` +
    `${encodeURIComponent(account.project_id)}/accounts:update`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      localId: uid,
      disableUser: disabled,
    }),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const apiError = body as {
      error?: { message?: string };
    } | null;

    console.error("Firebase account status update failed.", {
      status: response.status,
      message: apiError?.error?.message,
    });

    throw new Error("ACCOUNT_STATUS_UPDATE_FAILED");
  }
}




export async function deleteManagedFirebaseUser(
  uid: string
): Promise<void> {
  if (!uid) {
    throw new Error("INVALID_USER_ID");
  }

  const account = await getServiceAccount();
  const accessToken = await getGoogleAccessToken(account);

  const url =
    `https://identitytoolkit.googleapis.com/v1/projects/` +
    `${encodeURIComponent(account.project_id)}/accounts:delete`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      localId: uid,
    }),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const apiError = body as {
      error?: { message?: string };
    } | null;

    const message = apiError?.error?.message ?? "";

    if (message.includes("USER_NOT_FOUND")) {
      throw new Error("USER_NOT_FOUND");
    }

    console.error("Firebase managed-user deletion failed.", {
      status: response.status,
      message,
    });

    throw new Error("USER_DELETE_FAILED");
  }
}






export const adminAuth = {
  verifySessionCookie(
    sessionCookie: string,
    checkRevoked?: boolean
  ): Promise<DecodedFirebaseToken> {
    return verifyToken(sessionCookie, "sessionCookie", checkRevoked).catch(
      (error: unknown) => {
        if (
          error instanceof FirebaseAuthError &&
          error.code.startsWith("auth/")
        ) {
          throw new Error("UNAUTHORIZED");
        }
        throw error;
      }
    );
  },

  verifyIdToken(
    idToken: string,
    checkRevoked?: boolean
  ): Promise<DecodedFirebaseToken> {
    return verifyToken(idToken, "idToken", checkRevoked);
  },

  createSessionCookie,
};
