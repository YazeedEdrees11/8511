import { describe, it, expect } from "vitest";
import { strengthMeta, MIN_ACCEPTABLE_SCORE } from "@/lib/auth/passwordStrength";

describe("strengthMeta", () => {
  it("maps score 0 and 1 to Weak/red with 1 filled segment", () => {
    expect(strengthMeta(0)).toMatchObject({ label: "Weak", filled: 1 });
    expect(strengthMeta(1)).toMatchObject({ label: "Weak", filled: 1 });
    expect(strengthMeta(0).colorClass).toContain("red");
  });
  it("maps score 2 to Fair/orange with 2 filled segments", () => {
    expect(strengthMeta(2)).toMatchObject({ label: "Fair", filled: 2 });
    expect(strengthMeta(2).colorClass).toContain("orange");
  });
  it("maps score 3 to Good/yellow with 3 filled segments", () => {
    expect(strengthMeta(3)).toMatchObject({ label: "Good", filled: 3 });
    expect(strengthMeta(3).colorClass).toContain("yellow");
  });
  it("maps score 4 to Strong/green with 4 filled segments", () => {
    expect(strengthMeta(4)).toMatchObject({ label: "Strong", filled: 4 });
    expect(strengthMeta(4).colorClass).toContain("green");
  });
  it("exposes a minimum acceptable score of 2", () => {
    expect(MIN_ACCEPTABLE_SCORE).toBe(2);
  });
});
