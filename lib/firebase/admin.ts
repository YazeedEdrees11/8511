import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "dummy-project";
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "dummy-email@dummy-project.iam.gserviceaccount.com";
  // Provide a dummy formatted PEM private key to pass basic parsing checks in firebase-admin SDK
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\n-----END PRIVATE KEY-----\n";
  const privateKey = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const adminAuth = getAuth(getAdminApp());

