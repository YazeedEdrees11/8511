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
    <div 
      className="min-h-screen bg-[#F9F9F9] flex flex-col justify-center items-center px-6 py-12 relative"
      style={{
        backgroundImage: "linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }}
    >
      <div 
        className="w-full max-w-[480px] bg-white border border-[#E5E5E5] p-10 md:p-14 shadow-sm relative flex flex-col items-center"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px)",
          backgroundSize: "100% 6px"
        }}
      >
        <span className="font-label text-[10px] tracking-[0.25em] text-[#0A0A0A] font-semibold uppercase mb-8">
          EIGHTY FIVE EL
        </span>

        <h1 className="font-display text-6xl md:text-7xl font-extrabold uppercase tracking-tighter text-center leading-[0.9] text-[#0A0A0A] mb-12 flex flex-col">
          <span>ADMIN</span>
          <span>LOGIN</span>
        </h1>

        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div className="space-y-1.5">
            <label className="block font-label text-[10px] tracking-[0.15em] uppercase font-semibold text-[#0A0A0A] mb-1">
              USERNAME
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#CCCCCC] px-4 py-3.5 pr-10 text-sm text-[#0A0A0A] placeholder-[#999999] focus:border-[#0A0A0A] focus:outline-none transition-colors rounded-none font-mono"
                placeholder="ADMIN_ID"
              />
              <span className="material-symbols-outlined absolute right-3.5 top-3.5 text-[#999999] text-[18px]">
                person
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-label text-[10px] tracking-[0.15em] uppercase font-semibold text-[#0A0A0A] mb-1">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#CCCCCC] px-4 py-3.5 pr-10 text-sm text-[#0A0A0A] placeholder-[#999999] focus:border-[#0A0A0A] focus:outline-none transition-colors rounded-none"
                placeholder="••••••••"
              />
              <span className="material-symbols-outlined absolute right-3.5 top-3.5 text-[#999999] text-[18px]">
                key
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-none font-body">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#0A0A0A] hover:bg-[#222222] text-white py-4 font-label text-xs tracking-[0.2em] uppercase font-semibold transition-all duration-200 rounded-none flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {busy ? "ENTERING..." : "ENTER PORTAL"} 
            <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
          </button>
        </form>
      </div>

      <div className="flex flex-col items-center mt-12 gap-3">
        <div className="w-12 h-[1px] bg-[#E5E5E5]" />
        <span className="font-label text-[9px] tracking-[0.2em] text-[#999999] uppercase flex items-center gap-1.5 font-medium">
          <span className="material-symbols-outlined text-[12px]">lock</span> SECURE MANAGEMENT ACCESS ONLY
        </span>
      </div>
    </div>
  );
}
