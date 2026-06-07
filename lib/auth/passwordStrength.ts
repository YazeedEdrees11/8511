export const MIN_ACCEPTABLE_SCORE = 2;

export type StrengthMeta = {
  label: "Weak" | "Fair" | "Good" | "Strong";
  colorClass: string; // tailwind bg-* class for the filled segments
  filled: number; // 1..4 segments filled
};

// Maps a zxcvbn score (0-4) to UI metadata for the strength bar.
export function strengthMeta(score: number): StrengthMeta {
  switch (score) {
    case 4:
      return { label: "Strong", colorClass: "bg-green-500", filled: 4 };
    case 3:
      return { label: "Good", colorClass: "bg-yellow-400", filled: 3 };
    case 2:
      return { label: "Fair", colorClass: "bg-orange-400", filled: 2 };
    default:
      return { label: "Weak", colorClass: "bg-red-500", filled: 1 };
  }
}
