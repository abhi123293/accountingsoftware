declare global {
  interface CloudflareEnv {
    FIREBASE_SERVICE_ACCOUNT_JSON?: string;
    FIREBASE_PROJECT_ID?: string;
    FIREBASE_CLIENT_EMAIL?: string;
    FIREBASE_PRIVATE_KEY?: string;
    FIREBASE_ADMIN_UID?: string;
    NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  }
}

export {};
