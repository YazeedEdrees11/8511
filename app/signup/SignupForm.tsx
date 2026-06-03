"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { postSession } from "@/lib/auth/postSession";

const inputCls = "w-full bg-transparent border border-ink/20 px-4 py-3 text-base text-ink focus:border-accent outline-none";
const labelCls = "block font-label text-[11px] tracking-wider2 text-muted mb-2";
const btnCls = "bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors disabled:opacity-50";

export default function SignupForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signup(formData: FormData) {
    const password = String(formData.get("password"));
    const confirm = String(formData.get("confirm"));
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, String(formData.get("email")), password);
      await updateProfile(cred.user, { displayName: String(formData.get("name")) });
      await postSession(cred.user);
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not create account (email may already be in use).");
    } finally { setBusy(false); }
  }

  async function googleSignup() {
    setBusy(true); setError("");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await postSession(cred.user);
      router.push("/");
      router.refresh();
    } catch {
      setError("Google sign-in failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-6">
      <form action={signup} className="grid gap-6">
        <div>
          <label className={labelCls} htmlFor="name">NAME</label>
          <input id="name" name="name" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="email">EMAIL</label>
          <input id="email" name="email" type="email" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="password">PASSWORD</label>
          <input id="password" name="password" type="password" required minLength={6} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="confirm">CONFIRM PASSWORD</label>
          <input id="confirm" name="confirm" type="password" required minLength={6} className={inputCls} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={`${btnCls} justify-self-start`}>
          {busy ? "…" : "SIGN UP →"}
        </button>
      </form>
      <button onClick={googleSignup} disabled={busy} className="border border-ink/20 px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:border-accent transition-colors">
        SIGN UP WITH GOOGLE
      </button>
      <div className="font-label text-[11px] tracking-wider2 text-muted">
        <a href="/login" className="hover:text-accent">ALREADY HAVE AN ACCOUNT? LOG IN →</a>
      </div>
    </div>
  );
}
