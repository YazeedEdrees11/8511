"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { postSession } from "@/lib/auth/postSession";
import GoogleIcon from "@/components/icons/GoogleIcon";

const inputCls = "w-full bg-transparent border border-ink/20 px-4 py-3 text-base text-ink focus:border-accent outline-none";
const labelCls = "block font-label text-[11px] tracking-wider2 text-muted mb-2";
const btnCls = "bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors disabled:opacity-50";

export default function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function emailLogin(formData: FormData) {
    setBusy(true); setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, String(formData.get("email")), String(formData.get("password")));
      await postSession(cred.user);
      router.push("/");
      router.refresh();
    } catch {
      setError("Wrong email or password.");
    } finally { setBusy(false); }
  }

  async function googleLogin() {
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
      <form action={emailLogin} className="grid gap-6">
        <div>
          <label className={labelCls} htmlFor="email">EMAIL</label>
          <input id="email" name="email" type="email" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="password">PASSWORD</label>
          <input id="password" name="password" type="password" required className={inputCls} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={`${btnCls} justify-self-start`}>
          {busy ? "…" : "LOG IN →"}
        </button>
      </form>
      <button onClick={googleLogin} disabled={busy} className="flex items-center justify-center gap-3 border border-ink/20 px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:border-accent transition-colors disabled:opacity-50">
        <GoogleIcon />
        CONTINUE WITH GOOGLE
      </button>
      <div className="flex justify-between font-label text-[11px] tracking-wider2 text-muted">
        <a href="/forgot-password" className="hover:text-accent">FORGOT PASSWORD?</a>
        <a href="/signup" className="hover:text-accent">CREATE ACCOUNT →</a>
      </div>
    </div>
  );
}
