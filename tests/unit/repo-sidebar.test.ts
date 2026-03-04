import { describe, it, expect } from "vitest";
import { getRepoGradient, getRepoInitials } from "@/lib/gradients";

describe("getRepoGradient — gradient is deterministic", () => {
  it("returns the same gradient for the same input on repeated calls", () => {
    const a = getRepoGradient("acme/api");
    const b = getRepoGradient("acme/api");
    expect(a).toBe(b);
  });

  it("returns a non-empty CSS gradient string", () => {
    const result = getRepoGradient("acme/api");
    expect(result).toMatch(/^linear-gradient/);
  });

  it("handles empty string without throwing", () => {
    expect(() => getRepoGradient("")).not.toThrow();
    expect(getRepoGradient("")).toMatch(/^linear-gradient/);
  });

  it("handles single-character full_name without throwing", () => {
    expect(() => getRepoGradient("x")).not.toThrow();
    expect(getRepoGradient("x")).toMatch(/^linear-gradient/);
  });

  it("different repos may receive different gradients", () => {
    // Not guaranteed to differ, but both must be valid gradient strings
    const a = getRepoGradient("acme/api");
    const b = getRepoGradient("other/repo");
    expect(a).toMatch(/^linear-gradient/);
    expect(b).toMatch(/^linear-gradient/);
  });
});

describe("getRepoInitials — first two letters displayed", () => {
  it("returns the first two letters of the repo name uppercased", () => {
    expect(getRepoInitials("my-service")).toBe("MY");
  });

  it("handles repo names with exactly two characters", () => {
    expect(getRepoInitials("ab")).toBe("AB");
  });

  it("handles a one-character repo name", () => {
    expect(getRepoInitials("x")).toBe("X");
  });

  it("handles empty string without throwing", () => {
    expect(() => getRepoInitials("")).not.toThrow();
    expect(getRepoInitials("")).toBe("");
  });
});
