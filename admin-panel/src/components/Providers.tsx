"use client";

import { ToastProvider } from "@/lib/toast";
import { ToastContainer } from "@/components/ToastContainer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastContainer />
    </ToastProvider>
  );
}
