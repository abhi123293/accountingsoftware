import { NextResponse } from "next/server";
import { getCurrentAccess } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const access = await getCurrentAccess();
    return NextResponse.json(access, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Current permissions API error:", error);
    return NextResponse.json({ error: "Unable to load permissions." }, { status: 500 });
  }
}
