import { describe, expect, it } from "vitest";
import { placeCard, type Bounds } from "./cardPlacement";

const BOUNDS: Bounds = { left: 340, top: 40, right: 1880, bottom: 1040 };
const CARD = { width: 420, height: 560 };

describe("placeCard", () => {
  it("places the card outward, to the right of a node right of center", () => {
    const placement = placeCard({ x: 1400, y: 540 }, CARD, BOUNDS);
    expect(placement.side).toBe("right");
    expect(placement.x).toBeGreaterThan(1400);
  });

  it("places the card outward, to the left of a node left of center", () => {
    // x must leave room for gap + card between bounds.left and the node:
    // 340 + 36 + 420 = 796 minimum. 900 clears it.
    const placement = placeCard({ x: 900, y: 540 }, CARD, BOUNDS);
    expect(placement.side).toBe("left");
    expect(placement.x + CARD.width).toBeLessThan(900);
  });

  it("flips inward when the outward side has no room for the card", () => {
    // A node left of centre but too close to bounds.left for a 420-wide card
    // to fit outward. Clamping alone would slide the card back over the node,
    // so it must flip to the inward side instead.
    const placement = placeCard({ x: 700, y: 540 }, CARD, BOUNDS);
    expect(placement.side).toBe("right");
    expect(placement.x).toBeGreaterThan(700);
  });

  it("never places the card outside the bounds", () => {
    for (const x of [360, 700, 1100, 1500, 1860]) {
      for (const y of [60, 300, 540, 800, 1020]) {
        const placement = placeCard({ x, y }, CARD, BOUNDS);
        expect(placement.x).toBeGreaterThanOrEqual(BOUNDS.left);
        expect(placement.y).toBeGreaterThanOrEqual(BOUNDS.top);
        expect(placement.x + CARD.width).toBeLessThanOrEqual(BOUNDS.right);
        expect(placement.y + CARD.height).toBeLessThanOrEqual(BOUNDS.bottom);
      }
    }
  });

  it("flips to the other side when clamping would cover the node", () => {
    // A node hard against the right edge cannot fit a card to its right,
    // so clamping would slide the card back over the node itself.
    const placement = placeCard({ x: 1860, y: 540 }, CARD, BOUNDS);
    expect(placement.side).toBe("left");
    expect(placement.x + CARD.width).toBeLessThanOrEqual(1860);
  });
});
