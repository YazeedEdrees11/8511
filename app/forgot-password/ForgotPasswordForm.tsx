"use client";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const inputCls = "w-full bg-transparent border border-ink/20 px-4 py-3 text-base text-ink focus:border-accent outline-none";
const labelCls = "block font-label text-[11px] tracking-wider2 text-muted mb-2";

export default function ForgotPasswordForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function send(formData: FormData) {
    setState("sending");
    try { await sendPasswordResetEmail(auth, String(formData.get("email"))); }
    catch { /* don't reveal whether the email exists */ }
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="border border-ink/15 p-8">
        <p className="font-display text-3xl">CHECK YOUR EMAIL.</p>
        <p className="mt-3 text-base text-ink/80">If an account exists for that address, a reset link is on its way.</p>
      </div>
    );
  }

  return (
    <form action={send} className="grid gap-6">
      <div>
        <label className={labelCls} htmlFor="email">EMAIL</label>
        <input id="email" name="email" type="email" required className={inputCls} />
      </div>
      <button type="submit" disabled={state === "sending"} className="justify-self-start bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors disabled:opacity-50">
        {state === "sending" ? "SENDING…" : "SEND RESET LINK →"}
      </button>
      <a href="/login" className="font-label text-[11px] tracking-wider2 text-muted hover:text-accent">← BACK TO LOG IN</a>
    </form>
  );
}
