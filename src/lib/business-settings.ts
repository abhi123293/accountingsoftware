import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-services";

export type BusinessSettings = {
  businessName: string;
  currency: string;
  country: string;
  taxRegistered: boolean;
};

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const businessRef = doc(db, "settings", "business");
  const snapshot = await getDoc(businessRef);

  if (!snapshot.exists()) {
    throw new Error("Business settings document was not found.");
  }

  return snapshot.data() as BusinessSettings;
}