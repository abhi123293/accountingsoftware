import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";
import { isAdminUid } from "@/lib/admin-uid";

async function verifyAdmin() {
  if (!adminAuth) {
    throw new Error("ADMIN_NOT_CONFIGURED");
  }

  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) throw new Error("UNAUTHORIZED");

  const decoded = await adminAuth.verifySessionCookie(session, true);

  if (!isAdminUid(decoded.uid)) {
    throw new Error("FORBIDDEN");
  }
}

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  console.error("Settings API error:", error);

  return NextResponse.json(
    { error: "Unable to process settings request" },
    { status: 500 }
  );
}

const settingsDoc = () => {
  return firestore.collection("settings").doc("business");
};

export async function GET() {
  try {
    await verifyAdmin();

    const ref = settingsDoc();
    const snapshot = await ref.get();

    return NextResponse.json({
      settings: snapshot.exists ? snapshot.data() : {},
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin();

    const ref = settingsDoc();
    const body = await request.json().catch(() => null);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid settings payload." },
        { status: 400 }
      );
    }

    const businessName =
      typeof body.businessName === "string" ? body.businessName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const address =
      typeof body.address === "string" ? body.address.trim() : "";
    const website =
      typeof body.website === "string" ? body.website.trim() : "";
    const registrationNumber =
      typeof body.registrationNumber === "string"
        ? body.registrationNumber.trim()
        : "";
    const logoUrl =
      typeof body.logoUrl === "string" ? body.logoUrl.trim() : "";
    const logoPath =
      typeof body.logoPath === "string" ? body.logoPath.trim() : "";

    if (!businessName || businessName.length > 150) {
      return NextResponse.json(
        { error: "Business name is required (max 150 characters)." },
        { status: 400 }
      );
    }

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid business email address is required." },
        { status: 400 }
      );
    }

    if (phone.length > 30) {
      return NextResponse.json(
        { error: "Phone number is too long." },
        { status: 400 }
      );
    }

    if (address.length > 300) {
      return NextResponse.json(
        { error: "Address is too long." },
        { status: 400 }
      );
    }

    if (website.length > 200) {
      return NextResponse.json(
        { error: "Website is too long." },
        { status: 400 }
      );
    }

    if (registrationNumber.length > 100) {
      return NextResponse.json(
        { error: "Registration number is too long." },
        { status: 400 }
      );
    }

    if (logoUrl.length > 2000 || logoPath.length > 500) {
      return NextResponse.json(
        { error: "Invalid logo reference." },
        { status: 400 }
      );
    }

    const data = {
      businessName,
      email,
      phone,
      address,
      website,
      registrationNumber,
      logoUrl,
      logoPath,
      updatedAt: new Date().toISOString(),
    };

    await ref.set(data, { merge: true });

    return NextResponse.json({ settings: data });
  } catch (error) {
    return handleError(error);
  }
}
