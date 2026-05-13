import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import { CartProvider } from "@/components/cart/CartProvider";
import CartDrawer from "@/components/cart/CartDrawer";

export const metadata = {
  title: "Eighty Five Eleven | Amman",
  description: "Streetwear, sneakers, and accessories — Swefieh Village, Amman.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
