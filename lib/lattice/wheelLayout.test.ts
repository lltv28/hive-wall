import { describe, expect, it } from "vitest";
import { angleForIndex, polarToCartesian, wheelRadiusFor } from "./wheelLayout";

describe("angleForIndex", () => {
  it("divides a full circle evenly by count", () => {
    expect(angleForIndex(0, 4)).toBeCloseTo(0);
    expect(angleForIndex(1, 4)).toBeCloseTo(Math.PI / 2);
    expect(angleForIndex(2, 4)).toBeCloseTo(Math.PI);
    expect(angleForIndex(3, 4)).toBeCloseTo((3 * Math.PI) / 2);
  });
});

describe("polarToCartesian", () => {
  it("converts angle 0 to a point directly right of center", () => {
    const position = polarToCartesian(100, 100, 0, 10);
    expect(position.x).toBeCloseTo(110);
    expect(position.y).toBeCloseTo(100);
  });

  it("converts angle PI/2 to a point offset by radius along y", () => {
    const position = polarToCartesian(100, 100, Math.PI / 2, 10);
    expect(position.x).toBeCloseTo(100);
    expect(position.y).toBeCloseTo(110);
  });
});

describe("wheelRadiusFor", () => {
  it("is 0.42 of the smaller canvas dimension", () => {
    expect(wheelRadiusFor(800, 600)).toBeCloseTo(0.42 * 600);
    expect(wheelRadiusFor(600, 800)).toBeCloseTo(0.42 * 600);
  });
});

