import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "";
  const privateKey = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export const adminAuth = getAuth(getAdminApp());
