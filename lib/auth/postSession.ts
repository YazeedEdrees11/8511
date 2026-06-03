import type { User as FirebaseUser } from "firebase/auth";

// Exchanges a signed-in Firebase user's ID token for a server session cookie.
export async function postSession(user: FirebaseUser): Promise<void> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("Could not establish session");
}
