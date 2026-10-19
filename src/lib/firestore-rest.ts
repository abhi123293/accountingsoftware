import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type FirestoreValue =
  | { nullValue: null }
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { timestampValue: string }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { arrayValue: { values: FirestoreValue[] } };

export type FirestoreData = Record<string, unknown>;

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
  updateTime?: string;
};

type FirestoreWrite =
  | {
      update: {
        name: string;
        fields: Record<string, FirestoreValue>;
      };
      updateMask?: { fieldPaths: string[] };
      currentDocument?: { exists?: boolean; updateTime?: string };
    }
  | { delete: string; currentDocument?: { exists?: boolean } };

type FirestoreResponse = {
  error?: { message?: string; status?: string };
};

let cachedToken:
  | { value: string; expiresAt: number; clientEmail: string }
  | undefined;

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
        const quotedValue = value;
        try {
          const decoded: unknown = JSON.parse(quotedValue);
          value =
            typeof decoded === "string" ? decoded : quotedValue.slice(1, -1);
        } catch {
          value = quotedValue.slice(1, -1);
        }
      }

      if (key && value) {
        parsed[key] = value;
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

async function getServiceAccount(): Promise<ServiceAccount> {
  const raw = await getEnvironmentValue("FIREBASE_SERVICE_ACCOUNT_JSON");

  if (raw) {
    let account: Partial<ServiceAccount>;

    try {
      account = JSON.parse(raw) as Partial<ServiceAccount>;
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON.");
    }

    if (
      typeof account.project_id === "string" &&
      typeof account.client_email === "string" &&
      typeof account.private_key === "string" &&
      account.project_id &&
      account.client_email &&
      account.private_key
    ) {
      return account as ServiceAccount;
    }

    throw new Error(
      "Firebase service account JSON is missing required fields."
    );
  }

  const [project_id, client_email, private_key] = await Promise.all([
    getEnvironmentValue("FIREBASE_PROJECT_ID"),
    getEnvironmentValue("FIREBASE_CLIENT_EMAIL"),
    getEnvironmentValue("FIREBASE_PRIVATE_KEY"),
  ]);

  if (!project_id || !client_email || !private_key) {
    throw new Error(
      "Configure FIREBASE_SERVICE_ACCOUNT_JSON or all split Firebase credentials."
    );
  }

  return { project_id, client_email, private_key };
}

async function getAccessToken(account: ServiceAccount): Promise<string> {
  if (
    cachedToken?.clientEmail === account.client_email &&
    cachedToken.expiresAt > Date.now() + 60_000
  ) {
    return cachedToken.value;
  }

  const now = Math.floor(Date.now() / 1000);
  const pem = account.private_key
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");

  let keyBytes: Uint8Array;

  try {
    keyBytes = Uint8Array.from(atob(pem), (character) =>
      character.charCodeAt(0)
    );
  } catch {
    throw new Error("Firebase service account private key is malformed.");
  }

  const keyBuffer = new ArrayBuffer(keyBytes.byteLength);
  new Uint8Array(keyBuffer).set(keyBytes);

  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/devstorage.read_write",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );
  const signature = new Uint8Array(signatureBuffer);
  const assertion = `${unsigned}.${base64Url(signature)}`;

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

  if (!response.ok) {
    console.error("Google OAuth token request failed.", {
      status: response.status,
    });
    throw new Error(`Google OAuth rejected the service account (${response.status}).`);
  }

  const result: unknown = await response.json();
  if (
    typeof result !== "object" ||
    result === null ||
    !("access_token" in result) ||
    typeof result.access_token !== "string" ||
    !("expires_in" in result) ||
    typeof result.expires_in !== "number"
  ) {
    throw new Error("Google OAuth returned an invalid token response.");
  }

  cachedToken = {
    value: result.access_token,
    expiresAt: Date.now() + result.expires_in * 1000,
    clientEmail: account.client_email,
  };

  return cachedToken.value;
}

function encodeValue(value: unknown): FirestoreValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Firestore values must not contain non-finite numbers.");
    }
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("Firestore values must not contain invalid dates.");
    }
    return { timestampValue: value.toISOString() };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.flatMap((item) => {
          const encoded = encodeValue(item);
          return encoded === undefined ? [] : [encoded];
        }),
      },
    };
  }
  if (typeof value === "object") {
    return { mapValue: { fields: encodeFields(value as FirestoreData) } };
  }
  throw new Error("Unsupported Firestore value.");
}

function encodeFields(data: FirestoreData): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};

  for (const [key, value] of Object.entries(data)) {
    const encoded = encodeValue(value);
    if (encoded !== undefined) fields[key] = encoded;
  }

  return fields;
}

function decodeValue(value: FirestoreValue): unknown {
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) {
    const number = Number(value.integerValue);
    return Number.isSafeInteger(number) ? number : value.integerValue;
  }
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("mapValue" in value) return decodeFields(value.mapValue.fields);
  if ("arrayValue" in value) {
    return (value.arrayValue.values ?? []).map(decodeValue);
  }
  return null;
}

function decodeFields(
  fields: Record<string, FirestoreValue> = {}
): FirestoreData {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeValue(value)])
  );
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function encodeFieldPath(path: string): string {
  return path
    .split(".")
    .map((part) => `\`${part.replace(/\\/g, "\\\\").replace(/`/g, "\\`")}\``)
    .join(".");
}

function getField(data: FirestoreData, fieldPath: string): unknown {
  return fieldPath
    .split(".")
    .reduce<unknown>(
      (value, field) =>
        typeof value === "object" && value !== null
          ? (value as FirestoreData)[field]
          : undefined,
      data
    );
}

function toDocument(path: string, data: FirestoreData): FirestoreWrite {
  return {
    update: {
      name: path,
      fields: encodeFields(data),
    },
  };
}

class FirestoreRestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
  }
}

async function firestoreUrl(path: string): Promise<string> {
  const account = await getServiceAccount();

  const baseUrl =
    `https://firestore.googleapis.com/v1/projects/` +
    `${encodeURIComponent(account.project_id)}` +
    `/databases/(default)/documents`;

  // Firestore custom methods use documents:commit,
  // documents:runQuery, documents:beginTransaction, etc.
  return path.startsWith(":")
    ? `${baseUrl}${path}`
    : `${baseUrl}/${path}`;
}

async function requestFirestore(
  path: string,
  init: RequestInit = {}
): Promise<unknown> {
  const account = await getServiceAccount();
  const token = await getAccessToken(account);
  const url = await firestoreUrl(path);
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch (error) {
    console.error("Firestore REST request failed.", {
      method: init.method ?? "GET",
      path,
      error,
    });
    throw new Error("Unable to reach the Firestore REST API.");
  }

  if (!response.ok) {
    let message = response.statusText || "Firestore request failed.";
    let code: string | undefined;

    try {
      const body = (await response.json()) as FirestoreResponse;
      if (body.error?.message) message = body.error.message;
      code = body.error?.status;
    } catch {
      // The status code remains useful when Google's error body is not JSON.
    }

    console.error("Firestore REST request failed.", {
      method: init.method ?? "GET",
      path,
      status: response.status,
      code,
      message: message.slice(0, 500),
    });
    throw new FirestoreRestError(message, response.status, code);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function documentPathFromName(name: string): string {
  const marker = "/documents/";
  const index = name.indexOf(marker);
  return index < 0 ? name : name.slice(index + marker.length);
}

export class DocumentSnapshot {
  readonly id: string;
  readonly exists: boolean;
  readonly ref: DocumentReference;

  constructor(
    ref: DocumentReference,
    private readonly document?: FirestoreDocument
  ) {
    this.id = ref.id;
    this.exists = document !== undefined;
    this.ref = ref;
  }

  data(): FirestoreData {
    return this.document ? decodeFields(this.document.fields ?? {}) : {};
  }

  get updateTime(): string | undefined {
    return this.document?.updateTime;
  }
}

export class QuerySnapshot {
  readonly size: number;
  readonly empty: boolean;

  constructor(readonly docs: DocumentSnapshot[]) {
    this.size = docs.length;
    this.empty = docs.length === 0;
  }
}

type Filter = {
  field: string;
  operator: string;
  value: unknown;
};

type Ordering = { field: string; direction: "ASCENDING" | "DESCENDING" };

export class Query {
  protected filters: Filter[] = [];
  protected ordering?: Ordering;
  protected maxResults?: number;

  constructor(protected readonly path: string) {}

  where(field: string, operator: string, value: unknown): Query {
    const supported = [
      "==",
      "!=",
      "<",
      "<=",
      ">",
      ">=",
      "array-contains",
      "in",
      "not-in",
      "array-contains-any",
    ];
    if (!supported.includes(operator)) {
      throw new Error(`Unsupported Firestore query operator: ${operator}`);
    }

    const query = new Query(this.path);
    query.filters = [...this.filters, { field, operator, value }];
    query.ordering = this.ordering;
    query.maxResults = this.maxResults;
    return query;
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc"): Query {
    const query = new Query(this.path);
    query.filters = this.filters;
    query.ordering = {
      field,
      direction: direction === "desc" ? "DESCENDING" : "ASCENDING",
    };
    query.maxResults = this.maxResults;
    return query;
  }

  limit(count: number): Query {
    const query = new Query(this.path);
    query.filters = this.filters;
    query.ordering = this.ordering;
    query.maxResults = count;
    return query;
  }

  async get(transactionId?: string): Promise<QuerySnapshot> {
    const segments = this.path.split("/");
    const collectionId = segments.pop()!;
    const parentPath = segments.join("/");
    const endpoint = parentPath
      ? `${encodePath(parentPath)}:runQuery`
      : ":runQuery";
    const fieldFilter = this.filters.map((filter) => ({
      fieldFilter: {
        field: { fieldPath: filter.field },
        op: {
          "==": "EQUAL",
          "!=": "NOT_EQUAL",
          "<": "LESS_THAN",
          "<=": "LESS_THAN_OR_EQUAL",
          ">": "GREATER_THAN",
          ">=": "GREATER_THAN_OR_EQUAL",
          "array-contains": "ARRAY_CONTAINS",
          in: "IN",
          "not-in": "NOT_IN",
          "array-contains-any": "ARRAY_CONTAINS_ANY",
        }[filter.operator],
        value: encodeValue(filter.value),
      },
    }));
    const filters =
      fieldFilter.length === 1
        ? fieldFilter[0]
        : fieldFilter.length > 1
          ? { compositeFilter: { op: "AND", filters: fieldFilter } }
          : undefined;
    const structuredQuery: Record<string, unknown> = {
      from: [{ collectionId }],
    };
    if (filters) structuredQuery.where = filters;
    if (this.ordering) {
      structuredQuery.orderBy = [
        {
          field: { fieldPath: this.ordering.field },
          direction: this.ordering.direction,
        },
      ];
    }
    if (this.maxResults !== undefined) structuredQuery.limit = this.maxResults;

    const result = (await requestFirestore(endpoint, {
      method: "POST",
      body: JSON.stringify({
        structuredQuery,
        ...(transactionId ? { transaction: transactionId } : {}),
      }),
    })) as Array<{ document?: FirestoreDocument }>;

    const documents = (Array.isArray(result) ? result : [])
      .flatMap((row) => (row.document ? [row.document] : []))
      .map((document) => {
        const path = documentPathFromName(document.name);
        return new DocumentSnapshot(new DocumentReference(path), document);
      });

    return new QuerySnapshot(documents);
  }
}

export class CollectionReference extends Query {
  constructor(path: string) {
    super(path);
  }

  doc(id?: string): DocumentReference {
    return new DocumentReference(
      `${this.path}/${id ?? crypto.randomUUID().replace(/-/g, "")}`
    );
  }

  async add(data: FirestoreData): Promise<DocumentReference> {
    const ref = this.doc();
    await requestFirestore(
      `${encodePath(this.path)}?documentId=${encodeURIComponent(ref.id)}`,
      { method: "POST", body: JSON.stringify({ fields: encodeFields(data) }) }
    );
    return ref;
  }

  async get(transactionId?: string): Promise<QuerySnapshot> {
    return super.get(transactionId);
  }
}

export class DocumentReference {
  readonly id: string;

  constructor(readonly path: string) {
    this.id = path.slice(path.lastIndexOf("/") + 1);
  }

  collection(name: string): CollectionReference {
    return new CollectionReference(`${this.path}/${name}`);
  }

  async get(transactionId?: string): Promise<DocumentSnapshot> {
    const query = transactionId
      ? `?transaction=${encodeURIComponent(transactionId)}`
      : "";

    try {
      const document = (await requestFirestore(
        `${encodePath(this.path)}${query}`
      )) as FirestoreDocument;
      return new DocumentSnapshot(this, document);
    } catch (error) {
      if (error instanceof FirestoreRestError && error.status === 404) {
        return new DocumentSnapshot(this);
      }
      throw error;
    }
  }

  async set(data: FirestoreData, options?: { merge?: boolean }): Promise<void> {
    await commitWrites([
      {
        ...toDocument(this.path, data),
        ...(options?.merge
          ? { updateMask: { fieldPaths: Object.keys(encodeFields(data)).map(encodeFieldPath) } }
          : {}),
      },
    ]);
  }

  async update(data: FirestoreData): Promise<void> {
    await commitWrites([
      {
        ...toDocument(this.path, data),
        updateMask: {
          fieldPaths: Object.keys(encodeFields(data)).map(encodeFieldPath),
        },
        currentDocument: { exists: true },
      },
    ]);
  }

  async delete(): Promise<void> {
    await commitWrites([{ delete: this.path }]);
  }
}

async function commitWrites(
  writes: FirestoreWrite[],
  transactionId?: string
): Promise<unknown> {
  if (writes.length === 0) return null;

  const account = await getServiceAccount();

  const normalizedWrites = writes.map((write) =>
    normalizeWrite(write, account.project_id)
  );

  return requestFirestore(":commit", {
    method: "POST",
    body: JSON.stringify({
      writes: normalizedWrites,
      ...(transactionId ? { transaction: transactionId } : {}),
    }),
  });
}

class WriteBatch {
  private writes: FirestoreWrite[] = [];
  private committed = false;

  set(ref: DocumentReference, data: FirestoreData): this {
    this.assertOpen();
    this.writes.push(toDocument(ref.path, data));
    return this;
  }

  update(ref: DocumentReference, data: FirestoreData): this {
    this.assertOpen();
    this.writes.push({
      ...toDocument(ref.path, data),
      updateMask: {
        fieldPaths: Object.keys(encodeFields(data)).map(encodeFieldPath),
      },
      currentDocument: { exists: true },
    });
    return this;
  }

  delete(ref: DocumentReference): this {
    this.assertOpen();
    this.writes.push({ delete: ref.path });
    return this;
  }

  async commit(): Promise<void> {
    this.assertOpen();
    this.committed = true;
    const account = await getServiceAccount();
    await commitWrites(
      this.writes.map((write) => normalizeWrite(write, account.project_id))
    );
  }

  private assertOpen(): void {
    if (this.committed) throw new Error("Firestore batch has already committed.");
    if (this.writes.length >= 500) {
      throw new Error("Firestore batches are limited to 500 writes.");
    }
  }
}

function normalizeWrite(write: FirestoreWrite, projectId: string): FirestoreWrite {
  if ("delete" in write) {
    const path = write.delete.startsWith("projects/")
      ? write.delete
      : `projects/${projectId}/databases/(default)/documents/${encodePath(write.delete)}`;
    return { ...write, delete: path };
  }
  return {
    ...write,
    update: {
      ...write.update,
      name: `projects/${projectId}/databases/(default)/documents/${encodePath(
        documentPathFromName(write.update.name)
      )}`,
    },
  };
}

class BulkWriter {
  private writes: FirestoreWrite[] = [];
  private closed = false;

  set(ref: DocumentReference, data: FirestoreData): void {
    this.assertOpen();
    this.writes.push(toDocument(ref.path, data));
  }

  delete(ref: DocumentReference): void {
    this.assertOpen();
    this.writes.push({ delete: ref.path });
  }

  async close(): Promise<void> {
    this.assertOpen();
    this.closed = true;
    const account = await getServiceAccount();

    for (let index = 0; index < this.writes.length; index += 500) {
      const group = this.writes
        .slice(index, index + 500)
        .map((write) => normalizeWrite(write, account.project_id));
      await commitWrites(group);
    }
  }

  private assertOpen(): void {
    if (this.closed) throw new Error("Firestore bulk writer is closed.");
  }
}

class RestTransaction {
  private writes: FirestoreWrite[] = [];

  constructor(private readonly transactionId: string) {}

  get(ref: DocumentReference): Promise<DocumentSnapshot>;
  get(query: Query): Promise<QuerySnapshot>;
  get(
    target: DocumentReference | Query
  ): Promise<DocumentSnapshot | QuerySnapshot> {
    return target.get(this.transactionId);
  }

  set(ref: DocumentReference, data: FirestoreData): void {
    this.writes.push(toDocument(ref.path, data));
  }

  update(ref: DocumentReference, data: FirestoreData): void {
    this.writes.push({
      ...toDocument(ref.path, data),
      updateMask: {
        fieldPaths: Object.keys(encodeFields(data)).map(encodeFieldPath),
      },
      currentDocument: { exists: true },
    });
  }

  async commit(): Promise<void> {
    const account = await getServiceAccount();
    await commitWrites(
      this.writes.map((write) => normalizeWrite(write, account.project_id)),
      this.transactionId
    );
  }
}

async function runTransaction<T>(
  callback: (transaction: RestTransaction) => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const begun = (await requestFirestore(":beginTransaction", {
      method: "POST",
      body: JSON.stringify({ options: { readWrite: {} } }),
    })) as { transaction?: string };

    if (!begun.transaction) {
      throw new Error("Firestore did not return a transaction identifier.");
    }

    const transaction = new RestTransaction(begun.transaction);

    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
        try {
          await requestFirestore(":rollback", {
            method: "POST",
            body: JSON.stringify({ transaction: begun.transaction }),
          });
        } catch (rollbackError) {
          console.error("Firestore transaction rollback failed.", rollbackError);
        }
        if (
        attempt < 4 &&
        error instanceof FirestoreRestError &&
        (error.status === 409 || error.code === "ABORTED")
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Firestore transaction exceeded its retry limit.");
}

class RestFirestore {
  collection(name: string): CollectionReference {
    return new CollectionReference(name);
  }

  batch(): WriteBatch {
    return new WriteBatch();
  }

  bulkWriter(): BulkWriter {
    return new BulkWriter();
  }

  runTransaction<T>(
    callback: (transaction: RestTransaction) => Promise<T>
  ): Promise<T> {
    return runTransaction(callback);
  }
}

export const firestore = new RestFirestore();

export async function firestoreRequest(
  path: string,
  init: RequestInit = {}
): Promise<unknown> {
  return requestFirestore(path, init);
}

export function decodeFirestoreFields(
  fields: Record<string, FirestoreValue> = {}
): FirestoreData {
  return decodeFields(fields);
}

export function encodeFirestoreFields(
  data: FirestoreData
): Record<string, FirestoreValue> {
  return encodeFields(data);
}

export async function uploadObject(
  bucketName: string,
  objectName: string,
  contentType: string,
  content: ArrayBuffer,
  downloadToken: string
): Promise<void> {
  const account = await getServiceAccount();
  const token = await getAccessToken(account);
  const metadata = {
    name: objectName,
    contentType,
    cacheControl: "public, max-age=31536000",
    metadata: { firebaseStorageDownloadTokens: downloadToken },
  };
  const boundary = `ledgerflow-${crypto.randomUUID()}`;
  const encoder = new TextEncoder();
  const prefix = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`
  );
  const suffix = encoder.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(
    prefix.byteLength + content.byteLength + suffix.byteLength
  );
  body.set(prefix);
  body.set(new Uint8Array(content), prefix.byteLength);
  body.set(suffix, prefix.byteLength + content.byteLength);
  const url = new URL(
    `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucketName)}/o`
  );
  url.searchParams.set("uploadType", "multipart");

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string") url.searchParams.set(key, value);
  }
  url.searchParams.delete("name");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    console.error("Cloud Storage REST upload failed.", {
      status: response.status,
      objectName,
    });
    throw new Error(`Cloud Storage rejected the upload (${response.status}).`);
  }
}
