"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/app/actions/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await adminLogin(email, password);
      if (res.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(res.error || "Authentication failed.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F7F7F4] flex flex-col justify-center items-center px-6 py-12">
      <div className="w-full max-w-md bg-[#161616] border border-[#F7F7F4]/10 p-8 md:p-10 rounded-sm">
        <div className="text-center mb-8">
          <span className="font-label text-[11px] tracking-widest text-[#c8ff00] font-bold">8511 BACKOFFICE</span>
          <h1 className="font-display text-4xl uppercase tracking-tighter mt-2">ADMIN PORTAL</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block font-label text-[10px] tracking-widest uppercase text-[#F7F7F4]/60 mb-2" htmlFor="email">
              ADMIN EMAIL
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#202020] border border-[#F7F7F4]/10 px-4 py-3 text-base text-[#F7F7F4] focus:border-[#c8ff00] focus:outline-none transition-colors rounded-sm"
              placeholder="e.g. admin@8511.com"
            />
          </div>

          <div>
            <label className="block font-label text-[10px] tracking-widest uppercase text-[#F7F7F4]/60 mb-2" htmlFor="password">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#202020] border border-[#F7F7F4]/10 px-4 py-3 text-base text-[#F7F7F4] focus:border-[#c8ff00] focus:outline-none transition-colors rounded-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-sm font-body">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#c8ff00] text-[#0A0A0A] py-4 font-label text-xs tracking-widest uppercase font-bold hover:bg-[#c8ff00]/90 transition-all duration-200 rounded-sm disabled:opacity-50"
          >
            {busy ? "AUTHENTICATING…" : "LOG IN TO ADMIN →"}
          </button>
        </form>

        <div className="text-center mt-8">
          <a
            href="http://localhost:3000"
            className="font-label text-[10px] tracking-widest text-[#F7F7F4]/40 hover:text-[#c8ff00] transition-colors uppercase"
          >
            ← BACK TO STOREFRONT
          </a>
        </div>
      </div>
    </div>
  );
}
