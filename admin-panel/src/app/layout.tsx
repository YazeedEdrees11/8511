import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "8511 Backoffice | Amman",
  description: "Management dashboard for 8511 storefront.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-body bg-[#F7F7F4] text-[#0A0A0A]">
        {children}
      </body>
    </html>
  );
}
