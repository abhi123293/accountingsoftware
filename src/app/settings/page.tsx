// "use client";

// import {
//   User,
//   Bell,
//   Shield,
//   Palette,
//   Globe,
//   Key,
//   Database,
//   Mail,
//   Trash2,
//   DollarSign,
//   Building2,
//   Save,
//   Loader2,
//   Check,
//   Sun,
//   Moon,
//   Monitor,
//   Download,
//   Settings,
//   Image as ImageIcon,
//   X,
//   LogOut,
// } from "lucide-react";
// import UserManagementPanel from "@/components/settings/UserManagementPanel";
// import { usePermissions } from "@/lib/use-permissions";
// import Sidebar from "@/components/layout/Sidebar";
// import Header from "@/components/layout/Header";
// import { useRequireAuth, useAuth } from "@/lib/auth-context";
// import { useRouter } from "next/navigation";
// import { useState, useRef, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
// import { Separator } from "@/components/ui/separator";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// import { cn } from "cn";
// import { useTheme } from "@/components/theme-provider";
// import { storage } from "@/lib/firebase-services";
// import { listAll, ref as storageRef, deleteObject } from "firebase/storage";
// import {
//   updatePassword,
//   reauthenticateWithCredential,
//   sendEmailVerification,
//   EmailAuthProvider,
//   AuthError,
// } from "firebase/auth";

// const CURRENCY_OPTIONS = [
//   { value: "INR", label: "INR ₹ — Indian Rupee" },
//   { value: "USD", label: "USD $ — US Dollar" },
//   { value: "EUR", label: "EUR € — Euro" },
//   { value: "GBP", label: "GBP £ — Pound Sterling" },
//   { value: "AED", label: "AED — UAE Dirham" },
//   { value: "AUD", label: "AUD A$ — Australian Dollar" },
//   { value: "CAD", label: "CAD C$ — Canadian Dollar" },
//   { value: "SGD", label: "SGD S$ — Singapore Dollar" },
//   { value: "JPY", label: "JPY ¥ — Japanese Yen" },
//   { value: "CNY", label: "CNY ¥ — Chinese Yuan" },
//   { value: "CHF", label: "CHF — Swiss Franc" },
// ];

// const FY_START_OPTIONS = [
//   { value: "01-01", label: "January 1" },
//   { value: "02-01", label: "February 1" },
//   { value: "03-01", label: "March 1" },
//   { value: "04-01", label: "April 1" },
//   { value: "05-01", label: "May 1" },
//   { value: "06-01", label: "June 1" },
//   { value: "07-01", label: "July 1" },
//   { value: "08-01", label: "August 1" },
//   { value: "09-01", label: "September 1" },
//   { value: "10-01", label: "October 1" },
//   { value: "11-01", label: "November 1" },
//   { value: "12-01", label: "December 1" },
// ];

// const DATE_FORMAT_OPTIONS = [
//   "DD/MM/YYYY",
//   "MM/DD/YYYY",
//   "YYYY-MM-DD",
//   "DD-MM-YYYY",
// ];

// const PAYMENT_TERMS_OPTIONS = [
//   { value: "due_receipt", label: "Due on receipt" },
//   { value: "net_7", label: "Net 7 days" },
//   { value: "net_15", label: "Net 15 days" },
//   { value: "net_30", label: "Net 30 days" },
//   { value: "net_45", label: "Net 45 days" },
//   { value: "net_60", label: "Net 60 days" },
// ];

// export default function SettingsPage() {
//   const { user, signOut, error: authError, clearError } = useAuth();
//   useRequireAuth();
//   const router = useRouter();
//   const { theme, setTheme } = useTheme();
//   const [saving, setSaving] = useState(false);
//   const [saved, setSaved] = useState(false);
//   const {
//   isAdmin,
//   can,
//   loading: permissionsLoading,
// } = usePermissions();
// const canViewProfile = isAdmin || can("settings.profile.view");
// const canViewNotifications = isAdmin || can("settings.notifications.view");
// const canEditNotifications = isAdmin || can("settings.notifications.edit");
// const canViewAppearance = isAdmin || can("settings.appearance.view");
// const canViewSecurity = isAdmin || can("settings.security.view");
// const canViewCompany = isAdmin || can("settings.company.view");
// const canViewAdvanced = isAdmin || can("settings.advanced.view");

// const [profileForm, setProfileForm] = useState({
//   firstName: "",
//   lastName: "",
//   email: "",
//   phone: "",
//   bio: "",
// });

// const [profileLoading, setProfileLoading] = useState(true);

// const [notificationPreferences, setNotificationPreferences] = useState({
//   inAppEnabled: true,
// });
// const [notificationPreferencesLoading, setNotificationPreferencesLoading] =
//   useState(false);
// const [notificationPreferencesSaving, setNotificationPreferencesSaving] =
//   useState(false);
// const [notificationPreferencesError, setNotificationPreferencesError] =
//   useState("");
// const [notificationPreferencesSaved, setNotificationPreferencesSaved] =
//   useState(false);

// const [profileError, setProfileError] = useState("");

//   const [passwordOpen, setPasswordOpen] = useState(false);
//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [passwordError, setPasswordError] = useState("");
//   const [passwordSuccess, setPasswordSuccess] = useState("");
//   const [changingPassword, setChangingPassword] = useState(false);

//   const [deleteOpen, setDeleteOpen] = useState(false);
//   const [deletePassword, setDeletePassword] = useState("");
//   const [deleteConfirmText, setDeleteConfirmText] = useState("");
//   const [deleteError, setDeleteError] = useState("");
//   const [deletingAccount, setDeletingAccount] = useState(false);

//   const [signingOut, setSigningOut] = useState(false);
//   const [sessionsOpen, setSessionsOpen] = useState(false);
//   const [sessionLoading, setSessionLoading] = useState(false);
//   const [sessionError, setSessionError] = useState("");
//   const [sessionData, setSessionData] = useState<{
//     device: string;
//     authTime: string;
//     issuedAt: string;
//     createdAt: string;
//     lastSignIn: string;
//   } | null>(null);

//   const [sendingVerification, setSendingVerification] = useState(false);
//   const [verificationMessage, setVerificationMessage] = useState<{
//     type: "success" | "error";
//     text: string;
//   } | null>(null);

//   const [exporting, setExporting] = useState(false);
//   const [importing, setImporting] = useState(false);
//   const [deletingData, setDeletingData] = useState(false);
//   const [dataMessage, setDataMessage] = useState<{
//     type: "success" | "error";
//     text: string;
//   } | null>(null);
//   const importFileRef = useRef<HTMLInputElement>(null);

//   const [profile, setProfile] = useState({
//     businessName: "",
//     email: "",
//     phone: "",
//     address: "",
//     website: "",
//     registrationNumber: "",
//   });
//   const [logoUrl, setLogoUrl] = useState("");
//   const [logoPath, setLogoPath] = useState("");
//   const [profileErrors, setProfileErrors] = useState<{ [key: string]: string }>({});
//   const [profileMessage, setProfileMessage] = useState<{
//     type: "success" | "error";
//     text: string;
//   } | null>(null);
//   const [profileSaving, setProfileSaving] = useState(false);
//   const [profileSaved, setProfileSaved] = useState(false);
//   const [logoUploading, setLogoUploading] = useState(false);
//   const logoFileRef = useRef<HTMLInputElement>(null);

//   const [tax, setTax] = useState({
//     gstin: "",
//     taxRegistrationDetails: "",
//     defaultTaxRate: "0",
//     pricingMode: "exclusive",
//     taxSummary: "itemized",
//     enabledTaxes: [] as string[],
//   });
//   const [taxErrors, setTaxErrors] = useState<{ [key: string]: string }>({});
//   const [taxMessage, setTaxMessage] = useState<{
//     type: "success" | "error";
//     text: string;
//   } | null>(null);
//   const [taxSaving, setTaxSaving] = useState(false);
//   const [taxSaved, setTaxSaved] = useState(false);

//   const [accounting, setAccounting] = useState({
//     baseCurrency: "INR",
//     fyStartDate: "04-01",
//     dateFormat: "DD/MM/YYYY",
//     paymentTerms: "net_30",
//     invoiceFormat: "INV-{YYYY}-{SEQ}",
//     defaultSalesAccount: "",
//     defaultExpenseAccount: "",
//   });
//   const [accountingErrors, setAccountingErrors] = useState<{
//     [key: string]: string;
//   }>({});
//   const [accountingMessage, setAccountingMessage] = useState<{
//     type: "success" | "error";
//     text: string;
//   } | null>(null);
//   const [accountingSaving, setAccountingSaving] = useState(false);
//   const [accountingSaved, setAccountingSaved] = useState(false);
//   const [accountsList, setAccountsList] = useState<
//     { id: string; code: string; name: string; type: string }[]
//   >([]);

//   const TAX_OPTIONS = ["CGST", "SGST", "IGST", "VAT", "SERVICE_TAX"];

//   useEffect(() => {
//     if (!dataMessage) return;
//     const timer = setTimeout(() => setDataMessage(null), 5000);
//     return () => clearTimeout(timer);
//   }, [dataMessage]);

//   useEffect(() => {
//     if (!profileMessage) return;
//     const timer = setTimeout(() => setProfileMessage(null), 5000);
//     return () => clearTimeout(timer);
//   }, [profileMessage]);

//   useEffect(() => {
//     if (!taxMessage) return;
//     const timer = setTimeout(() => setTaxMessage(null), 5000);
//     return () => clearTimeout(timer);
//   }, [taxMessage]);

//   useEffect(() => {
//     if (!accountingMessage) return;
//     const timer = setTimeout(() => setAccountingMessage(null), 5000);
//     return () => clearTimeout(timer);
//   }, [accountingMessage]);

//   useEffect(() => {
//     let cancelled = false;

//     (async () => {
//       try {
//         const response = await fetch("/api/accounting-preferences");
//         const data = await response.json();
//         if (response.ok && !cancelled) {
//           const settings = (data.settings ?? {}) as Record<string, unknown>;
//           const str = (value: unknown) =>
//             typeof value === "string" ? value : "";

//           setAccounting({
//             baseCurrency: /^[A-Z]{3}$/.test(str(settings.baseCurrency))
//               ? str(settings.baseCurrency)
//               : "INR",
//             fyStartDate: /^\d{2}-\d{2}$/.test(str(settings.fyStartDate))
//               ? str(settings.fyStartDate)
//               : "04-01",
//             dateFormat: [
//               "DD/MM/YYYY",
//               "MM/DD/YYYY",
//               "YYYY-MM-DD",
//               "DD-MM-YYYY",
//             ].includes(str(settings.dateFormat))
//               ? str(settings.dateFormat)
//               : "DD/MM/YYYY",
//             paymentTerms: [
//               "due_receipt",
//               "net_7",
//               "net_15",
//               "net_30",
//               "net_45",
//               "net_60",
//             ].includes(str(settings.paymentTerms))
//               ? str(settings.paymentTerms)
//               : "net_30",
//             invoiceFormat: str(settings.invoiceFormat) || "INV-{YYYY}-{SEQ}",
//             defaultSalesAccount: str(settings.defaultSalesAccount),
//             defaultExpenseAccount: str(settings.defaultExpenseAccount),
//           });
//         }
//       } catch {
//         // keep defaults if preferences cannot be loaded
//       }

//       try {
//         const response = await fetch("/api/accounts");
//         const data = await response.json();
//         if (response.ok && !cancelled && Array.isArray(data.accounts)) {
//           setAccountsList(
//             data.accounts.map(
//               (account: {
//                 id?: unknown;
//                 code?: unknown;
//                 name?: unknown;
//                 type?: unknown;
//               }) => ({
//                 id: String(account.id ?? ""),
//                 code: String(account.code ?? ""),
//                 name: String(account.name ?? ""),
//                 type: String(account.type ?? ""),
//               })
//             )
//           );
//         }
//       } catch {
//         // dropdown stays empty if accounts cannot be loaded
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   useEffect(() => {
//     let cancelled = false;

//     (async () => {
//       try {
//         const response = await fetch("/api/tax-settings");
//         const data = await response.json();
//         if (!response.ok || cancelled) return;

//         const settings = (data.settings ?? {}) as Record<string, unknown>;
//         const str = (value: unknown) => (typeof value === "string" ? value : "");

//         setTax({
//           gstin: str(settings.gstin),
//           taxRegistrationDetails: str(settings.taxRegistrationDetails),
//           defaultTaxRate:
//             typeof settings.defaultTaxRate === "number"
//               ? String(settings.defaultTaxRate)
//               : "0",
//           pricingMode:
//             settings.pricingMode === "inclusive" ? "inclusive" : "exclusive",
//           taxSummary: ["itemized", "compact", "hidden"].includes(
//             String(settings.taxSummary)
//           )
//             ? String(settings.taxSummary)
//             : "itemized",
//           enabledTaxes: Array.isArray(settings.enabledTaxes)
//             ? settings.enabledTaxes
//                 .filter((value) =>
//                   ["CGST", "SGST", "IGST", "VAT", "SERVICE_TAX"].includes(String(value))
//                 )
//                 .map(String)
//             : [],
//         });
//       } catch {
//         // keep defaults if tax settings cannot be loaded
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   useEffect(() => {
//     let cancelled = false;

//     (async () => {
//       try {
//         const response = await fetch("/api/settings");
//         const data = await response.json();
//         if (!response.ok || cancelled) return;

//         const settings = (data.settings ?? {}) as Record<string, unknown>;
//         const str = (value: unknown) => (typeof value === "string" ? value : "");

//         setProfile({
//           businessName: str(settings.businessName),
//           email: str(settings.email),
//           phone: str(settings.phone),
//           address: str(settings.address),
//           website: str(settings.website),
//           registrationNumber: str(settings.registrationNumber),
//         });
//         setLogoUrl(
//   str(settings.logoDataUrl) || str(settings.logoUrl)
// );
// setLogoPath(str(settings.logoPath));
//       } catch {
//         // keep empty defaults if settings cannot be loaded
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const hasPasswordProvider =
//     user?.providerData.some((provider) => provider.providerId === "password") ?? false;

//   const handleSave = async () => {
//     setSaving(true);
//     await new Promise((r) => setTimeout(r, 1000));
//     setSaving(false);
//     setSaved(true);
//     window.dispatchEvent(new Event("profile-updated"));
//     setTimeout(() => setSaved(false), 3000);
//   };

//   const closePasswordDialog = () => {
//     setPasswordOpen(false);
//     setCurrentPassword("");
//     setNewPassword("");
//     setConfirmPassword("");
//     setPasswordError("");
//     setPasswordSuccess("");
//   };


// const handleChangePassword = async (
//   event: React.FormEvent<HTMLFormElement>
// ) => {
//   event.preventDefault();
//   setPasswordError("");
//   setPasswordSuccess("");

//   if (!currentPassword) {
//     setPasswordError("Current password is required.");
//     return;
//   }

//   if (!newPassword) {
//     setPasswordError("New password is required.");
//     return;
//   }

//   if (newPassword.length < 6) {
//     setPasswordError("Password must be at least 6 characters.");
//     return;
//   }

//   if (newPassword.length > 128) {
//     setPasswordError("Password cannot exceed 128 characters.");
//     return;
//   }

//   if (newPassword !== confirmPassword) {
//     setPasswordError("Passwords do not match.");
//     return;
//   }

//   if (newPassword === currentPassword) {
//     setPasswordError(
//       "New password must be different from the current password."
//     );
//     return;
//   }

//   if (!user?.email) {
//     setPasswordError("Unable to determine account email.");
//     return;
//   }

//   if (
//     !user.providerData.some(
//       (provider) => provider.providerId === "password"
//     )
//   ) {
//     setPasswordError(
//       "Your account has no email-and-password sign-in method."
//     );
//     return;
//   }

//   setChangingPassword(true);

//   try {
//     const credential = EmailAuthProvider.credential(
//       user.email,
//       currentPassword
//     );

//     await reauthenticateWithCredential(user, credential);
//     await updatePassword(user, newPassword);

//     setPasswordSuccess("Password changed successfully.");

//     setTimeout(() => closePasswordDialog(), 1500);
//   } catch (error) {
//     const code = (error as AuthError)?.code;

//     switch (code) {
//       case "auth/wrong-password":
//       case "auth/invalid-credential":
//       case "auth/invalid-login-credentials":
//         setPasswordError("Current password is incorrect.");
//         break;

//       case "auth/too-many-requests":
//         setPasswordError("Too many attempts. Please try again later.");
//         break;

//       case "auth/weak-password":
//         setPasswordError("This password is too weak.");
//         break;

//       case "auth/network-request-failed":
//         setPasswordError(
//           "Network error. Please check your connection and try again."
//         );
//         break;

//       case "auth/requires-recent-login":
//         setPasswordError(
//           "Your session has expired. Please sign in again and retry."
//         );
//         break;

//       default:
//         setPasswordError("Failed to change password. Please try again.");
//     }
//   } finally {
//     setChangingPassword(false);
//   }
// };


//   const closeDeleteDialog = () => {
//     setDeleteOpen(false);
//     setDeletePassword("");
//     setDeleteConfirmText("");
//     setDeleteError("");
//   };

//   const handleDeleteAccount = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setDeleteError("");

//     if (!user) return;

//     if (deleteConfirmText !== "DELETE") {
//       setDeleteError('Type "DELETE" to confirm');
//       return;
//     }

//     const email = user.email;
//     if (hasPasswordProvider && !deletePassword) {
//       setDeleteError("Current password is required");
//       return;
//     }
//     if (hasPasswordProvider && !email) {
//       setDeleteError("Unable to determine account email");
//       return;
//     }

//     setDeletingAccount(true);
//     try {
//       if (hasPasswordProvider && email && deletePassword) {
//         const credential = EmailAuthProvider.credential(email, deletePassword);
//         await reauthenticateWithCredential(user, credential);
//       }

//       await user.delete();

//       // Best-effort cleanup of the user's avatar files
//       try {
//         const folderRef = storageRef(storage, `avatars/${user.uid}`);
//         const listed = await listAll(folderRef);
//         await Promise.all(listed.items.map((item) => deleteObject(item)));
//       } catch {
//         // ignore cleanup failures
//       }

//       await fetch("/api/auth/session", { method: "DELETE" });
//       document.cookie = "__session=; path=/; max-age=0; SameSite=Lax";
//       router.replace("/login");
//     } catch (error) {
//       const code = (error as AuthError)?.code;
//       switch (code) {
//         case "auth/wrong-password":
//         case "auth/invalid-credential":
//         case "auth/invalid-login-credentials":
//           setDeleteError("Current password is incorrect");
//           break;
//         case "auth/too-many-requests":
//           setDeleteError("Too many attempts. Please try again later");
//           break;
//         case "auth/network-request-failed":
//           setDeleteError("Network error. Please check your connection and try again");
//           break;
//         case "auth/requires-recent-login":
//           setDeleteError("Session expired. Please sign out, sign in again, and retry");
//           break;
//         default:
//           setDeleteError("Failed to delete account. Please try again");
//       }
//     } finally {
//       setDeletingAccount(false);
//     }
//   };

//   const handleExportData = async () => {
//     setExporting(true);
//     setDataMessage(null);
//     try {
//       const response = await fetch("/api/data");
//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || "Export failed");
//       }

//       const blob = new Blob([JSON.stringify(data, null, 2)], {
//         type: "application/json",
//       });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = `ledgerflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       URL.revokeObjectURL(url);

//       setDataMessage({
//         type: "success",
//         text: `Backup downloaded (${data.accounts?.length ?? 0} accounts, ${data.contacts?.length ?? 0} contacts, ${data.invoices?.length ?? 0} invoices, ${data.transactions?.length ?? 0} transactions).`,
//       });
//     } catch (error) {
//       setDataMessage({
//         type: "error",
//         text: error instanceof Error ? error.message : "Export failed",
//       });
//     } finally {
//       setExporting(false);
//     }
//   };

//   const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     event.target.value = "";
//     if (!file) return;

//     setImporting(true);
//     setDataMessage(null);
//     try {
//       const text = await file.text();
//       let parsed: unknown;
//       try {
//         parsed = JSON.parse(text);
//       } catch {
//         throw new Error("Selected file is not valid JSON");
//       }
//       if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
//         throw new Error("Backup file must be a JSON object exported from this app");
//       }

//       const payload = parsed as Record<string, unknown>;
//       const response = await fetch("/api/data", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           accounts: payload.accounts,
//           contacts: payload.contacts,
//           invoices: payload.invoices,
//           transactions: payload.transactions,
//         }),
//       });
//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || "Import failed");
//       }

//       const counts = data.imported ?? {};
//       const skippedNote =
//         data.skipped > 0 ? `, skipped ${data.skipped} invalid entries` : "";
//       setDataMessage({
//         type: "success",
//         text: `Imported ${counts.accounts ?? 0} accounts, ${counts.contacts ?? 0} contacts, ${counts.invoices ?? 0} invoices, and ${counts.transactions ?? 0} transactions${skippedNote}.`,
//       });
//     } catch (error) {
//       setDataMessage({
//         type: "error",
//         text: error instanceof Error ? error.message : "Import failed",
//       });
//     } finally {
//       setImporting(false);
//     }
//   };

//   const handleDeleteAllData = async () => {
//     const confirmed = window.confirm(
//       "Permanently delete ALL accounting records (accounts, contacts, invoices, and transactions)? This cannot be undone."
//     );
//     if (!confirmed) return;

//     setDeletingData(true);
//     setDataMessage(null);
//     try {
//       const response = await fetch("/api/data", { method: "DELETE" });
//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || "Delete failed");
//       }
//       setDataMessage({
//         type: "success",
//         text: `Deleted ${data.deleted ?? 0} records.`,
//       });
//     } catch (error) {
//       setDataMessage({
//         type: "error",
//         text: error instanceof Error ? error.message : "Delete failed",
//       });
//     } finally {
//       setDeletingData(false);
//     }
//   };

//   const updateProfileField = (field: keyof typeof profile, value: string) => {
//     setProfile((prev) => ({ ...prev, [field]: value }));
//     setProfileErrors((prev) => {
//       if (!prev[field]) return prev;
//       const next = { ...prev };
//       delete next[field];
//       return next;
//     });
//   };

 
// const handleLogoChange = async (
//   event: React.ChangeEvent<HTMLInputElement>
// ) => {
//   const file = event.target.files?.[0];
//   event.target.value = "";

//   if (!file) return;

//   if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
//     setProfileMessage({
//       type: "error",
//       text: "Please select a PNG, JPG, or WebP image.",
//     });
//     return;
//   }

//   // Base64 increases the file size by approximately 33%.
//   // Keep the image small enough for a Firestore document.
//   if (file.size > 500 * 1024) {
//     setProfileMessage({
//       type: "error",
//       text: "Logo must be 500 KB or smaller.",
//     });
//     return;
//   }

//   setLogoUploading(true);
//   setProfileMessage(null);

//   try {
//     const logoDataUrl: string = await new Promise(
//       (resolve, reject) => {
//         const reader = new FileReader();

//         reader.onload = () => {
//           if (typeof reader.result !== "string") {
//             reject(new Error("Unable to read the selected image."));
//             return;
//           }

//           resolve(reader.result);
//         };

//         reader.onerror = () => {
//           reject(new Error("Failed to read the selected image."));
//         };

//         reader.readAsDataURL(file);
//       }
//     );

//     setLogoUrl(logoDataUrl);

//     // Clear the old Storage reference if this state is still used.
//     setLogoPath("");

//     setProfileMessage({
//       type: "success",
//       text: "Logo selected. Click Save Changes to save it.",
//     });
//   } catch (error) {
//     setProfileMessage({
//       type: "error",
//       text:
//         error instanceof Error
//           ? error.message
//           : "Unable to process the logo.",
//     });
//   } finally {
//     setLogoUploading(false);
//   }
// };


//   const validateProfile = () => {
//     const errors: { [key: string]: string } = {};

//     if (!profile.businessName.trim()) {
//       errors.businessName = "Business name is required";
//     } else if (profile.businessName.trim().length > 150) {
//       errors.businessName = "Business name must be 150 characters or fewer";
//     }

//     const email = profile.email.trim();
//     if (!email) {
//       errors.email = "Business email is required";
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//       errors.email = "Enter a valid email address";
//     }

//     if (profile.phone.trim().length > 30) {
//       errors.phone = "Phone number must be 30 characters or fewer";
//     }

//     if (profile.address.trim().length > 300) {
//       errors.address = "Address must be 300 characters or fewer";
//     }

//     const website = profile.website.trim();
//     if (website && !/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(website)) {
//       errors.website = "Enter a valid website (e.g., https://example.com)";
//     }

//     if (profile.registrationNumber.trim().length > 100) {
//       errors.registrationNumber = "Registration number must be 100 characters or fewer";
//     }

//     return errors;
//   };

  
// const handleProfileSave = async (
//   event: React.FormEvent<HTMLFormElement>
// ) => {
//   event.preventDefault();
//   setProfileMessage(null);

//   const errors = validateProfile();
//   setProfileErrors(errors);

//   if (Object.keys(errors).length > 0) {
//     setProfileMessage({
//       type: "error",
//       text: "Please fix the highlighted fields.",
//     });
//     return;
//   }

//   const website = profile.website.trim();

//   const normalizedWebsite =
//     website && !/^https?:\/\//i.test(website)
//       ? `https://${website}`
//       : website;

//   const payload = {
//     ...profile,
//     businessName: profile.businessName.trim(),
//     email: profile.email.trim(),
//     phone: profile.phone.trim(),
//     address: profile.address.trim(),
//     website: normalizedWebsite,
//     registrationNumber: profile.registrationNumber.trim(),
//     logoDataUrl: logoUrl,
//   };

//   setProfileSaving(true);
//   setProfileSaved(false);

//   try {
//     const response = await fetch("/api/settings", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       credentials: "include",
//       body: JSON.stringify(payload),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.error || "Failed to save business settings.");
//     }

//     setProfile((prev) => ({
//       ...prev,
//       website: normalizedWebsite,
//     }));

//     setProfileMessage({
//       type: "success",
//       text: "Business profile saved successfully.",
//     });

//     setProfileSaved(true);
//     setTimeout(() => setProfileSaved(false), 3000);
//   } catch (error) {
//     setProfileMessage({
//       type: "error",
//       text:
//         error instanceof Error
//           ? error.message
//           : "Failed to save business settings.",
//     });
//   } finally {
//     setProfileSaving(false);
//   }
// };


//   const updateTaxField = (
//     field: keyof typeof tax,
//     value: string | string[]
//   ) => {
//     setTax((prev) => ({ ...prev, [field]: value }));
//     setTaxErrors((prev) => {
//       if (!prev[field]) return prev;
//       const next = { ...prev };
//       delete next[field];
//       return next;
//     });
//   };

//   const toggleTax = (taxName: string, checked: boolean) => {
//     setTax((prev) => ({
//       ...prev,
//       enabledTaxes: checked
//         ? [...prev.enabledTaxes, taxName]
//         : prev.enabledTaxes.filter((value) => value !== taxName),
//     }));
//   };

//   const validateTax = () => {
//     const errors: { [key: string]: string } = {};

//     if (tax.gstin && tax.gstin.length > 30) {
//       errors.gstin = "Tax ID must be 30 characters or fewer";
//     } else if (tax.gstin && !/^[0-9A-Za-z]+$/.test(tax.gstin)) {
//       errors.gstin = "Only letters and numbers are allowed";
//     }

//     if (tax.taxRegistrationDetails.length > 300) {
//       errors.taxRegistrationDetails = "Must be 300 characters or fewer";
//     }

//     const rate = Number(tax.defaultTaxRate);
//     if (
//       tax.defaultTaxRate.trim() === "" ||
//       !Number.isFinite(rate) ||
//       rate < 0 ||
//       rate > 100
//     ) {
//       errors.defaultTaxRate = "Enter a rate between 0 and 100";
//     }

//     return errors;
//   };

//   const handleTaxSave = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setTaxMessage(null);

//     const errors = validateTax();
//     setTaxErrors(errors);
//     if (Object.keys(errors).length > 0) {
//       setTaxMessage({
//         type: "error",
//         text: "Please fix the highlighted fields.",
//       });
//       return;
//     }

//     const payload = {
//       gstin: tax.gstin.trim(),
//       taxRegistrationDetails: tax.taxRegistrationDetails.trim(),
//       defaultTaxRate: Number(tax.defaultTaxRate),
//       pricingMode: tax.pricingMode,
//       taxSummary: tax.taxSummary,
//       enabledTaxes: tax.enabledTaxes,
//     };

//     setTaxSaving(true);
//     setTaxSaved(false);
//     try {
//       const response = await fetch("/api/tax-settings", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || "Save failed");
//       }

//       setTaxMessage({ type: "success", text: "Tax settings saved." });
//       setTaxSaved(true);
//       setTimeout(() => setTaxSaved(false), 3000);
//     } catch (error) {
//       setTaxMessage({
//         type: "error",
//         text: error instanceof Error ? error.message : "Save failed",
//       });
//     } finally {
//       setTaxSaving(false);
//     }
//   };

//   const updateAccountingField = (
//     field: keyof typeof accounting,
//     value: string
//   ) => {
//     setAccounting((prev) => ({ ...prev, [field]: value }));
//     setAccountingErrors((prev) => {
//       if (!prev[field]) return prev;
//       const next = { ...prev };
//       delete next[field];
//       return next;
//     });
//   };


// const validateAccounting = () => {
//   const errors: { [key: string]: string } = {};

//   if (!/^[A-Z]{3}$/.test(accounting.baseCurrency)) {
//     errors.baseCurrency = "Select a valid currency";
//   }

//   if (!/^\d{2}-\d{2}$/.test(accounting.fyStartDate)) {
//     errors.fyStartDate = "Select a valid financial year start";
//   }

//   const format = accounting.invoiceFormat.trim();

//   if (!format) {
//     errors.invoiceFormat = "Invoice numbering format is required";
//   } else if (format.length > 50) {
//     errors.invoiceFormat = "Must be 50 characters or fewer";
//   } else if (!/^[A-Za-z0-9_-]+(?:\{(?:YYYY|MM|SEQ)\}[A-Za-z0-9_-]*)*$/.test(format)) {
//     errors.invoiceFormat =
//       "Use only letters, numbers, hyphens, underscores, and supported tokens: {YYYY}, {MM}, {SEQ}";
//   } else if (!format.includes("{SEQ}")) {
//     errors.invoiceFormat = "Must include the {SEQ} token";
//   }

//   return errors;
// };


//   const handleAccountingSave = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setAccountingMessage(null);

//     const errors = validateAccounting();
//     setAccountingErrors(errors);
//     if (Object.keys(errors).length > 0) {
//       setAccountingMessage({
//         type: "error",
//         text: "Please fix the highlighted fields.",
//       });
//       return;
//     }

//     const payload = {
//       baseCurrency: accounting.baseCurrency,
//       fyStartDate: accounting.fyStartDate,
//       dateFormat: accounting.dateFormat,
//       paymentTerms: accounting.paymentTerms,
//       invoiceFormat: accounting.invoiceFormat.trim(),
//       defaultSalesAccount: accounting.defaultSalesAccount,
//       defaultExpenseAccount: accounting.defaultExpenseAccount,
//     };

//     setAccountingSaving(true);
//     setAccountingSaved(false);
//     try {
//       const response = await fetch("/api/accounting-preferences", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || "Save failed");
//       }

//       setAccountingMessage({
//         type: "success",
//         text: "Accounting preferences saved.",
//       });
//       setAccountingSaved(true);
//       setTimeout(() => setAccountingSaved(false), 3000);
//     } catch (error) {
//       setAccountingMessage({
//         type: "error",
//         text: error instanceof Error ? error.message : "Save failed",
//       });
//     } finally {
//       setAccountingSaving(false);
//     }
//   };

//   const handleSignOut = async () => {
//     clearError();
//     setSigningOut(true);
//     try {
//       await signOut();
//     } finally {
//       setSigningOut(false);
//     }
//   };

//   const describeDevice = () => {
//     const ua = navigator.userAgent;
//     const browser = /Edg\//.test(ua)
//       ? "Edge"
//       : /OPR\/|Opera/.test(ua)
//         ? "Opera"
//         : /Chrome\//.test(ua)
//           ? "Chrome"
//           : /Firefox\//.test(ua)
//             ? "Firefox"
//             : /Safari\//.test(ua)
//               ? "Safari"
//               : "Browser";
//     const os = /Windows/.test(ua)
//       ? "Windows"
//       : /Mac OS X/.test(ua)
//         ? "macOS"
//         : /Android/.test(ua)
//           ? "Android"
//           : /iPhone|iPad/.test(ua)
//             ? "iOS"
//             : /Linux/.test(ua)
//               ? "Linux"
//               : "Unknown OS";
//     return `${browser} on ${os}`;
//   };

//   const openSessions = async () => {
//     setSessionsOpen(true);
//     setSessionError("");
//     if (!user) return;
//     setSessionLoading(true);
//     try {
//       const result = await user.getIdTokenResult();
//       try {
//         await user.reload();
//       } catch {
//         // Reload failure is non-fatal; metadata may be stale
//       }
//       setSessionData({
//         device: describeDevice(),
//         authTime: result.authTime
//           ? new Date(result.authTime).toLocaleString()
//           : "",
//         issuedAt: result.issuedAtTime
//           ? new Date(result.issuedAtTime).toLocaleString()
//           : "",
//         createdAt: user.metadata.creationTime ?? "",
//         lastSignIn: user.metadata.lastSignInTime ?? "",
//       });
//     } catch {
//       setSessionError("Could not load session details.");
//     } finally {
//       setSessionLoading(false);
//     }
//   };

//   const handleSendVerification = async () => {
//     if (!user) return;
//     setVerificationMessage(null);
//     setSendingVerification(true);
//     try {
//       await sendEmailVerification(user);
//       setVerificationMessage({
//         type: "success",
//         text: `Verification link sent to ${user.email}. Open it, then reload this page.`,
//       });
//     } catch (error) {
//       const code = (error as AuthError).code;
//       setVerificationMessage({
//         type: "error",
//         text:
//           code === "auth/too-many-requests"
//             ? "Too many attempts. Please try again later."
//             : code === "auth/user-disabled"
//               ? "This account has been disabled."
//               : code === "auth/invalid-credential"
//                 ? "Please sign out and sign in again, then retry."
//                 : "Could not send verification email. Try again.",
//       });
//     } finally {
//       setSendingVerification(false);
//       setTimeout(() => setVerificationMessage(null), 5000);
//     }
//   };


//   useEffect(() => {
//   let cancelled = false;

//   async function loadProfile() {
//     setProfileLoading(true);
//     setProfileError("");

//     try {
//       const response = await fetch("/api/profile", {
//         cache: "no-store",
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Unable to load profile.");
//       }

//       if (!cancelled) {
//         setProfileForm({
//           firstName: data.profile?.firstName ?? "",
//           lastName: data.profile?.lastName ?? "",
//           email: data.profile?.email ?? user?.email ?? "",
//           phone: data.profile?.phone ?? "",
//           bio: data.profile?.bio ?? "",
//         });
//       }
//     } catch (error) {
//       if (!cancelled) {
//         setProfileError(
//           error instanceof Error
//             ? error.message
//             : "Unable to load profile."
//         );
//       }
//     } finally {
//       if (!cancelled) setProfileLoading(false);
//     }
//   }

//   if (user) {
//     void loadProfile();
//   } else {
//     setProfileLoading(false);
//   }

//   return () => {
//     cancelled = true;
//   };
// }, [user?.uid, user?.email]);


// const handleSaveProfile = async () => {
//   setSaving(true);
//   setSaved(false);
//   setProfileError("");

//   try {
//     const response = await fetch("/api/profile", {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         firstName: profileForm.firstName,
//         lastName: profileForm.lastName,
//         phone: profileForm.phone,
//         bio: profileForm.bio,
//       }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.error || "Unable to save profile.");
//     }

//     setProfileForm((current) => ({
//       ...current,
//       ...data.profile,
//       email: user?.email ?? current.email,
//     }));

//     setSaved(true);
//   } catch (error) {
//     setProfileError(
//       error instanceof Error
//         ? error.message
//         : "Unable to save profile."
//     );
//   } finally {
//     setSaving(false);
//   }
// };


// useEffect(() => {
//   if (!user || !canViewNotifications) return;

//   let cancelled = false;

//   async function loadNotificationPreferences() {
//     setNotificationPreferencesLoading(true);
//     setNotificationPreferencesError("");

//     try {
//       const response = await fetch("/api/notification-preferences", {
//         cache: "no-store",
//       });

//       if (!response.ok) {
//         throw new Error("Unable to load notification preferences.");
//       }

//       const data = await response.json();

//       if (!cancelled && data.preferences) {
//         setNotificationPreferences({
//           inAppEnabled: data.preferences.inAppEnabled === true,
//         });
//       }
//     } catch (error) {
//       if (!cancelled) {
//         setNotificationPreferencesError(
//           error instanceof Error
//             ? error.message
//             : "Unable to load notification preferences."
//         );
//       }
//     } finally {
//       if (!cancelled) setNotificationPreferencesLoading(false);
//     }
//   }

//   void loadNotificationPreferences();

//   return () => {
//     cancelled = true;
//   };
// }, [user, canViewNotifications]);

// async function updateNotificationPreference(
//   key: "emailEnabled" | "inAppEnabled",
//   value: boolean
// ) {
//   const previous = notificationPreferences;

//   setNotificationPreferences((current) => ({
//     ...current,
//     [key]: value,
//   }));
//   setNotificationPreferencesSaving(true);
//   setNotificationPreferencesSaved(false);
//   setNotificationPreferencesError("");

//   try {
//     const response = await fetch("/api/notification-preferences", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ [key]: value }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(
//         data.error || "Unable to save notification preferences."
//       );
//     }

//     setNotificationPreferences(data.preferences);
//     setNotificationPreferencesSaved(true);
//   } catch (error) {
//     setNotificationPreferences(previous);
//     setNotificationPreferencesError(
//       error instanceof Error
//         ? error.message
//         : "Unable to save notification preferences."
//     );
//   } finally {
//     setNotificationPreferencesSaving(false);
//   }
// }


//   return (
//     <div className="flex min-h-screen bg-background text-foreground">
//       <div className="hidden md:block">
//         <Sidebar />
//       </div>

//       <main className="min-w-0 flex-1">
//         <Header />

//         <div className="space-y-8 p-5 sm:p-8">
//           <section className="flex items-center justify-between gap-4">
//             <div className="flex items-center gap-3">
//               <Settings className="h-8 w-8 text-primary" />
//               <div>
//                 <h1 className="text-2xl font-bold tracking-tight text-foreground">
//                   Settings
//                 </h1>
//                 <p className="mt-1 text-sm text-muted-foreground">
//                   Manage your account and application preferences
//                 </p>
//               </div>
//             </div>
//           </section>

//           <Tabs defaultValue="profile" className="w-full">
//             <TabsList className={`grid w-full ${isAdmin ? "grid-cols-7" : "grid-cols-6"}`}>

// {canViewProfile && (
//   <TabsTrigger value="profile">Profile</TabsTrigger>
// )}


// {canViewNotifications && (
//   <TabsTrigger value="notifications">Notifications</TabsTrigger>
// )}

// {canViewAppearance && (
//   <TabsTrigger value="appearance">Appearance</TabsTrigger>
// )}

// {canViewSecurity && (
//   <TabsTrigger value="security">Security</TabsTrigger>
// )}

// {canViewCompany && (
//   <TabsTrigger value="company">Business Profile</TabsTrigger>
// )}

// {canViewAdvanced && (
//   <TabsTrigger value="advanced">Advanced</TabsTrigger>
// )}
//               {isAdmin && (<TabsTrigger value="users"> Users & Permissions
//   </TabsTrigger>
// )}
//             </TabsList>
//             {canViewProfile && (
//   <TabsContent value="profile" className="mt-6 space-y-6">
//     <Card>
//       <CardHeader>
//         <CardTitle>Profile Information</CardTitle>
//         <CardDescription>
//           Manage your personal information
//         </CardDescription>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         {profileLoading ? (
//           <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
//             <Loader2 className="h-4 w-4 animate-spin" />
//             Loading profile...
//           </div>
//         ) : (
//           <>
//             {profileError && (
//               <p role="alert" className="text-sm text-destructive">
//                 {profileError}
//               </p>
//             )}

//             <div className="grid gap-4 sm:grid-cols-2">
//               <div className="space-y-2">
//                 <Label htmlFor="firstName">First Name</Label>
//                 <Input
//                   id="firstName"
//                   value={profileForm.firstName}
//                   onChange={(e) =>
//                     setProfileForm((current) => ({
//                       ...current,
//                       firstName: e.target.value,
//                     }))
//                   }
//                   maxLength={80}
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="lastName">Last Name</Label>
//                 <Input
//                   id="lastName"
//                   value={profileForm.lastName}
//                   onChange={(e) =>
//                     setProfileForm((current) => ({
//                       ...current,
//                       lastName: e.target.value,
//                     }))
//                   }
//                   maxLength={80}
//                   required
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="email">Email</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   value={profileForm.email}
//                   disabled
//                   readOnly
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="phone">Phone</Label>
//                 <Input
//                   id="phone"
//                   type="tel"
//                   value={profileForm.phone}
//                   onChange={(e) =>
//                     setProfileForm((current) => ({
//                       ...current,
//                       phone: e.target.value,
//                     }))
//                   }
//                   maxLength={30}
//                 />
//               </div>

//               <div className="space-y-2 sm:col-span-2">
//                 <Label htmlFor="bio">Bio</Label>
//                 <Input
//                   id="bio"
//                   value={profileForm.bio}
//                   onChange={(e) =>
//                     setProfileForm((current) => ({
//                       ...current,
//                       bio: e.target.value,
//                     }))
//                   }
//                   maxLength={500}
//                 />
//               </div>
//             </div>

//             <div className="flex justify-end border-t border-border pt-4">
//               <Button
//                 onClick={handleSaveProfile}
//                 disabled={saving || profileLoading}
//               >
//                 {saving ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Saving...
//                   </>
//                 ) : saved ? (
//                   <>
//                     <Check className="mr-2 h-4 w-4" />
//                     Saved
//                   </>
//                 ) : (
//                   "Save Changes"
//                 )}
//               </Button>
//             </div>
//           </>
//         )}
//       </CardContent>
//     </Card>
//   </TabsContent>
// )}
// {canViewNotifications && (
//             <TabsContent value="notifications" className="mt-6 space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Notification Preferences</CardTitle>
//                   <CardDescription>Choose how and when you receive notifications</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
                 
// <div className="flex items-center justify-between gap-4 border-b border-border/50 py-4">
//   {/* <div className="flex items-center gap-3">
//     <Mail className="h-5 w-5 text-muted-foreground" />
//     <div>
//       <p className="font-medium text-foreground">Email Notifications</p>
//       <p className="text-sm text-muted-foreground">
//         Receive important updates by email.
//       </p>
//     </div>
//   </div> */}

//   {/* <Switch
//     checked={notificationPreferences.emailEnabled}
//     onCheckedChange={(checked) =>
//       void updateNotificationPreference("emailEnabled", checked)
//     }
//     disabled={
//       !canEditNotifications ||
//       notificationPreferencesLoading ||
//       notificationPreferencesSaving
//     }
//     aria-label="Email Notifications"
//   /> */}
// </div>

// <div className="flex items-center justify-between gap-4 py-4">
//   <div className="flex items-center gap-3">
//     <Bell className="h-5 w-5 text-muted-foreground" />
//     <div>
//       <p className="font-medium text-foreground">In-App Notifications</p>
//       <p className="text-sm text-muted-foreground">
//         Show notifications in the header bell.
//       </p>
//     </div>
//   </div>

//   <Switch
//     checked={notificationPreferences.inAppEnabled}
//     onCheckedChange={(checked) =>
//       void updateNotificationPreference("inAppEnabled", checked)
//     }
//     disabled={
//       !canEditNotifications ||
//       notificationPreferencesLoading ||
//       notificationPreferencesSaving
//     }
//     aria-label="In-App Notifications"
//   />
// </div>

// {notificationPreferencesError && (
//   <p role="alert" className="text-sm text-destructive">
//     {notificationPreferencesError}
//   </p>
// )}

// {notificationPreferencesSaved && (
//   <p role="status" className="text-sm text-muted-foreground">
//     Notification preferences saved.
//   </p>
// )}

//                 </CardContent>
//               </Card>
//             </TabsContent>
//             )}

//             <TabsContent value="appearance" className="mt-6 space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Appearance</CardTitle>
//                   <CardDescription>Customize how the application looks</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   <div>
//                     <Label>Theme</Label>
//                     <div className="mt-3 grid grid-cols-3 gap-4">
//                       {(["light", "dark", "system"] as const).map((option) => (
//                         <button
//                           key={option}
//                           type="button"
//                           onClick={() => setTheme(option)}
//                           aria-pressed={theme === option}
//                           className={cn(
//                             "relative p-4 rounded-lg border-2 transition-all cursor-pointer",
//                             theme === option
//                               ? "border-primary bg-primary/5"
//                               : "border-border hover:border-muted-foreground/50"
//                           )}
//                         >
//                           <div className="flex items-center justify-center gap-2 mb-2">
//                             {option === "light" && <Sun className="h-5 w-5 text-primary" />}
//                             {option === "dark" && <Moon className="h-5 w-5 text-primary" />}
//                             {option === "system" && <Monitor className="h-5 w-5 text-primary" />}
//                           </div>
//                           <p className="text-sm font-medium text-foreground capitalize">{option}</p>
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                   <Separator />
//                   <div>
//                     <Label>Color Scheme</Label>
//                     <p className="text-sm text-muted-foreground mt-1">
//                       Monochrome Executive theme is currently active. Additional color schemes coming soon.
//                     </p>
//                   </div>
//                   <Separator />
//                   <div className="flex items-center justify-between">
                  
                    
//                   </div>
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="security" className="mt-6 space-y-6">

              
// {isAdmin && (
//   <Card>
//     <CardHeader>
//       <CardTitle className="flex items-center gap-2">
//         <Shield className="h-5 w-5 text-primary" />
//         Security Overview
//       </CardTitle>
//       <CardDescription>
//         Review account protection and security controls for LedgerFlow.
//       </CardDescription>
//     </CardHeader>
//   </Card>
// )}

//               <Card>
//                 <CardHeader>
//                   <CardTitle>Security</CardTitle>
//                   <CardDescription>Manage your account security settings</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
                 
// {isAdmin && (
//   <div className="flex items-center justify-between p-4 rounded-lg border border-border">
//     <div className="flex items-center gap-3">
//       <Key className="h-5 w-5 text-primary" />
//       <div>
//         <p className="font-medium text-foreground">Change Password</p>
//         <p className="text-sm text-muted-foreground">
//           Update the password for your account
//         </p>
//       </div>
//     </div>
//     <Button
//       variant="outline"
//       onClick={() => setPasswordOpen(true)}
//     >
//       Change Password
//     </Button>
//   </div>
// )}
// <Separator />

//                   <Separator />
                 
// <div className="flex items-center justify-between p-4 rounded-lg border border-border">
//   <div className="flex items-center gap-3">
//     <Check className="h-5 w-5 text-green-600" />

//     <div>
//       <p className="font-medium text-foreground">
//         Authentication Status
//       </p>

//       <p className="text-sm text-muted-foreground">
//         Signed in as {user?.email ?? "Unknown account"} ·{" "}
//         {user?.providerData.some(
//           (provider) => provider.providerId === "google.com"
//         )
//           ? "Google"
//           : user?.providerData.some(
//                 (provider) => provider.providerId === "password"
//               )
//             ? "Email & password"
//             : "Other sign-in method"}
//       </p>
//     </div>
//   </div>

//   <span className="rounded-full border border-green-500/50 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400">
//     Authenticated
//   </span>
// </div>

//                   <Separator />
//                   <div className="flex items-center justify-between p-4 rounded-lg border border-border">
//                     <div className="flex items-center gap-3">
//                       <Shield className="h-5 w-5 text-primary" />
//                       <div>
//                         <p className="font-medium text-foreground">
//                           Session Management
//                         </p>
//                         <p className="text-sm text-muted-foreground">
//                           View active session details for this device
//                         </p>
//                       </div>
//                     </div>
//                     <Button variant="outline" onClick={openSessions}>
//                       View Sessions
//                     </Button>
//                   </div>
//                   <Separator />
//                   <div className="flex items-center justify-between p-4 rounded-lg border border-border">
//                     <div className="flex items-center gap-3">
//                       <LogOut className="h-5 w-5 text-primary" />
//                       <div>
//                         <p className="font-medium text-foreground">Sign Out</p>
//                         <p className="text-sm text-muted-foreground">
//                           End your session on this device
//                         </p>
//                         {authError && (
//                           <p className="mt-1 text-xs text-red-600">
//                             {authError}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                     <Button
//                       variant="outline"
//                       onClick={handleSignOut}
//                       disabled={signingOut}
//                     >
//                       {signingOut ? (
//                         <>
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                           Signing out...
//                         </>
//                       ) : (
//                         "Sign Out"
//                       )}
//                     </Button>
//                   </div>
//                   <Separator />
                 
//                 </CardContent>
//               </Card>

//               <Dialog
//                 open={passwordOpen}
//                 onOpenChange={(open) => {
//                   if (!open) closePasswordDialog();
//                 }}
//               >
//                 <DialogContent>
//                   <DialogHeader>
//                     <DialogTitle>Change Password</DialogTitle>
//                     <DialogDescription>
//                       Confirm your current password, then choose a new one.
//                     </DialogDescription>
//                   </DialogHeader>
//                   <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
//                     {passwordError && (
//                       <div
//                         role="alert"
//                         className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-3 text-sm text-orange-700"
//                       >
//                         {passwordError}
//                       </div>
//                     )}
//                     {passwordSuccess && (
//                       <div
//                         role="status"
//                         className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700"
//                       >
//                         {passwordSuccess}
//                       </div>
//                     )}
//                     <div className="space-y-2">
//                       <Label htmlFor="currentPassword">Current Password</Label>
//                       <Input
//                         id="currentPassword"
//                         type="password"
//                         autoComplete="current-password"
//                         value={currentPassword}
//                         onChange={(e) => setCurrentPassword(e.target.value)}
//                         disabled={changingPassword}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="newPassword">New Password</Label>
//                       <Input
//                         id="newPassword"
//                         type="password"
//                         autoComplete="new-password"
//                         value={newPassword}
//                         onChange={(e) => setNewPassword(e.target.value)}
//                         disabled={changingPassword}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="confirmPassword">Confirm New Password</Label>
//                       <Input
//                         id="confirmPassword"
//                         type="password"
//                         autoComplete="new-password"
//                         value={confirmPassword}
//                         onChange={(e) => setConfirmPassword(e.target.value)}
//                         disabled={changingPassword}
//                       />
//                     </div>
//                    <p className="text-xs text-muted-foreground">
//   Use at least 6 characters. Letters and numbers are both allowed.
// </p>
//                     <DialogFooter>
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={closePasswordDialog}
//                         disabled={changingPassword}
//                       >
//                         Cancel
//                       </Button>
//                       <Button type="submit" disabled={changingPassword}>
//                         {changingPassword ? (
//                           <>
//                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                             Changing...
//                           </>
//                         ) : (
//                           "Change Password"
//                         )}
//                       </Button>
//                     </DialogFooter>
//                   </form>
//                 </DialogContent>
//               </Dialog>

//               <Dialog
//                 open={sessionsOpen}
//                 onOpenChange={(open) => {
//                   if (!open) setSessionsOpen(false);
//                 }}
//               >
//                 <DialogContent>
//                   <DialogHeader>
//                     <DialogTitle>Session Management</DialogTitle>
//                     <DialogDescription>
//                       Details of your active session on this device.
//                     </DialogDescription>
//                   </DialogHeader>
//                   {sessionLoading ? (
//                     <div className="flex items-center justify-center py-8">
//                       <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
//                     </div>
//                   ) : sessionError ? (
//                     <div
//                       role="alert"
//                       className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-3 text-sm text-orange-700"
//                     >
//                       {sessionError}
//                     </div>
//                   ) : (
//                     <div className="space-y-3">
//                       <div className="rounded-lg border border-border p-4">
//                         <div className="mb-3 flex items-center gap-2">
//                           <Monitor className="h-4 w-4 text-primary" />
//                           <span className="text-sm font-medium text-foreground">
//                             This device
//                           </span>
//                           <span className="ml-auto rounded-full border border-green-500/50 bg-green-500/10 px-2 py-0.5 text-xs text-green-700 dark:text-green-400">
//                             Active
//                           </span>
//                         </div>
//                         <dl className="space-y-2 text-sm">
//                           <div className="flex justify-between gap-4">
//                             <dt className="text-muted-foreground">Device</dt>
//                             <dd className="text-right text-foreground">
//                               {sessionData?.device ?? "—"}
//                             </dd>
//                           </div>
//                           <div className="flex justify-between gap-4">
//                             <dt className="text-muted-foreground">Account</dt>
//                             <dd className="truncate text-right text-foreground">
//                               {user?.email ?? "—"}
//                             </dd>
//                           </div>
//                           <div className="flex justify-between gap-4">
//                             <dt className="text-muted-foreground">Signed in</dt>
//                             <dd className="text-right text-foreground">
//                               {sessionData?.authTime || "—"}
//                             </dd>
//                           </div>
//                           <div className="flex justify-between gap-4">
//                             <dt className="text-muted-foreground">
//                               Session token issued
//                             </dt>
//                             <dd className="text-right text-foreground">
//                               {sessionData?.issuedAt || "—"}
//                             </dd>
//                           </div>
//                           <div className="flex justify-between gap-4">
//                             <dt className="text-muted-foreground">
//                               Account created
//                             </dt>
//                             <dd className="text-right text-foreground">
//                               {sessionData?.createdAt || "—"}
//                             </dd>
//                           </div>
//                         </dl>
//                       </div>
//                       <p className="text-xs text-muted-foreground">
//                         Signing out ends this session on this device. Other
//                         devices stay signed in until their sessions expire.
//                       </p>
//                     </div>
//                   )}
//                   <DialogFooter>
//                     <Button
//                       variant="outline"
//                       onClick={() => setSessionsOpen(false)}
//                     >
//                       Close
//                     </Button>
//                     <Button
//                       variant="outline"
//                       className="text-red-600 hover:text-red-700"
//                       onClick={() => {
//                         setSessionsOpen(false);
//                         void handleSignOut();
//                       }}
//                       disabled={signingOut}
//                     >
//                       {signingOut ? (
//                         <>
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                           Signing out...
//                         </>
//                       ) : (
//                         <>
//                           <LogOut className="mr-2 h-4 w-4" />
//                           Sign Out
//                         </>
//                       )}
//                     </Button>
//                   </DialogFooter>
//                 </DialogContent>
//               </Dialog>

//               <Dialog
//                 open={deleteOpen}
//                 onOpenChange={(open) => {
//                   if (!open) closeDeleteDialog();
//                 }}
//               >
//                 <DialogContent>
//                   <DialogHeader>
//                     <DialogTitle className="text-red-600 dark:text-red-400">
//                       Delete Account
//                     </DialogTitle>
//                     <DialogDescription>
//                       This permanently deletes your account and its data. This action cannot be
//                       undone.
//                     </DialogDescription>
//                   </DialogHeader>
//                   <form onSubmit={handleDeleteAccount} className="space-y-4" noValidate>
//                     {deleteError && (
//                       <div
//                         role="alert"
//                         className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
//                       >
//                         {deleteError}
//                       </div>
//                     )}
//                     <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
//                       All of your account information and files will be permanently removed.
//                     </div>
//                     {hasPasswordProvider && (
//                       <div className="space-y-2">
//                         <Label htmlFor="deletePassword">Current Password</Label>
//                         <Input
//                           id="deletePassword"
//                           type="password"
//                           autoComplete="current-password"
//                           value={deletePassword}
//                           onChange={(e) => setDeletePassword(e.target.value)}
//                           disabled={deletingAccount}
//                         />
//                       </div>
//                     )}
//                     <div className="space-y-2">
//                       <Label htmlFor="deleteConfirm">
//                         Type{" "}
//                         <span className="font-semibold text-red-600 dark:text-red-400">
//                           DELETE
//                         </span>{" "}
//                         to confirm
//                       </Label>
//                       <Input
//                         id="deleteConfirm"
//                         value={deleteConfirmText}
//                         onChange={(e) => setDeleteConfirmText(e.target.value)}
//                         placeholder="DELETE"
//                         disabled={deletingAccount}
//                       />
//                     </div>
//                     <DialogFooter>
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={closeDeleteDialog}
//                         disabled={deletingAccount}
//                       >
//                         Cancel
//                       </Button>
//                       <Button
//                         type="submit"
//                         variant="destructive"
//                         className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
//                         disabled={deletingAccount}
//                       >
//                         {deletingAccount ? (
//                           <>
//                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                             Deleting...
//                           </>
//                         ) : (
//                           "Delete Account"
//                         )}
//                       </Button>
//                     </DialogFooter>
//                   </form>
//                 </DialogContent>
//               </Dialog>
//             </TabsContent>

//             <TabsContent value="company" className="mt-6 space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Business Profile</CardTitle>
//                   <CardDescription>
//                     Manage your business details used on invoices and reports
//                   </CardDescription>
//                 </CardHeader>
//                 <form onSubmit={handleProfileSave} noValidate>
//                   <CardContent className="space-y-4">
//                     {profileMessage && (
//                       <div
//                         role={profileMessage.type === "error" ? "alert" : "status"}
//                         className={
//                           profileMessage.type === "error"
//                             ? "rounded-lg border border-orange-500/50 bg-orange-500/10 p-3 text-sm text-orange-700"
//                             : "rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700"
//                         }
//                       >
//                         {profileMessage.text}
//                       </div>
//                     )}

                   
// <div className="flex items-center gap-4">
//   <div className="h-16 w-16 overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center">
//     {logoUrl ? (
//       <img
//         src={logoUrl}
//         alt="Business logo"
//         className="h-full w-full object-contain"
//       />
//     ) : (
//       <Building2 className="h-6 w-6 text-muted-foreground" />
//     )}
//   </div>

//   <div className="flex flex-col items-start gap-2">
//     <input
//       ref={logoFileRef}
//       type="file"
//       accept="image/png,image/jpeg,image/webp"
//       onChange={handleLogoChange}
//       className="sr-only"
//       disabled={logoUploading || profileSaving}
//     />

//     <div className="flex flex-wrap items-center gap-2">
//       <Button
//         type="button"
//         variant="outline"
//         size="sm"
//         onClick={() => {
//           if (!logoUploading && !profileSaving) {
//             logoFileRef.current?.click();
//           }
//         }}
//         disabled={logoUploading || profileSaving}
//       >
//         {logoUploading ? (
//           <>
//             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//             Processing...
//           </>
//         ) : logoUrl ? (
//           "Change Logo"
//         ) : (
//           "Upload Logo"
//         )}
//       </Button>

//       {logoUrl && (
//         <Button
//           type="button"
//           variant="outline"
//           size="sm"
//           disabled={logoUploading || profileSaving}
//           onClick={() => {
//             setLogoUrl("");
//             setLogoPath("");
//             setProfileMessage({
//               type: "success",
//               text: "Logo removed. Click Save Changes to confirm removal.",
//             });
//           }}
//         >
//           <Trash2 className="mr-2 h-4 w-4" />
//           Remove Logo
//         </Button>
//       )}
//     </div>

//     <p className="text-xs text-muted-foreground">
//       PNG, JPG, or WebP, up to 500 KB.
//     </p>
//   </div>
// </div>


//                     <Separator />

//                     <div className="grid gap-4 sm:grid-cols-2">
//                       <div className="space-y-2">
//                         <Label htmlFor="businessName">
//                           Business Name{" "}
//                           <span className="text-red-600">*</span>
//                         </Label>
//                         <Input
//                           id="businessName"
//                           value={profile.businessName}
//                           onChange={(e) =>
//                             updateProfileField("businessName", e.target.value)
//                           }
//                           aria-required
//                           aria-invalid={!!profileErrors.businessName}
//                           disabled={profileSaving}
//                         />
//                         {profileErrors.businessName && (
//                           <p className="text-xs text-red-600">
//                             {profileErrors.businessName}
//                           </p>
//                         )}
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="businessEmail">
//                           Business Email{" "}
//                           <span className="text-red-600">*</span>
//                         </Label>
//                         <Input
//                           id="businessEmail"
//                           type="email"
//                           value={profile.email}
//                           onChange={(e) =>
//                             updateProfileField("email", e.target.value)
//                           }
//                           aria-required
//                           aria-invalid={!!profileErrors.email}
//                           disabled={profileSaving}
//                         />
//                         {profileErrors.email && (
//                           <p className="text-xs text-red-600">
//                             {profileErrors.email}
//                           </p>
//                         )}
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="businessPhone">Phone Number</Label>
//                         <Input
//                           id="businessPhone"
//                           type="tel"
//                           value={profile.phone}
//                           onChange={(e) =>
//                             updateProfileField("phone", e.target.value)
//                           }
//                           aria-invalid={!!profileErrors.phone}
//                           disabled={profileSaving}
//                         />
//                         {profileErrors.phone && (
//                           <p className="text-xs text-red-600">
//                             {profileErrors.phone}
//                           </p>
//                         )}
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="businessWebsite">Website</Label>
//                         <Input
//                           id="businessWebsite"
//                           value={profile.website}
//                           placeholder="https://example.com"
//                           onChange={(e) =>
//                             updateProfileField("website", e.target.value)
//                           }
//                           aria-invalid={!!profileErrors.website}
//                           disabled={profileSaving}
//                         />
//                         {profileErrors.website && (
//                           <p className="text-xs text-red-600">
//                             {profileErrors.website}
//                           </p>
//                         )}
//                       </div>
//                       <div className="space-y-2 sm:col-span-2">
//                         <Label htmlFor="registrationNumber">
//                           Business Registration Number
//                         </Label>
//                         <Input
//                           id="registrationNumber"
//                           value={profile.registrationNumber}
//                           onChange={(e) =>
//                             updateProfileField(
//                               "registrationNumber",
//                               e.target.value
//                             )
//                           }
//                           aria-invalid={!!profileErrors.registrationNumber}
//                           disabled={profileSaving}
//                         />
//                         {profileErrors.registrationNumber && (
//                           <p className="text-xs text-red-600">
//                             {profileErrors.registrationNumber}
//                           </p>
//                         )}
//                       </div>
//                       <div className="space-y-2 sm:col-span-2">
//                         <Label htmlFor="businessAddress">Business Address</Label>
//                         <Input
//                           id="businessAddress"
//                           value={profile.address}
//                           onChange={(e) =>
//                             updateProfileField("address", e.target.value)
//                           }
//                           aria-invalid={!!profileErrors.address}
//                           disabled={profileSaving}
//                         />
//                         {profileErrors.address && (
//                           <p className="text-xs text-red-600">
//                             {profileErrors.address}
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     <div className="flex justify-end pt-4 border-t border-border">
//                       <Button
//                         type="submit"
//                         disabled={profileSaving || logoUploading}
//                       >
//                         {profileSaving ? (
//                           <>
//                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                             Saving...
//                           </>
//                         ) : profileSaved ? (
//                           <>
//                             <Check className="mr-2 h-4 w-4" />
//                             Saved
//                           </>
//                         ) : (
//                           "Save Changes"
//                         )}
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </form>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle>Tax Settings</CardTitle>
//                   <CardDescription>
//                     Configure taxes applied to your invoices and reports
//                   </CardDescription>
//                 </CardHeader>
//                 <form onSubmit={handleTaxSave} noValidate>
//                   <CardContent className="space-y-4">
//                     {taxMessage && (
//                       <div
//                         role={taxMessage.type === "error" ? "alert" : "status"}
//                         className={
//                           taxMessage.type === "error"
//                             ? "rounded-lg border border-orange-500/50 bg-orange-500/10 p-3 text-sm text-orange-700"
//                             : "rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700"
//                         }
//                       >
//                         {taxMessage.text}
//                       </div>
//                     )}

//                     <div className="grid gap-4 sm:grid-cols-2">
//                       <div className="space-y-2">
//                         <Label htmlFor="taxIdNumber">
//                           Tax Identification Number (GSTIN, if applicable)
//                         </Label>
//                         <Input
//                           id="taxIdNumber"
//                           value={tax.gstin}
//                           placeholder="e.g., 27AAACA1234A1Z5"
//                           onChange={(e) => updateTaxField("gstin", e.target.value)}
//                           aria-invalid={!!taxErrors.gstin}
//                           disabled={taxSaving}
//                         />
//                         {taxErrors.gstin && (
//                           <p className="text-xs text-red-600">{taxErrors.gstin}</p>
//                         )}
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
//                         <Input
//                           id="defaultTaxRate"
//                           type="number"
//                           min={0}
//                           max={100}
//                           step="0.01"
//                           value={tax.defaultTaxRate}
//                           onChange={(e) =>
//                             updateTaxField("defaultTaxRate", e.target.value)
//                           }
//                           aria-invalid={!!taxErrors.defaultTaxRate}
//                           disabled={taxSaving}
//                         />
//                         {taxErrors.defaultTaxRate && (
//                           <p className="text-xs text-red-600">
//                             {taxErrors.defaultTaxRate}
//                           </p>
//                         )}
//                       </div>
//                       <div className="space-y-2 sm:col-span-2">
//                         <Label htmlFor="taxRegistrationDetails">
//                           Tax Registration Details
//                         </Label>
//                         <Input
//                           id="taxRegistrationDetails"
//                           value={tax.taxRegistrationDetails}
//                           placeholder="e.g., Registered in Maharashtra, LUT No. ..."
//                           onChange={(e) =>
//                             updateTaxField("taxRegistrationDetails", e.target.value)
//                           }
//                           aria-invalid={!!taxErrors.taxRegistrationDetails}
//                           disabled={taxSaving}
//                         />
//                         {taxErrors.taxRegistrationDetails && (
//                           <p className="text-xs text-red-600">
//                             {taxErrors.taxRegistrationDetails}
//                           </p>
//                         )}
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="pricingMode">Pricing</Label>
//                         <Select
//                           value={tax.pricingMode}
//                           onValueChange={(value) =>
//                             updateTaxField("pricingMode", String(value))
//                           }
//                           disabled={taxSaving}
//                         >
//                           <SelectTrigger id="pricingMode" className="w-full">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="inclusive">
//                               Tax-inclusive pricing
//                             </SelectItem>
//                             <SelectItem value="exclusive">
//                               Tax-exclusive pricing
//                             </SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="taxSummary">Tax Summary Preference</Label>
//                         <Select
//                           value={tax.taxSummary}
//                           onValueChange={(value) =>
//                             updateTaxField("taxSummary", String(value))
//                           }
//                           disabled={taxSaving}
//                         >
//                           <SelectTrigger id="taxSummary" className="w-full">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="itemized">
//                               Itemized on each invoice
//                             </SelectItem>
//                             <SelectItem value="compact">
//                               Compact totals only
//                             </SelectItem>
//                             <SelectItem value="hidden">Hidden</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>

//                     <Separator />

//                     <div>
//                       <Label>Applicable Taxes</Label>
//                       <p className="text-sm text-muted-foreground">
//                         Enable or disable the taxes that apply to your business
//                       </p>
//                       <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
//                         {TAX_OPTIONS.map((taxName) => (
//                           <div
//                             key={taxName}
//                             className="flex items-center gap-2"
//                           >
//                             <Switch
//                               id={`tax-${taxName}`}
//                               checked={tax.enabledTaxes.includes(taxName)}
//                               onCheckedChange={(checked) =>
//                                 toggleTax(taxName, checked)
//                               }
//                               disabled={taxSaving}
//                             />
//                             <Label
//                               htmlFor={`tax-${taxName}`}
//                               className="cursor-pointer"
//                             >
//                               {taxName === "SERVICE_TAX"
//                                 ? "Service Tax"
//                                 : taxName}
//                             </Label>
//                           </div>
//                         ))}
//                       </div>
//                     </div>

//                     <div className="flex justify-end pt-4 border-t border-border">
//                       <Button type="submit" disabled={taxSaving}>
//                         {taxSaving ? (
//                           <>
//                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                             Saving...
//                           </>
//                         ) : taxSaved ? (
//                           <>
//                             <Check className="mr-2 h-4 w-4" />
//                             Saved
//                           </>
//                         ) : (
//                           "Save Changes"
//                         )}
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </form>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle>Accounting Preferences</CardTitle>
//                   <CardDescription>
//                     Defaults for currency, financial periods, and documents
//                   </CardDescription>
//                 </CardHeader>
//                 <form onSubmit={handleAccountingSave} noValidate>
//                   <CardContent className="space-y-4">
//                     {accountingMessage && (
//                       <div
//                         role={accountingMessage.type === "error" ? "alert" : "status"}
//                         className={
//                           accountingMessage.type === "error"
//                             ? "rounded-lg border border-orange-500/50 bg-orange-500/10 p-3 text-sm text-orange-700"
//                             : "rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700"
//                         }
//                       >
//                         {accountingMessage.text}
//                       </div>
//                     )}

//                     <div className="grid gap-4 sm:grid-cols-2">
//                       <div className="space-y-2">
//                         <Label htmlFor="baseCurrency">Base Currency</Label>
//                         <Select
//                           value={accounting.baseCurrency}
//                           onValueChange={(value) =>
//                             updateAccountingField("baseCurrency", String(value))
//                           }
//                           disabled={accountingSaving}
//                         >
//                           <SelectTrigger id="baseCurrency" className="w-full">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {CURRENCY_OPTIONS.map((currency) => (
//                               <SelectItem
//                                 key={currency.value}
//                                 value={currency.value}
//                               >
//                                 {currency.label}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         {accountingErrors.baseCurrency && (
//                           <p className="text-xs text-red-600">
//                             {accountingErrors.baseCurrency}
//                           </p>
//                         )}
//                       </div>

//                       <div className="space-y-2">
//                         <Label htmlFor="fyStartDate">
//                           Financial Year Start Date
//                         </Label>
//                         <Select
//                           value={accounting.fyStartDate}
//                           onValueChange={(value) =>
//                             updateAccountingField("fyStartDate", String(value))
//                           }
//                           disabled={accountingSaving}
//                         >
//                           <SelectTrigger id="fyStartDate" className="w-full">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {FY_START_OPTIONS.map((option) => (
//                               <SelectItem
//                                 key={option.value}
//                                 value={option.value}
//                               >
//                                 {option.label}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         {accountingErrors.fyStartDate && (
//                           <p className="text-xs text-red-600">
//                             {accountingErrors.fyStartDate}
//                           </p>
//                         )}
//                       </div>

//                       <div className="space-y-2">
//                         <Label htmlFor="dateFormat">Date Format</Label>
//                         <Select
//                           value={accounting.dateFormat}
//                           onValueChange={(value) =>
//                             updateAccountingField("dateFormat", String(value))
//                           }
//                           disabled={accountingSaving}
//                         >
//                           <SelectTrigger id="dateFormat" className="w-full">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {DATE_FORMAT_OPTIONS.map((format) => (
//                               <SelectItem key={format} value={format}>
//                                 {format}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>

//                       <div className="space-y-2">
//                         <Label htmlFor="paymentTerms">
//                           Default Payment Terms
//                         </Label>
//                         <Select
//                           value={accounting.paymentTerms}
//                           onValueChange={(value) =>
//                             updateAccountingField("paymentTerms", String(value))
//                           }
//                           disabled={accountingSaving}
//                         >
//                           <SelectTrigger id="paymentTerms" className="w-full">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {PAYMENT_TERMS_OPTIONS.map((option) => (
//                               <SelectItem
//                                 key={option.value}
//                                 value={option.value}
//                               >
//                                 {option.label}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>

//                       <div className="space-y-2 sm:col-span-2">
//                         <Label htmlFor="invoiceFormat">
//                           Invoice Numbering Format{" "}
//                           <span className="text-red-600">*</span>
//                         </Label>
//                         <Input
//                           id="invoiceFormat"
//                           value={accounting.invoiceFormat}
//                           placeholder="INV-{YYYY}-{SEQ}"
//                           onChange={(e) =>
//                             updateAccountingField("invoiceFormat", e.target.value)
//                           }
//                           aria-required
//                           aria-invalid={!!accountingErrors.invoiceFormat}
//                           disabled={accountingSaving}
//                         />
//                         {accountingErrors.invoiceFormat ? (
//                           <p className="text-xs text-red-600">
//                             {accountingErrors.invoiceFormat}
//                           </p>
//                         ) : (
//                           <p className="text-xs text-muted-foreground">
//                             Tokens: {"{YYYY}"}, {"{MM}"}, {"{SEQ}"} — e.g., INV-
//                             {"{YYYY}"}
//                             -{"{SEQ}"} produces INV-2026-0001
//                           </p>
//                         )}
//                       </div>

//                       <div className="space-y-2">
//                         <Label htmlFor="defaultSalesAccount">
//                           Default Sales Account
//                         </Label>
//                         <Select
//                           value={accounting.defaultSalesAccount}
//                           onValueChange={(value) =>
//                             updateAccountingField(
//                               "defaultSalesAccount",
//                               String(value)
//                             )
//                           }
//                           disabled={accountingSaving}
//                         >
//                           <SelectTrigger id="defaultSalesAccount" className="w-full">
//                             <SelectValue placeholder="None" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="">None</SelectItem>
//                             {(accountsList.filter((a) => a.type === "revenue")
//                               .length
//                               ? accountsList.filter((a) => a.type === "revenue")
//                               : accountsList
//                             ).map((account) => (
//                               <SelectItem key={account.id} value={account.id}>
//                                 {account.code} — {account.name}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>

//                       <div className="space-y-2">
//                         <Label htmlFor="defaultExpenseAccount">
//                           Default Expense Account
//                         </Label>
//                         <Select
//                           value={accounting.defaultExpenseAccount}
//                           onValueChange={(value) =>
//                             updateAccountingField(
//                               "defaultExpenseAccount",
//                               String(value)
//                             )
//                           }
//                           disabled={accountingSaving}
//                         >
//                           <SelectTrigger
//                             id="defaultExpenseAccount"
//                             className="w-full"
//                           >
//                             <SelectValue placeholder="None" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="">None</SelectItem>
//                             {(accountsList.filter((a) => a.type === "expense")
//                               .length
//                               ? accountsList.filter((a) => a.type === "expense")
//                               : accountsList
//                             ).map((account) => (
//                               <SelectItem key={account.id} value={account.id}>
//                                 {account.code} — {account.name}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>

//                     <div className="flex justify-end pt-4 border-t border-border">
//                       <Button type="submit" disabled={accountingSaving}>
//                         {accountingSaving ? (
//                           <>
//                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                             Saving...
//                           </>
//                         ) : accountingSaved ? (
//                           <>
//                             <Check className="mr-2 h-4 w-4" />
//                             Saved
//                           </>
//                         ) : (
//                           "Save Changes"
//                         )}
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </form>
//               </Card>
//             </TabsContent>

//             <TabsContent value="advanced" className="mt-6 space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Data Management</CardTitle>
//                   <CardDescription>Export, import, and manage your accounting data</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <input
//                     ref={importFileRef}
//                     type="file"
//                     accept="application/json,.json"
//                     onChange={handleImportData}
//                     className="sr-only"
//                     disabled={importing}
//                   />
//                   {dataMessage && (
//                     <div
//                       role={dataMessage.type === "error" ? "alert" : "status"}
//                       className={
//                         dataMessage.type === "error"
//                           ? "rounded-lg border border-orange-500/50 bg-orange-500/10 p-3 text-sm text-orange-700"
//                           : "rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700"
//                       }
//                     >
//                       {dataMessage.text}
//                     </div>
//                   )}
//                   <div className="flex items-center justify-between p-4 rounded-lg border border-border">
//                     <div className="flex items-center gap-3">
//                       <Download className="h-5 w-5 text-primary" />
//                       <div>
//                         <p className="font-medium text-foreground">Export All Data</p>
//                         <p className="text-sm text-muted-foreground">Download complete backup as JSON/CSV</p>
//                       </div>
//                     </div>
//                     <Button
//                       variant="outline"
//                       onClick={handleExportData}
//                       disabled={exporting || importing || deletingData}
//                     >
//                       {exporting ? (
//                         <>
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                           Exporting...
//                         </>
//                       ) : (
//                         "Export"
//                       )}
//                     </Button>
//                   </div>
//                   <Separator />
//                   <div className="flex items-center justify-between p-4 rounded-lg border border-border">
//                     <div className="flex items-center gap-3">
//                       <Database className="h-5 w-5 text-primary" />
//                       <div>
//                         <p className="font-medium text-foreground">Import Data</p>
//                         <p className="text-sm text-muted-foreground">Import transactions, contacts, or chart of accounts</p>
//                       </div>
//                     </div>
//                     <Button
//                       variant="outline"
//                       onClick={() => importFileRef.current?.click()}
//                       disabled={exporting || importing || deletingData}
//                     >
//                       {importing ? (
//                         <>
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                           Importing...
//                         </>
//                       ) : (
//                         "Import"
//                       )}
//                     </Button>
//                   </div>
//                   <Separator />
//                   <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
//                     <div className="flex items-center gap-3">
//                       <Database className="h-5 w-5 text-destructive" />
//                       <div>
//                         <p className="font-medium text-foreground">Delete All Data</p>
//                         <p className="text-sm text-muted-foreground">Permanently remove all accounting records</p>
//                       </div>
//                     </div>
//                     <Button
//                       variant="destructive"
//                       onClick={handleDeleteAllData}
//                       disabled={exporting || importing || deletingData}
//                     >
//                       {deletingData ? (
//                         <>
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                           Deleting...
//                         </>
//                       ) : (
//                         "Delete All Data"
//                       )}
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             </TabsContent>
//             {isAdmin && (<TabsContent value="users"> <UserManagementPanel /></TabsContent>)}
//           </Tabs>
//         </div>
//       </main>
//     </div>
//   );
// }





"use client";

import {
  User,
  Users,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Database,
  Mail,
  Trash2,
  DollarSign,
  Building2,
  Save,
  Loader2,
  Check,
  Sun,
  Moon,
  Monitor,
  Download,
  Settings,
  Image as ImageIcon,
  X,
  LogOut,
} from "lucide-react";
import UserManagementPanel from "@/components/settings/UserManagementPanel";
import { usePermissions } from "@/lib/use-permissions";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useRequireAuth, useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { cn } from "cn";
import { useTheme } from "@/components/theme-provider";
import { storage } from "@/lib/firebase-services";
import { listAll, ref as storageRef, deleteObject } from "firebase/storage";
import {
  updatePassword,
  reauthenticateWithCredential,
  sendEmailVerification,
  EmailAuthProvider,
  AuthError,
} from "firebase/auth";

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR ₹ — Indian Rupee" },
  { value: "USD", label: "USD $ — US Dollar" },
  { value: "EUR", label: "EUR € — Euro" },
  { value: "GBP", label: "GBP £ — Pound Sterling" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "AUD", label: "AUD A$ — Australian Dollar" },
  { value: "CAD", label: "CAD C$ — Canadian Dollar" },
  { value: "SGD", label: "SGD S$ — Singapore Dollar" },
  { value: "JPY", label: "JPY ¥ — Japanese Yen" },
  { value: "CNY", label: "CNY ¥ — Chinese Yuan" },
  { value: "CHF", label: "CHF — Swiss Franc" },
];

const FY_START_OPTIONS = [
  { value: "01-01", label: "January 1" },
  { value: "02-01", label: "February 1" },
  { value: "03-01", label: "March 1" },
  { value: "04-01", label: "April 1" },
  { value: "05-01", label: "May 1" },
  { value: "06-01", label: "June 1" },
  { value: "07-01", label: "July 1" },
  { value: "08-01", label: "August 1" },
  { value: "09-01", label: "September 1" },
  { value: "10-01", label: "October 1" },
  { value: "11-01", label: "November 1" },
  { value: "12-01", label: "December 1" },
];

const DATE_FORMAT_OPTIONS = [
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
  "DD-MM-YYYY",
];

const PAYMENT_TERMS_OPTIONS = [
  { value: "due_receipt", label: "Due on receipt" },
  { value: "net_7", label: "Net 7 days" },
  { value: "net_15", label: "Net 15 days" },
  { value: "net_30", label: "Net 30 days" },
  { value: "net_45", label: "Net 45 days" },
  { value: "net_60", label: "Net 60 days" },
];

/* ------------------------------------------------------------------ */
/* Presentational helpers (design only — no logic)                     */
/* ------------------------------------------------------------------ */

// Works with both Radix (data-[state=active]) and Base UI (data-[active]) tabs.
const NAV_TRIGGER =
  "h-10 flex-none shrink-0 justify-start gap-2.5 rounded-xl border-transparent px-3.5 text-sm font-medium whitespace-nowrap text-muted-foreground shadow-none transition-colors hover:text-foreground lg:w-full " +
  "data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none " +
  "data-[active]:bg-foreground data-[active]:text-background data-[active]:shadow-none " +
  "dark:data-[state=active]:bg-foreground dark:data-[state=active]:text-background dark:data-[state=active]:border-transparent " +
  "dark:data-[active]:bg-foreground dark:data-[active]:text-background dark:data-[active]:border-transparent";

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-sm",
        className
      )}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b px-5 py-4 sm:px-6 sm:py-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="font-semibold leading-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

function SectionBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-5 p-5 sm:p-6", className)}>{children}</div>;
}

function SettingRow({
  icon,
  title,
  description,
  extra,
  tone = "default",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  extra?: React.ReactNode;
  tone?: "default" | "danger";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        tone === "danger"
          ? "border-destructive/30 bg-destructive/5"
          : "border-border"
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            tone === "danger"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-foreground"
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          {extra}
        </div>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function Notice({
  type,
  children,
}: {
  type: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={
        type === "error"
          ? "rounded-xl border border-orange-500/50 bg-orange-500/10 p-3 text-sm text-orange-700"
          : "rounded-xl border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700"
      }
    >
      {children}
    </div>
  );
}

function ThemePreview({ option }: { option: "light" | "dark" | "system" }) {
  const light = (
    <div className="h-full bg-white p-2.5">
      <div className="h-2 w-1/2 rounded bg-neutral-900" />
      <div className="mt-1.5 h-1.5 w-3/4 rounded bg-neutral-300" />
      <div className="mt-1.5 h-1.5 w-2/3 rounded bg-neutral-200" />
    </div>
  );
  const dark = (
    <div className="h-full bg-neutral-950 p-2.5">
      <div className="h-2 w-1/2 rounded bg-white" />
      <div className="mt-1.5 h-1.5 w-3/4 rounded bg-neutral-600" />
      <div className="mt-1.5 h-1.5 w-2/3 rounded bg-neutral-700" />
    </div>
  );

  return (
    <div className="mb-3 h-16 overflow-hidden rounded-lg border">
      {option === "light" && light}
      {option === "dark" && dark}
      {option === "system" && (
        <div className="grid h-full grid-cols-2">
          {light}
          {dark}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user, signOut, error: authError, clearError } = useAuth();
  useRequireAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const {
  isAdmin,
  can,
  loading: permissionsLoading,
} = usePermissions();
const canViewProfile = isAdmin || can("settings.profile.view");
const canViewNotifications = isAdmin || can("settings.notifications.view");
const canEditNotifications = isAdmin || can("settings.notifications.edit");
const canViewAppearance = isAdmin || can("settings.appearance.view");
const canViewSecurity = isAdmin || can("settings.security.view");
const canViewCompany = isAdmin || can("settings.company.view");
const canViewAdvanced = isAdmin || can("settings.advanced.view");

const [profileForm, setProfileForm] = useState({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  bio: "",
});

const [profileLoading, setProfileLoading] = useState(true);

const [notificationPreferences, setNotificationPreferences] = useState({
  inAppEnabled: true,
});
const [notificationPreferencesLoading, setNotificationPreferencesLoading] =
  useState(false);
const [notificationPreferencesSaving, setNotificationPreferencesSaving] =
  useState(false);
const [notificationPreferencesError, setNotificationPreferencesError] =
  useState("");
const [notificationPreferencesSaved, setNotificationPreferencesSaved] =
  useState(false);

const [profileError, setProfileError] = useState("");

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [signingOut, setSigningOut] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [sessionData, setSessionData] = useState<{
    device: string;
    authTime: string;
    issuedAt: string;
    createdAt: string;
    lastSignIn: string;
  } | null>(null);

  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [dataMessage, setDataMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    businessName: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    registrationNumber: "",
  });
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPath, setLogoPath] = useState("");
  const [profileErrors, setProfileErrors] = useState<{ [key: string]: string }>({});
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const [tax, setTax] = useState({
    gstin: "",
    taxRegistrationDetails: "",
    defaultTaxRate: "0",
    pricingMode: "exclusive",
    taxSummary: "itemized",
    enabledTaxes: [] as string[],
  });
  const [taxErrors, setTaxErrors] = useState<{ [key: string]: string }>({});
  const [taxMessage, setTaxMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [taxSaving, setTaxSaving] = useState(false);
  const [taxSaved, setTaxSaved] = useState(false);

  const [accounting, setAccounting] = useState({
    baseCurrency: "INR",
    fyStartDate: "04-01",
    dateFormat: "DD/MM/YYYY",
    paymentTerms: "net_30",
    invoiceFormat: "INV-{YYYY}-{SEQ}",
    defaultSalesAccount: "",
    defaultExpenseAccount: "",
  });
  const [accountingErrors, setAccountingErrors] = useState<{
    [key: string]: string;
  }>({});
  const [accountingMessage, setAccountingMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [accountingSaving, setAccountingSaving] = useState(false);
  const [accountingSaved, setAccountingSaved] = useState(false);
  const [accountsList, setAccountsList] = useState<
    { id: string; code: string; name: string; type: string }[]
  >([]);

  const TAX_OPTIONS = ["CGST", "SGST", "IGST", "VAT", "SERVICE_TAX"];

  useEffect(() => {
    if (!dataMessage) return;
    const timer = setTimeout(() => setDataMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [dataMessage]);

  useEffect(() => {
    if (!profileMessage) return;
    const timer = setTimeout(() => setProfileMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [profileMessage]);

  useEffect(() => {
    if (!taxMessage) return;
    const timer = setTimeout(() => setTaxMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [taxMessage]);

  useEffect(() => {
    if (!accountingMessage) return;
    const timer = setTimeout(() => setAccountingMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [accountingMessage]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/accounting-preferences");
        const data = await response.json();
        if (response.ok && !cancelled) {
          const settings = (data.settings ?? {}) as Record<string, unknown>;
          const str = (value: unknown) =>
            typeof value === "string" ? value : "";

          setAccounting({
            baseCurrency: /^[A-Z]{3}$/.test(str(settings.baseCurrency))
              ? str(settings.baseCurrency)
              : "INR",
            fyStartDate: /^\d{2}-\d{2}$/.test(str(settings.fyStartDate))
              ? str(settings.fyStartDate)
              : "04-01",
            dateFormat: [
              "DD/MM/YYYY",
              "MM/DD/YYYY",
              "YYYY-MM-DD",
              "DD-MM-YYYY",
            ].includes(str(settings.dateFormat))
              ? str(settings.dateFormat)
              : "DD/MM/YYYY",
            paymentTerms: [
              "due_receipt",
              "net_7",
              "net_15",
              "net_30",
              "net_45",
              "net_60",
            ].includes(str(settings.paymentTerms))
              ? str(settings.paymentTerms)
              : "net_30",
            invoiceFormat: str(settings.invoiceFormat) || "INV-{YYYY}-{SEQ}",
            defaultSalesAccount: str(settings.defaultSalesAccount),
            defaultExpenseAccount: str(settings.defaultExpenseAccount),
          });
        }
      } catch {
        // keep defaults if preferences cannot be loaded
      }

      try {
        const response = await fetch("/api/accounts");
        const data = await response.json();
        if (response.ok && !cancelled && Array.isArray(data.accounts)) {
          setAccountsList(
            data.accounts.map(
              (account: {
                id?: unknown;
                code?: unknown;
                name?: unknown;
                type?: unknown;
              }) => ({
                id: String(account.id ?? ""),
                code: String(account.code ?? ""),
                name: String(account.name ?? ""),
                type: String(account.type ?? ""),
              })
            )
          );
        }
      } catch {
        // dropdown stays empty if accounts cannot be loaded
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/tax-settings");
        const data = await response.json();
        if (!response.ok || cancelled) return;

        const settings = (data.settings ?? {}) as Record<string, unknown>;
        const str = (value: unknown) => (typeof value === "string" ? value : "");

        setTax({
          gstin: str(settings.gstin),
          taxRegistrationDetails: str(settings.taxRegistrationDetails),
          defaultTaxRate:
            typeof settings.defaultTaxRate === "number"
              ? String(settings.defaultTaxRate)
              : "0",
          pricingMode:
            settings.pricingMode === "inclusive" ? "inclusive" : "exclusive",
          taxSummary: ["itemized", "compact", "hidden"].includes(
            String(settings.taxSummary)
          )
            ? String(settings.taxSummary)
            : "itemized",
          enabledTaxes: Array.isArray(settings.enabledTaxes)
            ? settings.enabledTaxes
                .filter((value) =>
                  ["CGST", "SGST", "IGST", "VAT", "SERVICE_TAX"].includes(String(value))
                )
                .map(String)
            : [],
        });
      } catch {
        // keep defaults if tax settings cannot be loaded
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();
        if (!response.ok || cancelled) return;

        const settings = (data.settings ?? {}) as Record<string, unknown>;
        const str = (value: unknown) => (typeof value === "string" ? value : "");

        setProfile({
          businessName: str(settings.businessName),
          email: str(settings.email),
          phone: str(settings.phone),
          address: str(settings.address),
          website: str(settings.website),
          registrationNumber: str(settings.registrationNumber),
        });
        setLogoUrl(
  str(settings.logoDataUrl) || str(settings.logoUrl)
);
setLogoPath(str(settings.logoPath));
      } catch {
        // keep empty defaults if settings cannot be loaded
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasPasswordProvider =
    user?.providerData.some((provider) => provider.providerId === "password") ?? false;

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    window.dispatchEvent(new Event("profile-updated"));
    setTimeout(() => setSaved(false), 3000);
  };

  const closePasswordDialog = () => {
    setPasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess("");
  };


const handleChangePassword = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();
  setPasswordError("");
  setPasswordSuccess("");

  if (!currentPassword) {
    setPasswordError("Current password is required.");
    return;
  }

  if (!newPassword) {
    setPasswordError("New password is required.");
    return;
  }

  if (newPassword.length < 6) {
    setPasswordError("Password must be at least 6 characters.");
    return;
  }

  if (newPassword.length > 128) {
    setPasswordError("Password cannot exceed 128 characters.");
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordError("Passwords do not match.");
    return;
  }

  if (newPassword === currentPassword) {
    setPasswordError(
      "New password must be different from the current password."
    );
    return;
  }

  if (!user?.email) {
    setPasswordError("Unable to determine account email.");
    return;
  }

  if (
    !user.providerData.some(
      (provider) => provider.providerId === "password"
    )
  ) {
    setPasswordError(
      "Your account has no email-and-password sign-in method."
    );
    return;
  }

  setChangingPassword(true);

  try {
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);

    setPasswordSuccess("Password changed successfully.");

    setTimeout(() => closePasswordDialog(), 1500);
  } catch (error) {
    const code = (error as AuthError)?.code;

    switch (code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
      case "auth/invalid-login-credentials":
        setPasswordError("Current password is incorrect.");
        break;

      case "auth/too-many-requests":
        setPasswordError("Too many attempts. Please try again later.");
        break;

      case "auth/weak-password":
        setPasswordError("This password is too weak.");
        break;

      case "auth/network-request-failed":
        setPasswordError(
          "Network error. Please check your connection and try again."
        );
        break;

      case "auth/requires-recent-login":
        setPasswordError(
          "Your session has expired. Please sign in again and retry."
        );
        break;

      default:
        setPasswordError("Failed to change password. Please try again.");
    }
  } finally {
    setChangingPassword(false);
  }
};


  const closeDeleteDialog = () => {
    setDeleteOpen(false);
    setDeletePassword("");
    setDeleteConfirmText("");
    setDeleteError("");
  };

  const handleDeleteAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteError("");

    if (!user) return;

    if (deleteConfirmText !== "DELETE") {
      setDeleteError('Type "DELETE" to confirm');
      return;
    }

    const email = user.email;
    if (hasPasswordProvider && !deletePassword) {
      setDeleteError("Current password is required");
      return;
    }
    if (hasPasswordProvider && !email) {
      setDeleteError("Unable to determine account email");
      return;
    }

    setDeletingAccount(true);
    try {
      if (hasPasswordProvider && email && deletePassword) {
        const credential = EmailAuthProvider.credential(email, deletePassword);
        await reauthenticateWithCredential(user, credential);
      }

      await user.delete();

      // Best-effort cleanup of the user's avatar files
      try {
        const folderRef = storageRef(storage, `avatars/${user.uid}`);
        const listed = await listAll(folderRef);
        await Promise.all(listed.items.map((item) => deleteObject(item)));
      } catch {
        // ignore cleanup failures
      }

      await fetch("/api/auth/session", { method: "DELETE" });
      document.cookie = "__session=; path=/; max-age=0; SameSite=Lax";
      router.replace("/login");
    } catch (error) {
      const code = (error as AuthError)?.code;
      switch (code) {
        case "auth/wrong-password":
        case "auth/invalid-credential":
        case "auth/invalid-login-credentials":
          setDeleteError("Current password is incorrect");
          break;
        case "auth/too-many-requests":
          setDeleteError("Too many attempts. Please try again later");
          break;
        case "auth/network-request-failed":
          setDeleteError("Network error. Please check your connection and try again");
          break;
        case "auth/requires-recent-login":
          setDeleteError("Session expired. Please sign out, sign in again, and retry");
          break;
        default:
          setDeleteError("Failed to delete account. Please try again");
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    setDataMessage(null);
    try {
      const response = await fetch("/api/data");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Export failed");
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ledgerflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setDataMessage({
        type: "success",
        text: `Backup downloaded (${data.accounts?.length ?? 0} accounts, ${data.contacts?.length ?? 0} contacts, ${data.invoices?.length ?? 0} invoices, ${data.transactions?.length ?? 0} transactions).`,
      });
    } catch (error) {
      setDataMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Export failed",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    setDataMessage(null);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Selected file is not valid JSON");
      }
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Backup file must be a JSON object exported from this app");
      }

      const payload = parsed as Record<string, unknown>;
      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accounts: payload.accounts,
          contacts: payload.contacts,
          invoices: payload.invoices,
          transactions: payload.transactions,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      const counts = data.imported ?? {};
      const skippedNote =
        data.skipped > 0 ? `, skipped ${data.skipped} invalid entries` : "";
      setDataMessage({
        type: "success",
        text: `Imported ${counts.accounts ?? 0} accounts, ${counts.contacts ?? 0} contacts, ${counts.invoices ?? 0} invoices, and ${counts.transactions ?? 0} transactions${skippedNote}.`,
      });
    } catch (error) {
      setDataMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Import failed",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    const confirmed = window.confirm(
      "Permanently delete ALL accounting records (accounts, contacts, invoices, and transactions)? This cannot be undone."
    );
    if (!confirmed) return;

    setDeletingData(true);
    setDataMessage(null);
    try {
      const response = await fetch("/api/data", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }
      setDataMessage({
        type: "success",
        text: `Deleted ${data.deleted ?? 0} records.`,
      });
    } catch (error) {
      setDataMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Delete failed",
      });
    } finally {
      setDeletingData(false);
    }
  };

  const updateProfileField = (field: keyof typeof profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setProfileErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

 
const handleLogoChange = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  event.target.value = "";

  if (!file) return;

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    setProfileMessage({
      type: "error",
      text: "Please select a PNG, JPG, or WebP image.",
    });
    return;
  }

  // Base64 increases the file size by approximately 33%.
  // Keep the image small enough for a Firestore document.
  if (file.size > 500 * 1024) {
    setProfileMessage({
      type: "error",
      text: "Logo must be 500 KB or smaller.",
    });
    return;
  }

  setLogoUploading(true);
  setProfileMessage(null);

  try {
    const logoDataUrl: string = await new Promise(
      (resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          if (typeof reader.result !== "string") {
            reject(new Error("Unable to read the selected image."));
            return;
          }

          resolve(reader.result);
        };

        reader.onerror = () => {
          reject(new Error("Failed to read the selected image."));
        };

        reader.readAsDataURL(file);
      }
    );

    setLogoUrl(logoDataUrl);

    // Clear the old Storage reference if this state is still used.
    setLogoPath("");

    setProfileMessage({
      type: "success",
      text: "Logo selected. Click Save Changes to save it.",
    });
  } catch (error) {
    setProfileMessage({
      type: "error",
      text:
        error instanceof Error
          ? error.message
          : "Unable to process the logo.",
    });
  } finally {
    setLogoUploading(false);
  }
};


  const validateProfile = () => {
    const errors: { [key: string]: string } = {};

    if (!profile.businessName.trim()) {
      errors.businessName = "Business name is required";
    } else if (profile.businessName.trim().length > 150) {
      errors.businessName = "Business name must be 150 characters or fewer";
    }

    const email = profile.email.trim();
    if (!email) {
      errors.email = "Business email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address";
    }

    if (profile.phone.trim().length > 30) {
      errors.phone = "Phone number must be 30 characters or fewer";
    }

    if (profile.address.trim().length > 300) {
      errors.address = "Address must be 300 characters or fewer";
    }

    const website = profile.website.trim();
    if (website && !/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(website)) {
      errors.website = "Enter a valid website (e.g., https://example.com)";
    }

    if (profile.registrationNumber.trim().length > 100) {
      errors.registrationNumber = "Registration number must be 100 characters or fewer";
    }

    return errors;
  };

  
const handleProfileSave = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();
  setProfileMessage(null);

  const errors = validateProfile();
  setProfileErrors(errors);

  if (Object.keys(errors).length > 0) {
    setProfileMessage({
      type: "error",
      text: "Please fix the highlighted fields.",
    });
    return;
  }

  const website = profile.website.trim();

  const normalizedWebsite =
    website && !/^https?:\/\//i.test(website)
      ? `https://${website}`
      : website;

  const payload = {
    ...profile,
    businessName: profile.businessName.trim(),
    email: profile.email.trim(),
    phone: profile.phone.trim(),
    address: profile.address.trim(),
    website: normalizedWebsite,
    registrationNumber: profile.registrationNumber.trim(),
    logoDataUrl: logoUrl,
  };

  setProfileSaving(true);
  setProfileSaved(false);

  try {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to save business settings.");
    }

    setProfile((prev) => ({
      ...prev,
      website: normalizedWebsite,
    }));

    setProfileMessage({
      type: "success",
      text: "Business profile saved successfully.",
    });

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  } catch (error) {
    setProfileMessage({
      type: "error",
      text:
        error instanceof Error
          ? error.message
          : "Failed to save business settings.",
    });
  } finally {
    setProfileSaving(false);
  }
};


  const updateTaxField = (
    field: keyof typeof tax,
    value: string | string[]
  ) => {
    setTax((prev) => ({ ...prev, [field]: value }));
    setTaxErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleTax = (taxName: string, checked: boolean) => {
    setTax((prev) => ({
      ...prev,
      enabledTaxes: checked
        ? [...prev.enabledTaxes, taxName]
        : prev.enabledTaxes.filter((value) => value !== taxName),
    }));
  };

  const validateTax = () => {
    const errors: { [key: string]: string } = {};

    if (tax.gstin && tax.gstin.length > 30) {
      errors.gstin = "Tax ID must be 30 characters or fewer";
    } else if (tax.gstin && !/^[0-9A-Za-z]+$/.test(tax.gstin)) {
      errors.gstin = "Only letters and numbers are allowed";
    }

    if (tax.taxRegistrationDetails.length > 300) {
      errors.taxRegistrationDetails = "Must be 300 characters or fewer";
    }

    const rate = Number(tax.defaultTaxRate);
    if (
      tax.defaultTaxRate.trim() === "" ||
      !Number.isFinite(rate) ||
      rate < 0 ||
      rate > 100
    ) {
      errors.defaultTaxRate = "Enter a rate between 0 and 100";
    }

    return errors;
  };

  const handleTaxSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTaxMessage(null);

    const errors = validateTax();
    setTaxErrors(errors);
    if (Object.keys(errors).length > 0) {
      setTaxMessage({
        type: "error",
        text: "Please fix the highlighted fields.",
      });
      return;
    }

    const payload = {
      gstin: tax.gstin.trim(),
      taxRegistrationDetails: tax.taxRegistrationDetails.trim(),
      defaultTaxRate: Number(tax.defaultTaxRate),
      pricingMode: tax.pricingMode,
      taxSummary: tax.taxSummary,
      enabledTaxes: tax.enabledTaxes,
    };

    setTaxSaving(true);
    setTaxSaved(false);
    try {
      const response = await fetch("/api/tax-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Save failed");
      }

      setTaxMessage({ type: "success", text: "Tax settings saved." });
      setTaxSaved(true);
      setTimeout(() => setTaxSaved(false), 3000);
    } catch (error) {
      setTaxMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Save failed",
      });
    } finally {
      setTaxSaving(false);
    }
  };

  const updateAccountingField = (
    field: keyof typeof accounting,
    value: string
  ) => {
    setAccounting((prev) => ({ ...prev, [field]: value }));
    setAccountingErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };


const validateAccounting = () => {
  const errors: { [key: string]: string } = {};

  if (!/^[A-Z]{3}$/.test(accounting.baseCurrency)) {
    errors.baseCurrency = "Select a valid currency";
  }

  if (!/^\d{2}-\d{2}$/.test(accounting.fyStartDate)) {
    errors.fyStartDate = "Select a valid financial year start";
  }

  const format = accounting.invoiceFormat.trim();

  if (!format) {
    errors.invoiceFormat = "Invoice numbering format is required";
  } else if (format.length > 50) {
    errors.invoiceFormat = "Must be 50 characters or fewer";
  } else if (!/^[A-Za-z0-9_-]+(?:\{(?:YYYY|MM|SEQ)\}[A-Za-z0-9_-]*)*$/.test(format)) {
    errors.invoiceFormat =
      "Use only letters, numbers, hyphens, underscores, and supported tokens: {YYYY}, {MM}, {SEQ}";
  } else if (!format.includes("{SEQ}")) {
    errors.invoiceFormat = "Must include the {SEQ} token";
  }

  return errors;
};


  const handleAccountingSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountingMessage(null);

    const errors = validateAccounting();
    setAccountingErrors(errors);
    if (Object.keys(errors).length > 0) {
      setAccountingMessage({
        type: "error",
        text: "Please fix the highlighted fields.",
      });
      return;
    }

    const payload = {
      baseCurrency: accounting.baseCurrency,
      fyStartDate: accounting.fyStartDate,
      dateFormat: accounting.dateFormat,
      paymentTerms: accounting.paymentTerms,
      invoiceFormat: accounting.invoiceFormat.trim(),
      defaultSalesAccount: accounting.defaultSalesAccount,
      defaultExpenseAccount: accounting.defaultExpenseAccount,
    };

    setAccountingSaving(true);
    setAccountingSaved(false);
    try {
      const response = await fetch("/api/accounting-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Save failed");
      }

      setAccountingMessage({
        type: "success",
        text: "Accounting preferences saved.",
      });
      setAccountingSaved(true);
      setTimeout(() => setAccountingSaved(false), 3000);
    } catch (error) {
      setAccountingMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Save failed",
      });
    } finally {
      setAccountingSaving(false);
    }
  };

  const handleSignOut = async () => {
    clearError();
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const describeDevice = () => {
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua)
      ? "Edge"
      : /OPR\/|Opera/.test(ua)
        ? "Opera"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Firefox\//.test(ua)
            ? "Firefox"
            : /Safari\//.test(ua)
              ? "Safari"
              : "Browser";
    const os = /Windows/.test(ua)
      ? "Windows"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Android/.test(ua)
          ? "Android"
          : /iPhone|iPad/.test(ua)
            ? "iOS"
            : /Linux/.test(ua)
              ? "Linux"
              : "Unknown OS";
    return `${browser} on ${os}`;
  };

  const openSessions = async () => {
    setSessionsOpen(true);
    setSessionError("");
    if (!user) return;
    setSessionLoading(true);
    try {
      const result = await user.getIdTokenResult();
      try {
        await user.reload();
      } catch {
        // Reload failure is non-fatal; metadata may be stale
      }
      setSessionData({
        device: describeDevice(),
        authTime: result.authTime
          ? new Date(result.authTime).toLocaleString()
          : "",
        issuedAt: result.issuedAtTime
          ? new Date(result.issuedAtTime).toLocaleString()
          : "",
        createdAt: user.metadata.creationTime ?? "",
        lastSignIn: user.metadata.lastSignInTime ?? "",
      });
    } catch {
      setSessionError("Could not load session details.");
    } finally {
      setSessionLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!user) return;
    setVerificationMessage(null);
    setSendingVerification(true);
    try {
      await sendEmailVerification(user);
      setVerificationMessage({
        type: "success",
        text: `Verification link sent to ${user.email}. Open it, then reload this page.`,
      });
    } catch (error) {
      const code = (error as AuthError).code;
      setVerificationMessage({
        type: "error",
        text:
          code === "auth/too-many-requests"
            ? "Too many attempts. Please try again later."
            : code === "auth/user-disabled"
              ? "This account has been disabled."
              : code === "auth/invalid-credential"
                ? "Please sign out and sign in again, then retry."
                : "Could not send verification email. Try again.",
      });
    } finally {
      setSendingVerification(false);
      setTimeout(() => setVerificationMessage(null), 5000);
    }
  };


  useEffect(() => {
  let cancelled = false;

  async function loadProfile() {
    setProfileLoading(true);
    setProfileError("");

    try {
      const response = await fetch("/api/profile", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load profile.");
      }

      if (!cancelled) {
        setProfileForm({
          firstName: data.profile?.firstName ?? "",
          lastName: data.profile?.lastName ?? "",
          email: data.profile?.email ?? user?.email ?? "",
          phone: data.profile?.phone ?? "",
          bio: data.profile?.bio ?? "",
        });
      }
    } catch (error) {
      if (!cancelled) {
        setProfileError(
          error instanceof Error
            ? error.message
            : "Unable to load profile."
        );
      }
    } finally {
      if (!cancelled) setProfileLoading(false);
    }
  }

  if (user) {
    void loadProfile();
  } else {
    setProfileLoading(false);
  }

  return () => {
    cancelled = true;
  };
}, [user?.uid, user?.email]);


const handleSaveProfile = async () => {
  setSaving(true);
  setSaved(false);
  setProfileError("");

  try {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        bio: profileForm.bio,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to save profile.");
    }

    setProfileForm((current) => ({
      ...current,
      ...data.profile,
      email: user?.email ?? current.email,
    }));

    setSaved(true);
  } catch (error) {
    setProfileError(
      error instanceof Error
        ? error.message
        : "Unable to save profile."
    );
  } finally {
    setSaving(false);
  }
};


useEffect(() => {
  if (!user || !canViewNotifications) return;

  let cancelled = false;

  async function loadNotificationPreferences() {
    setNotificationPreferencesLoading(true);
    setNotificationPreferencesError("");

    try {
      const response = await fetch("/api/notification-preferences", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load notification preferences.");
      }

      const data = await response.json();

      if (!cancelled && data.preferences) {
        setNotificationPreferences({
          inAppEnabled: data.preferences.inAppEnabled === true,
        });
      }
    } catch (error) {
      if (!cancelled) {
        setNotificationPreferencesError(
          error instanceof Error
            ? error.message
            : "Unable to load notification preferences."
        );
      }
    } finally {
      if (!cancelled) setNotificationPreferencesLoading(false);
    }
  }

  void loadNotificationPreferences();

  return () => {
    cancelled = true;
  };
}, [user, canViewNotifications]);

async function updateNotificationPreference(
  key: "emailEnabled" | "inAppEnabled",
  value: boolean
) {
  const previous = notificationPreferences;

  setNotificationPreferences((current) => ({
    ...current,
    [key]: value,
  }));
  setNotificationPreferencesSaving(true);
  setNotificationPreferencesSaved(false);
  setNotificationPreferencesError("");

  try {
    const response = await fetch("/api/notification-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to save notification preferences."
      );
    }

    setNotificationPreferences(data.preferences);
    setNotificationPreferencesSaved(true);
  } catch (error) {
    setNotificationPreferences(previous);
    setNotificationPreferencesError(
      error instanceof Error
        ? error.message
        : "Unable to save notification preferences."
    );
  } finally {
    setNotificationPreferencesSaving(false);
  }
}

  // Display-only values for the profile banner
  const profileInitial = (profileForm.firstName || user?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();
  const profileDisplayName =
    `${profileForm.firstName} ${profileForm.lastName}`.trim() ||
    user?.email ||
    "Your account";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="min-w-0 flex-1">
        <Header />

        <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Page title */}
          <section className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
              <Settings className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Settings
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Manage your account and application preferences
              </p>
            </div>
          </section>

          <Tabs
            defaultValue="profile"
            className="flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:gap-8"
          >
            {/* Navigation: scrolling pills on mobile, sticky side menu on desktop */}
            <TabsList className="h-auto w-full flex-row justify-start gap-1 overflow-x-auto rounded-2xl border bg-card p-1.5 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:sticky lg:top-4 lg:w-64 lg:shrink-0 lg:flex-col lg:items-stretch lg:overflow-visible lg:p-2">
              {canViewProfile && (
                <TabsTrigger value="profile" className={NAV_TRIGGER}>
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
              )}

              {canViewNotifications && (
                <TabsTrigger value="notifications" className={NAV_TRIGGER}>
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
              )}

              {canViewAppearance && (
                <TabsTrigger value="appearance" className={NAV_TRIGGER}>
                  <Palette className="h-4 w-4" />
                  Appearance
                </TabsTrigger>
              )}

              {canViewSecurity && (
                <TabsTrigger value="security" className={NAV_TRIGGER}>
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
              )}

              {canViewCompany && (
                <TabsTrigger value="company" className={NAV_TRIGGER}>
                  <Building2 className="h-4 w-4" />
                  Business Profile
                </TabsTrigger>
              )}

              {canViewAdvanced && (
                <TabsTrigger value="advanced" className={NAV_TRIGGER}>
                  <Database className="h-4 w-4" />
                  Advanced
                </TabsTrigger>
              )}

              {isAdmin && (
                <TabsTrigger value="users" className={NAV_TRIGGER}>
                  <Users className="h-4 w-4" />
                  Users & Permissions
                </TabsTrigger>
              )}
            </TabsList>

            {/* ------------------------------ PROFILE ------------------------------ */}
            {canViewProfile && (
              <TabsContent value="profile" className="mt-0 min-w-0 flex-1 space-y-6">
                {/* Identity banner */}
                <div className="relative overflow-hidden rounded-2xl bg-foreground p-5 text-background shadow-sm sm:p-6">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-background/15"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full border border-background/15"
                  />
                  <div className="relative flex items-center gap-4">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-background text-2xl font-bold text-foreground">
                      {profileInitial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold">
                        {profileDisplayName}
                      </p>
                      <p className="truncate text-sm text-background/70">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <SectionCard>
                  <SectionHeader
                    icon={<User className="h-5 w-5" />}
                    title="Profile Information"
                    description="Manage your personal information"
                  />
                  <SectionBody>
                    {profileLoading ? (
                      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading profile...
                      </div>
                    ) : (
                      <>
                        {profileError && (
                          <Notice type="error">{profileError}</Notice>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={profileForm.firstName}
                              onChange={(e) =>
                                setProfileForm((current) => ({
                                  ...current,
                                  firstName: e.target.value,
                                }))
                              }
                              maxLength={80}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={profileForm.lastName}
                              onChange={(e) =>
                                setProfileForm((current) => ({
                                  ...current,
                                  lastName: e.target.value,
                                }))
                              }
                              maxLength={80}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={profileForm.email}
                              disabled
                              readOnly
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={profileForm.phone}
                              onChange={(e) =>
                                setProfileForm((current) => ({
                                  ...current,
                                  phone: e.target.value,
                                }))
                              }
                              maxLength={30}
                            />
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Input
                              id="bio"
                              value={profileForm.bio}
                              onChange={(e) =>
                                setProfileForm((current) => ({
                                  ...current,
                                  bio: e.target.value,
                                }))
                              }
                              maxLength={500}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end border-t border-border pt-5">
                          <Button
                            className="w-full sm:w-auto"
                            onClick={handleSaveProfile}
                            disabled={saving || profileLoading}
                          >
                            {saving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : saved ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Saved
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </SectionBody>
                </SectionCard>
              </TabsContent>
            )}

            {/* ---------------------------- NOTIFICATIONS ---------------------------- */}
            {canViewNotifications && (
              <TabsContent
                value="notifications"
                className="mt-0 min-w-0 flex-1 space-y-6"
              >
                <SectionCard>
                  <SectionHeader
                    icon={<Bell className="h-5 w-5" />}
                    title="Notification Preferences"
                    description="Choose how and when you receive notifications"
                  />
                  <SectionBody className="space-y-4">
                    {/* <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Receive important updates by email.
                        </p>
                      </div>
                    </div> */}

                    {/* <Switch
                      checked={notificationPreferences.emailEnabled}
                      onCheckedChange={(checked) =>
                        void updateNotificationPreference("emailEnabled", checked)
                      }
                      disabled={
                        !canEditNotifications ||
                        notificationPreferencesLoading ||
                        notificationPreferencesSaving
                      }
                      aria-label="Email Notifications"
                    /> */}

                    <SettingRow
                      icon={<Bell className="h-5 w-5" />}
                      title="In-App Notifications"
                      description="Show notifications in the header bell."
                    >
                      <Switch
                        checked={notificationPreferences.inAppEnabled}
                        onCheckedChange={(checked) =>
                          void updateNotificationPreference("inAppEnabled", checked)
                        }
                        disabled={
                          !canEditNotifications ||
                          notificationPreferencesLoading ||
                          notificationPreferencesSaving
                        }
                        aria-label="In-App Notifications"
                      />
                    </SettingRow>

                    {notificationPreferencesError && (
                      <p role="alert" className="text-sm text-destructive">
                        {notificationPreferencesError}
                      </p>
                    )}

                    {notificationPreferencesSaved && (
                      <p role="status" className="text-sm text-muted-foreground">
                        Notification preferences saved.
                      </p>
                    )}
                  </SectionBody>
                </SectionCard>
              </TabsContent>
            )}

            {/* ------------------------------ APPEARANCE ----------------------------- */}
            <TabsContent value="appearance" className="mt-0 min-w-0 flex-1 space-y-6">
              <SectionCard>
                <SectionHeader
                  icon={<Palette className="h-5 w-5" />}
                  title="Appearance"
                  description="Customize how the application looks"
                />
                <SectionBody className="space-y-6">
                  <div>
                    <Label>Theme</Label>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-4">
                      {(["light", "dark", "system"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setTheme(option)}
                          aria-pressed={theme === option}
                          className={cn(
                            "relative cursor-pointer rounded-xl border-2 p-2.5 text-left transition-all sm:p-3",
                            theme === option
                              ? "border-foreground bg-muted/50"
                              : "border-border hover:border-muted-foreground/50"
                          )}
                        >
                          <ThemePreview option={option} />
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-sm font-medium capitalize text-foreground">
                              {option === "light" && (
                                <Sun className="hidden h-4 w-4 sm:block" />
                              )}
                              {option === "dark" && (
                                <Moon className="hidden h-4 w-4 sm:block" />
                              )}
                              {option === "system" && (
                                <Monitor className="hidden h-4 w-4 sm:block" />
                              )}
                              {option}
                            </span>
                            {theme === option && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Label>Color Scheme</Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Monochrome Executive theme is currently active. Additional
                        color schemes coming soon.
                      </p>
                    </div>
                    <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
                      <Check className="h-3 w-3" />
                      Monochrome
                    </span>
                  </div>
                </SectionBody>
              </SectionCard>
            </TabsContent>

            {/* ------------------------------- SECURITY ------------------------------ */}
            <TabsContent value="security" className="mt-0 min-w-0 flex-1 space-y-6">
              {isAdmin && (
                <div className="relative overflow-hidden rounded-2xl bg-foreground p-5 text-background shadow-sm sm:p-6">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-background/15"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full border border-background/15"
                  />
                  <div className="relative flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background/15">
                      <Shield className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-semibold">Security Overview</h2>
                      <p className="mt-0.5 text-sm text-background/70">
                        Review account protection and security controls for
                        LedgerFlow.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <SectionCard>
                <SectionHeader
                  icon={<Key className="h-5 w-5" />}
                  title="Security"
                  description="Manage your account security settings"
                />
                <SectionBody className="space-y-3">
                  {isAdmin && (
                    <SettingRow
                      icon={<Key className="h-5 w-5" />}
                      title="Change Password"
                      description="Update the password for your account"
                    >
                      <Button
                        className="w-full sm:w-auto"
                        variant="outline"
                        onClick={() => setPasswordOpen(true)}
                      >
                        Change Password
                      </Button>
                    </SettingRow>
                  )}

                  <SettingRow
                    icon={<Check className="h-5 w-5 text-green-600" />}
                    title="Authentication Status"
                    description={`Signed in as ${user?.email ?? "Unknown account"} · ${
                      user?.providerData.some(
                        (provider) => provider.providerId === "google.com"
                      )
                        ? "Google"
                        : user?.providerData.some(
                              (provider) => provider.providerId === "password"
                            )
                          ? "Email & password"
                          : "Other sign-in method"
                    }`}
                  >
                    <span className="inline-flex rounded-full border border-green-500/50 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                      Authenticated
                    </span>
                  </SettingRow>

                  <SettingRow
                    icon={<Shield className="h-5 w-5" />}
                    title="Session Management"
                    description="View active session details for this device"
                  >
                    <Button
                      className="w-full sm:w-auto"
                      variant="outline"
                      onClick={openSessions}
                    >
                      View Sessions
                    </Button>
                  </SettingRow>

                  <SettingRow
                    icon={<LogOut className="h-5 w-5" />}
                    title="Sign Out"
                    description="End your session on this device"
                    extra={
                      authError ? (
                        <p className="mt-1 text-xs text-red-600">{authError}</p>
                      ) : null
                    }
                  >
                    <Button
                      className="w-full sm:w-auto"
                      variant="outline"
                      onClick={handleSignOut}
                      disabled={signingOut}
                    >
                      {signingOut ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing out...
                        </>
                      ) : (
                        "Sign Out"
                      )}
                    </Button>
                  </SettingRow>
                </SectionBody>
              </SectionCard>

              <Dialog
                open={passwordOpen}
                onOpenChange={(open) => {
                  if (!open) closePasswordDialog();
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Confirm your current password, then choose a new one.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
                    {passwordError && (
                      <div
                        role="alert"
                        className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-3 text-sm text-orange-700"
                      >
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div
                        role="status"
                        className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700"
                      >
                        {passwordSuccess}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={changingPassword}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={changingPassword}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={changingPassword}
                      />
                    </div>
                   <p className="text-xs text-muted-foreground">
  Use at least 6 characters. Letters and numbers are both allowed.
</p>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closePasswordDialog}
                        disabled={changingPassword}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={changingPassword}>
                        {changingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog
                open={sessionsOpen}
                onOpenChange={(open) => {
                  if (!open) setSessionsOpen(false);
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Session Management</DialogTitle>
                    <DialogDescription>
                      Details of your active session on this device.
                    </DialogDescription>
                  </DialogHeader>
                  {sessionLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : sessionError ? (
                    <div
                      role="alert"
                      className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-3 text-sm text-orange-700"
                    >
                      {sessionError}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            This device
                          </span>
                          <span className="ml-auto rounded-full border border-green-500/50 bg-green-500/10 px-2 py-0.5 text-xs text-green-700 dark:text-green-400">
                            Active
                          </span>
                        </div>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Device</dt>
                            <dd className="text-right text-foreground">
                              {sessionData?.device ?? "—"}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Account</dt>
                            <dd className="truncate text-right text-foreground">
                              {user?.email ?? "—"}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Signed in</dt>
                            <dd className="text-right text-foreground">
                              {sessionData?.authTime || "—"}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Session token issued
                            </dt>
                            <dd className="text-right text-foreground">
                              {sessionData?.issuedAt || "—"}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Account created
                            </dt>
                            <dd className="text-right text-foreground">
                              {sessionData?.createdAt || "—"}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Signing out ends this session on this device. Other
                        devices stay signed in until their sessions expire.
                      </p>
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setSessionsOpen(false)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSessionsOpen(false);
                        void handleSignOut();
                      }}
                      disabled={signingOut}
                    >
                      {signingOut ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing out...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={deleteOpen}
                onOpenChange={(open) => {
                  if (!open) closeDeleteDialog();
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-600 dark:text-red-400">
                      Delete Account
                    </DialogTitle>
                    <DialogDescription>
                      This permanently deletes your account and its data. This action cannot be
                      undone.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDeleteAccount} className="space-y-4" noValidate>
                    {deleteError && (
                      <div
                        role="alert"
                        className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
                      >
                        {deleteError}
                      </div>
                    )}
                    <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                      All of your account information and files will be permanently removed.
                    </div>
                    {hasPasswordProvider && (
                      <div className="space-y-2">
                        <Label htmlFor="deletePassword">Current Password</Label>
                        <Input
                          id="deletePassword"
                          type="password"
                          autoComplete="current-password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          disabled={deletingAccount}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="deleteConfirm">
                        Type{" "}
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          DELETE
                        </span>{" "}
                        to confirm
                      </Label>
                      <Input
                        id="deleteConfirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                        disabled={deletingAccount}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeDeleteDialog}
                        disabled={deletingAccount}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
                        disabled={deletingAccount}
                      >
                        {deletingAccount ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Account"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* ----------------------------- BUSINESS PROFILE ----------------------------- */}
            <TabsContent value="company" className="mt-0 min-w-0 flex-1 space-y-6">
              {/* Business profile */}
              <SectionCard>
                <SectionHeader
                  icon={<Building2 className="h-5 w-5" />}
                  title="Business Profile"
                  description="Manage your business details used on invoices and reports"
                />
                <form onSubmit={handleProfileSave} noValidate>
                  <SectionBody>
                    {profileMessage && (
                      <Notice type={profileMessage.type}>
                        {profileMessage.text}
                      </Notice>
                    )}

                    {/* Logo */}
                    <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Business logo"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Building2 className="h-7 w-7 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-2">
                        <input
                          ref={logoFileRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleLogoChange}
                          className="sr-only"
                          disabled={logoUploading || profileSaving}
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!logoUploading && !profileSaving) {
                                logoFileRef.current?.click();
                              }
                            }}
                            disabled={logoUploading || profileSaving}
                          >
                            {logoUploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : logoUrl ? (
                              "Change Logo"
                            ) : (
                              "Upload Logo"
                            )}
                          </Button>

                          {logoUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={logoUploading || profileSaving}
                              onClick={() => {
                                setLogoUrl("");
                                setLogoPath("");
                                setProfileMessage({
                                  type: "success",
                                  text: "Logo removed. Click Save Changes to confirm removal.",
                                });
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Logo
                            </Button>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, or WebP, up to 500 KB.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">
                          Business Name{" "}
                          <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          id="businessName"
                          value={profile.businessName}
                          onChange={(e) =>
                            updateProfileField("businessName", e.target.value)
                          }
                          aria-required
                          aria-invalid={!!profileErrors.businessName}
                          disabled={profileSaving}
                        />
                        {profileErrors.businessName && (
                          <p className="text-xs text-red-600">
                            {profileErrors.businessName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessEmail">
                          Business Email{" "}
                          <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          id="businessEmail"
                          type="email"
                          value={profile.email}
                          onChange={(e) =>
                            updateProfileField("email", e.target.value)
                          }
                          aria-required
                          aria-invalid={!!profileErrors.email}
                          disabled={profileSaving}
                        />
                        {profileErrors.email && (
                          <p className="text-xs text-red-600">
                            {profileErrors.email}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessPhone">Phone Number</Label>
                        <Input
                          id="businessPhone"
                          type="tel"
                          value={profile.phone}
                          onChange={(e) =>
                            updateProfileField("phone", e.target.value)
                          }
                          aria-invalid={!!profileErrors.phone}
                          disabled={profileSaving}
                        />
                        {profileErrors.phone && (
                          <p className="text-xs text-red-600">
                            {profileErrors.phone}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessWebsite">Website</Label>
                        <Input
                          id="businessWebsite"
                          value={profile.website}
                          placeholder="https://example.com"
                          onChange={(e) =>
                            updateProfileField("website", e.target.value)
                          }
                          aria-invalid={!!profileErrors.website}
                          disabled={profileSaving}
                        />
                        {profileErrors.website && (
                          <p className="text-xs text-red-600">
                            {profileErrors.website}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="registrationNumber">
                          Business Registration Number
                        </Label>
                        <Input
                          id="registrationNumber"
                          value={profile.registrationNumber}
                          onChange={(e) =>
                            updateProfileField(
                              "registrationNumber",
                              e.target.value
                            )
                          }
                          aria-invalid={!!profileErrors.registrationNumber}
                          disabled={profileSaving}
                        />
                        {profileErrors.registrationNumber && (
                          <p className="text-xs text-red-600">
                            {profileErrors.registrationNumber}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="businessAddress">Business Address</Label>
                        <Input
                          id="businessAddress"
                          value={profile.address}
                          onChange={(e) =>
                            updateProfileField("address", e.target.value)
                          }
                          aria-invalid={!!profileErrors.address}
                          disabled={profileSaving}
                        />
                        {profileErrors.address && (
                          <p className="text-xs text-red-600">
                            {profileErrors.address}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-border pt-5">
                      <Button
                        className="w-full sm:w-auto"
                        type="submit"
                        disabled={profileSaving || logoUploading}
                      >
                        {profileSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : profileSaved ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Saved
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </SectionBody>
                </form>
              </SectionCard>

              {/* Tax settings */}
              <SectionCard>
                <SectionHeader
                  icon={<DollarSign className="h-5 w-5" />}
                  title="Tax Settings"
                  description="Configure taxes applied to your invoices and reports"
                />
                <form onSubmit={handleTaxSave} noValidate>
                  <SectionBody>
                    {taxMessage && (
                      <Notice type={taxMessage.type}>{taxMessage.text}</Notice>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="taxIdNumber">
                          Tax Identification Number (GSTIN, if applicable)
                        </Label>
                        <Input
                          id="taxIdNumber"
                          value={tax.gstin}
                          placeholder="e.g., 27AAACA1234A1Z5"
                          onChange={(e) => updateTaxField("gstin", e.target.value)}
                          aria-invalid={!!taxErrors.gstin}
                          disabled={taxSaving}
                        />
                        {taxErrors.gstin && (
                          <p className="text-xs text-red-600">{taxErrors.gstin}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                        <Input
                          id="defaultTaxRate"
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={tax.defaultTaxRate}
                          onChange={(e) =>
                            updateTaxField("defaultTaxRate", e.target.value)
                          }
                          aria-invalid={!!taxErrors.defaultTaxRate}
                          disabled={taxSaving}
                        />
                        {taxErrors.defaultTaxRate && (
                          <p className="text-xs text-red-600">
                            {taxErrors.defaultTaxRate}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="taxRegistrationDetails">
                          Tax Registration Details
                        </Label>
                        <Input
                          id="taxRegistrationDetails"
                          value={tax.taxRegistrationDetails}
                          placeholder="e.g., Registered in Maharashtra, LUT No. ..."
                          onChange={(e) =>
                            updateTaxField("taxRegistrationDetails", e.target.value)
                          }
                          aria-invalid={!!taxErrors.taxRegistrationDetails}
                          disabled={taxSaving}
                        />
                        {taxErrors.taxRegistrationDetails && (
                          <p className="text-xs text-red-600">
                            {taxErrors.taxRegistrationDetails}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pricingMode">Pricing</Label>
                        <Select
                          value={tax.pricingMode}
                          onValueChange={(value) =>
                            updateTaxField("pricingMode", String(value))
                          }
                          disabled={taxSaving}
                        >
                          <SelectTrigger id="pricingMode" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inclusive">
                              Tax-inclusive pricing
                            </SelectItem>
                            <SelectItem value="exclusive">
                              Tax-exclusive pricing
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxSummary">Tax Summary Preference</Label>
                        <Select
                          value={tax.taxSummary}
                          onValueChange={(value) =>
                            updateTaxField("taxSummary", String(value))
                          }
                          disabled={taxSaving}
                        >
                          <SelectTrigger id="taxSummary" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="itemized">
                              Itemized on each invoice
                            </SelectItem>
                            <SelectItem value="compact">
                              Compact totals only
                            </SelectItem>
                            <SelectItem value="hidden">Hidden</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label>Applicable Taxes</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable the taxes that apply to your business
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {TAX_OPTIONS.map((taxName) => (
                          <div
                            key={taxName}
                            className="flex items-center justify-between gap-3 rounded-xl border p-3"
                          >
                            <Label
                              htmlFor={`tax-${taxName}`}
                              className="cursor-pointer"
                            >
                              {taxName === "SERVICE_TAX"
                                ? "Service Tax"
                                : taxName}
                            </Label>
                            <Switch
                              id={`tax-${taxName}`}
                              checked={tax.enabledTaxes.includes(taxName)}
                              onCheckedChange={(checked) =>
                                toggleTax(taxName, checked)
                              }
                              disabled={taxSaving}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-border pt-5">
                      <Button
                        className="w-full sm:w-auto"
                        type="submit"
                        disabled={taxSaving}
                      >
                        {taxSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : taxSaved ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Saved
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </SectionBody>
                </form>
              </SectionCard>

              {/* Accounting preferences */}
              <SectionCard>
                <SectionHeader
                  icon={<Globe className="h-5 w-5" />}
                  title="Accounting Preferences"
                  description="Defaults for currency, financial periods, and documents"
                />
                <form onSubmit={handleAccountingSave} noValidate>
                  <SectionBody>
                    {accountingMessage && (
                      <Notice type={accountingMessage.type}>
                        {accountingMessage.text}
                      </Notice>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="baseCurrency">Base Currency</Label>
                        <Select
                          value={accounting.baseCurrency}
                          onValueChange={(value) =>
                            updateAccountingField("baseCurrency", String(value))
                          }
                          disabled={accountingSaving}
                        >
                          <SelectTrigger id="baseCurrency" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCY_OPTIONS.map((currency) => (
                              <SelectItem
                                key={currency.value}
                                value={currency.value}
                              >
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {accountingErrors.baseCurrency && (
                          <p className="text-xs text-red-600">
                            {accountingErrors.baseCurrency}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fyStartDate">
                          Financial Year Start Date
                        </Label>
                        <Select
                          value={accounting.fyStartDate}
                          onValueChange={(value) =>
                            updateAccountingField("fyStartDate", String(value))
                          }
                          disabled={accountingSaving}
                        >
                          <SelectTrigger id="fyStartDate" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FY_START_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {accountingErrors.fyStartDate && (
                          <p className="text-xs text-red-600">
                            {accountingErrors.fyStartDate}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <Select
                          value={accounting.dateFormat}
                          onValueChange={(value) =>
                            updateAccountingField("dateFormat", String(value))
                          }
                          disabled={accountingSaving}
                        >
                          <SelectTrigger id="dateFormat" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DATE_FORMAT_OPTIONS.map((format) => (
                              <SelectItem key={format} value={format}>
                                {format}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentTerms">
                          Default Payment Terms
                        </Label>
                        <Select
                          value={accounting.paymentTerms}
                          onValueChange={(value) =>
                            updateAccountingField("paymentTerms", String(value))
                          }
                          disabled={accountingSaving}
                        >
                          <SelectTrigger id="paymentTerms" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_TERMS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="invoiceFormat">
                          Invoice Numbering Format{" "}
                          <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          id="invoiceFormat"
                          value={accounting.invoiceFormat}
                          placeholder="INV-{YYYY}-{SEQ}"
                          onChange={(e) =>
                            updateAccountingField("invoiceFormat", e.target.value)
                          }
                          aria-required
                          aria-invalid={!!accountingErrors.invoiceFormat}
                          disabled={accountingSaving}
                        />
                        {accountingErrors.invoiceFormat ? (
                          <p className="text-xs text-red-600">
                            {accountingErrors.invoiceFormat}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Tokens: {"{YYYY}"}, {"{MM}"}, {"{SEQ}"} — e.g., INV-
                            {"{YYYY}"}
                            -{"{SEQ}"} produces INV-2026-0001
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="defaultSalesAccount">
                          Default Sales Account
                        </Label>
                        <Select
                          value={accounting.defaultSalesAccount}
                          onValueChange={(value) =>
                            updateAccountingField(
                              "defaultSalesAccount",
                              String(value)
                            )
                          }
                          disabled={accountingSaving}
                        >
                          <SelectTrigger id="defaultSalesAccount" className="w-full">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {(accountsList.filter((a) => a.type === "revenue")
                              .length
                              ? accountsList.filter((a) => a.type === "revenue")
                              : accountsList
                            ).map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.code} — {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="defaultExpenseAccount">
                          Default Expense Account
                        </Label>
                        <Select
                          value={accounting.defaultExpenseAccount}
                          onValueChange={(value) =>
                            updateAccountingField(
                              "defaultExpenseAccount",
                              String(value)
                            )
                          }
                          disabled={accountingSaving}
                        >
                          <SelectTrigger
                            id="defaultExpenseAccount"
                            className="w-full"
                          >
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {(accountsList.filter((a) => a.type === "expense")
                              .length
                              ? accountsList.filter((a) => a.type === "expense")
                              : accountsList
                            ).map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.code} — {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-border pt-5">
                      <Button
                        className="w-full sm:w-auto"
                        type="submit"
                        disabled={accountingSaving}
                      >
                        {accountingSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : accountingSaved ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Saved
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </SectionBody>
                </form>
              </SectionCard>
            </TabsContent>

            {/* -------------------------------- ADVANCED -------------------------------- */}
            <TabsContent value="advanced" className="mt-0 min-w-0 flex-1 space-y-6">
              <SectionCard>
                <SectionHeader
                  icon={<Database className="h-5 w-5" />}
                  title="Data Management"
                  description="Export, import, and manage your accounting data"
                />
                <SectionBody className="space-y-3">
                  <input
                    ref={importFileRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportData}
                    className="sr-only"
                    disabled={importing}
                  />
                  {dataMessage && (
                    <Notice type={dataMessage.type}>{dataMessage.text}</Notice>
                  )}

                  <SettingRow
                    icon={<Download className="h-5 w-5" />}
                    title="Export All Data"
                    description="Download complete backup as JSON/CSV"
                  >
                    <Button
                      className="w-full sm:w-auto"
                      variant="outline"
                      onClick={handleExportData}
                      disabled={exporting || importing || deletingData}
                    >
                      {exporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        "Export"
                      )}
                    </Button>
                  </SettingRow>

                  <SettingRow
                    icon={<Database className="h-5 w-5" />}
                    title="Import Data"
                    description="Import transactions, contacts, or chart of accounts"
                  >
                    <Button
                      className="w-full sm:w-auto"
                      variant="outline"
                      onClick={() => importFileRef.current?.click()}
                      disabled={exporting || importing || deletingData}
                    >
                      {importing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        "Import"
                      )}
                    </Button>
                  </SettingRow>

                  <SettingRow
                    tone="danger"
                    icon={<Database className="h-5 w-5" />}
                    title="Delete All Data"
                    description="Permanently remove all accounting records"
                  >
                    <Button
                      className="w-full sm:w-auto"
                      variant="destructive"
                      onClick={handleDeleteAllData}
                      disabled={exporting || importing || deletingData}
                    >
                      {deletingData ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete All Data"
                      )}
                    </Button>
                  </SettingRow>
                </SectionBody>
              </SectionCard>
            </TabsContent>

            {/* ---------------------------------- USERS ---------------------------------- */}
            {isAdmin && (
              <TabsContent value="users" className="mt-0 min-w-0 flex-1">
                <UserManagementPanel />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}