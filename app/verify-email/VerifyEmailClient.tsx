"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, sendEmailVerification, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const btnCls = "bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors disabled:opacity-50";

export default function VerifyEmailClient() {
  const [user, setUser] = useState<User | null>(null);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() =>
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await u.reload();
        setVerified(u.emailVerified);
      }
    }), []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    if (!auth.currentUser) return;
    setMsg("");
    try {
      await sendEmailVerification(auth.currentUser);
      setMsg("Verification email sent — check your inbox.");
      setCooldown(30);
    } catch {
      setMsg("Could not send right now. Please wait a moment and try again.");
    }
  }

  if (!user) {
    return (
      <p className="font-body text-sm text-muted">
        You are not signed in. <a href="/login" className="text-accent">Log in</a> to verify your email.
      </p>
    );
  }

  if (verified) {
    return (
      <div className="grid gap-4">
        <p className="font-body text-sm">Your email is verified ✓ You can now place orders.</p>
        <a href="/" className={`${btnCls} justify-self-start`}>CONTINUE →</a>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="font-body text-sm text-muted">
        We sent a verification link to <b>{user.email}</b>. Click it to verify your account, then return here.
      </p>
      <button onClick={resend} disabled={cooldown > 0} className={`${btnCls} justify-self-start`}>
        {cooldown > 0 ? `RESEND IN ${cooldown}s` : "RESEND EMAIL"}
      </button>
      {msg && <p className="font-body text-sm text-muted">{msg}</p>}
      <a href="/" className="font-label text-[11px] tracking-wider2 text-muted hover:text-accent">CONTINUE BROWSING →</a>
    </div>
  );
}
