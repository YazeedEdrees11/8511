"use client";
import { useEffect, useRef, useState } from "react";
import { strengthMeta } from "@/lib/auth/passwordStrength";

type ZxcvbnResult = { score: number; feedback: { warning: string; suggestions: string[] } };
let zxcvbnFn: ((pw: string) => ZxcvbnResult) | null = null;

// Lazy-load zxcvbn-ts so it stays out of the initial bundle.
async function loadZxcvbn() {
  if (zxcvbnFn) return zxcvbnFn;
  const [core, common, en] = await Promise.all([
    import("@zxcvbn-ts/core"),
    import("@zxcvbn-ts/language-common"),
    import("@zxcvbn-ts/language-en"),
  ]);
  core.zxcvbnOptions.setOptions({
    dictionary: { ...common.dictionary, ...en.dictionary },
    graphs: common.adjacencyGraphs,
    translations: en.translations,
  });
  zxcvbnFn = (pw: string) => core.zxcvbn(pw) as ZxcvbnResult;
  return zxcvbnFn;
}

export default function PasswordStrengthBar({
  password,
  onScore,
}: {
  password: string;
  onScore?: (score: number) => void;
}) {
  const [result, setResult] = useState<ZxcvbnResult | null>(null);
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;

  useEffect(() => {
    let cancelled = false;
    if (!password) {
      setResult(null);
      onScoreRef.current?.(0);
      return;
    }
    loadZxcvbn().then((fn) => {
      if (cancelled) return;
      const r = fn(password);
      setResult(r);
      onScoreRef.current?.(r.score);
    });
    return () => {
      cancelled = true;
    };
  }, [password]);

  if (!password) return null;

  const meta = strengthMeta(result?.score ?? 0);
  const tip = result?.feedback.warning || result?.feedback.suggestions[0] || "";

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-sm transition-colors ${
              i < meta.filled ? meta.colorClass : "bg-ink/15"
            }`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between font-label text-[10px] tracking-wider2 text-muted">
        <span>{meta.label}</span>
        {tip && <span className="text-right max-w-[70%]">{tip}</span>}
      </div>
    </div>
  );
}
