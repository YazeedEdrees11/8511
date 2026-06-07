import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-headline text-4xl uppercase tracking-tight mb-8">CHECKOUT</h1>
      <CheckoutClient />
    </main>
  );
}
