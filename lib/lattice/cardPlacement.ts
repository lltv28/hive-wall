export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface CardSize {
  width: number;
  height: number;
}

export interface CardPlacement {
  x: number;
  y: number;
  side: "left" | "right";
}

const DEFAULT_GAP = 36;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function layOut(
  node: { x: number; y: number },
  card: CardSize,
  bounds: Bounds,
  gap: number,
  side: "left" | "right",
): CardPlacement {
  const rawX = side === "right" ? node.x + gap : node.x - gap - card.width;
  const x = clamp(rawX, bounds.left, bounds.right - card.width);
  const y = clamp(node.y - card.height / 2, bounds.top, bounds.bottom - card.height);
  return { x, y, side };
}

function coversNode(placement: CardPlacement, card: CardSize, node: { x: number }): boolean {
  return node.x > placement.x && node.x < placement.x + card.width;
}

/**
 * Position the floating quiz card next to a focused node.
 *
 * The card goes on the side of the node facing away from the wheel's center,
 * so it never covers the graph. It is then clamped inside `bounds`. If
 * clamping slid the card back over its own node (which happens for nodes hard
 * against an edge, where there is no room on the outward side), it flips to
 * the opposite side instead.
 */
export function placeCard(
  node: { x: number; y: number },
  card: CardSize,
  bounds: Bounds,
  gap: number = DEFAULT_GAP,
): CardPlacement {
  const centerX = (bounds.left + bounds.right) / 2;
  const outward: "left" | "right" = node.x >= centerX ? "right" : "left";

  const first = layOut(node, card, bounds, gap, outward);
  if (!coversNode(first, card, node)) return first;

  const flipped = layOut(node, card, bounds, gap, outward === "right" ? "left" : "right");
  return coversNode(flipped, card, node) ? first : flipped;
}
