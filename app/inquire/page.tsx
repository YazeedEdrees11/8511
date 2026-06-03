import InquiryForm from "./InquiryForm";

export default function Inquire() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20">
      <p className="font-label text-[11px] tracking-wider2 text-muted">INQUIRE</p>
      <h1 className="font-display text-7xl md:text-9xl mt-4 leading-[0.9]">
        CAN&apos;T FIND IT?
      </h1>
      <p className="mt-6 max-w-2xl text-base text-ink/80 leading-relaxed">
        Looking for a grail we don&apos;t have in stock? Tell us what you want and
        we&apos;ll source it. Leave your details and we&apos;ll reach out to arrange it.
      </p>
      <div className="mt-12 max-w-2xl">
        <InquiryForm />
      </div>
    </div>
  );
}
