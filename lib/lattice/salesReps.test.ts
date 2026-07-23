import { describe, expect, it } from "vitest";
import { buildRepLabel, SALES_REPS } from "./salesReps";

describe("salesReps", () => {
  it("has a non-empty list of unique rep names", () => {
    expect(SALES_REPS.length).toBeGreaterThan(0);
    expect(new Set(SALES_REPS).size).toBe(SALES_REPS.length);
  });

  it("builds a rep label that includes the name and role", () => {
    expect(buildRepLabel("Jordan Lee")).toBe("Jordan Lee · Sales Rep");
  });
});
