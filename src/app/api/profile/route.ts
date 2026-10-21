
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin-auth";
import { firestore } from "@/lib/firestore-rest";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return adminAuth.verifySessionCookie(session, true);
}

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  console.error("Profile API error:", error);

  return NextResponse.json(
    { error: "Unable to process profile request" },
    { status: 500 }
  );
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    const snapshot = await firestore
      .collection("userProfiles")
      .doc(user.uid)
      .get();

    const saved = snapshot.data();

    return NextResponse.json({
      profile: {
        firstName: saved.firstName ?? "",
        lastName: saved.lastName ?? "",
        phone: saved.phone ?? "",
        bio: saved.bio ?? "",
        email: user.email ?? "",
        locked: saved.locked === true,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    const body: unknown = await request.json().catch(() => null);

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid profile data." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;

    const firstName =
      typeof input.firstName === "string"
        ? input.firstName.trim()
        : "";

    const lastName =
      typeof input.lastName === "string"
        ? input.lastName.trim()
        : "";

    const phone =
      typeof input.phone === "string"
        ? input.phone.trim()
        : "";

    const bio =
      typeof input.bio === "string"
        ? input.bio.trim()
        : "";

    if (!firstName || firstName.length > 80) {
      return NextResponse.json(
        { error: "First name is required (max 80 characters)." },
        { status: 400 }
      );
    }

    if (!lastName || lastName.length > 80) {
      return NextResponse.json(
        { error: "Last name is required (max 80 characters)." },
        { status: 400 }
      );
    }

    if (phone.length > 30 || bio.length > 500) {
      return NextResponse.json(
        { error: "Phone or bio exceeds the allowed length." },
        { status: 400 }
      );
    }

    const profileRef = firestore
      .collection("userProfiles")
      .doc(user.uid);

    const result = await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(profileRef);
      const saved = snapshot.data();

      if (saved.locked === true) {
        throw new Error("PROFILE_ALREADY_SAVED");
      }

      const profile = {
        firstName,
        lastName,
        phone,
        bio,
        locked: true,
        updatedAt: new Date().toISOString(),
      };

      transaction.set(profileRef, profile);

      return profile;
    });

    return NextResponse.json({
      message: "Profile saved successfully.",
      profile: {
        ...result,
        email: user.email ?? "",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PROFILE_ALREADY_SAVED"
    ) {
      return NextResponse.json(
        { error: "Your profile has already been saved and cannot be edited." },
        { status: 409 }
      );
    }

    return handleError(error);
  }
}
