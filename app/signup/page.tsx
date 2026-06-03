import SignupForm from "./SignupForm";

export default function Signup() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20">
      <p className="font-label text-[11px] tracking-wider2 text-muted">ACCOUNT</p>
      <h1 className="font-display text-7xl md:text-9xl mt-4 leading-[0.9]">JOIN 8511.</h1>
      <div className="mt-12 max-w-md">
        <SignupForm />
      </div>
    </div>
  );
}
