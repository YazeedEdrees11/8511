"use client";
import { useState } from "react";
import { submitInquiry } from "@/app/actions/inquiry";

const inputCls =
  "w-full bg-transparent border border-ink/20 px-4 py-3 text-base text-ink focus:border-accent outline-none";
const labelCls = "block font-label text-[11px] tracking-wider2 text-muted mb-2";

export default function InquiryForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function action(formData: FormData) {
    setState("sending");
    setError("");
    const r = await submitInquiry({
      itemName: String(formData.get("itemName") ?? ""),
      category: String(formData.get("category") ?? "other"),
      sizeEu: String(formData.get("sizeEu") ?? "") || undefined,
      budget: String(formData.get("budget") ?? "") || undefined,
      notes: String(formData.get("notes") ?? "") || undefined,
      contactName: String(formData.get("contactName") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? "") || undefined,
    });
    if (r.ok) setState("done");
    else { setState("error"); setError(r.error); }
  }

  if (state === "done") {
    return (
      <div className="border border-ink/15 p-8">
        <p className="font-display text-3xl">THANK YOU.</p>
        <p className="mt-3 text-base text-ink/80">
          We got your request and we&apos;ll be in touch soon to arrange it.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-6">
      <div>
        <label className={labelCls} htmlFor="itemName">WHAT ARE YOU LOOKING FOR? *</label>
        <input id="itemName" name="itemName" required placeholder="e.g. Travis Scott AJ1 Mocha" className={inputCls} />
      </div>
      <div className="grid sm:grid-cols-3 gap-6">
        <div>
          <label className={labelCls} htmlFor="category">CATEGORY</label>
          <select id="category" name="category" className={inputCls} defaultValue="shoe">
            <option value="shoe">Shoe</option>
            <option value="hoodie">Hoodie</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="sizeEu">SIZE (EU)</label>
          <input id="sizeEu" name="sizeEu" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="budget">BUDGET</label>
          <input id="budget" name="budget" type="number" step="0.01" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="notes">NOTES</label>
        <textarea id="notes" name="notes" rows={3} className={inputCls} />
      </div>
      <div className="grid sm:grid-cols-3 gap-6">
        <div>
          <label className={labelCls} htmlFor="contactName">NAME *</label>
          <input id="contactName" name="contactName" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="contactEmail">EMAIL *</label>
          <input id="contactEmail" name="contactEmail" type="email" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="contactPhone">PHONE</label>
          <input id="contactPhone" name="contactPhone" className={inputCls} />
        </div>
      </div>
      {state === "error" && <p className="text-sm text-red-600">{error || "Something went wrong."}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="justify-self-start bg-ink text-paper px-7 py-3.5 font-label text-[11px] tracking-wider2 hover:bg-accent transition-colors disabled:opacity-50"
      >
        {state === "sending" ? "SENDING…" : "SEND INQUIRY →"}
      </button>
    </form>
  );
}
