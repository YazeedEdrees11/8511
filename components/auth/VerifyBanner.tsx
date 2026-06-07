"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

// Client-side nudge only. The real gate is server-side in placeOrder.
export default function VerifyBanner() {
  const [show, setShow] = useState(false);

  useEffect(() =>
    onAuthStateChanged(auth, (u) => {
      setShow(!!u && !u.emailVerified);
    }), []);

  if (!show) return null;

  return (
    <a
      href="/verify-email"
      className="block border border-orange-400 bg-orange-50 text-[#0A0A0A] px-4 py-3 text-[11px] font-label tracking-widest uppercase hover:bg-orange-100 transition-colors"
    >
      Verify your email to place an order →
    </a>
  );
}
