import type { WheelGraph, WheelNode } from "./types";
import { polarToCartesian, wheelRadiusFor } from "./wheelLayout";

const PALETTE = {
  stageInner: "#1e293b",
  stageOuter: "#0f172a",
  wireBase: "rgba(255,255,255,0.05)",
  wireMid: "rgba(46,125,82,0.35)",
  wireFlow: "rgba(74,222,128,0.85)",
  orbFill: "#1e293b",
  orbBorder: "#334155",
  orbInitials: "#e2e8f0",
  orbClosed: "#22c55e",
  focusRing: "#4ade80",
  brainText: "#ffffff",
  brainCaption: "rgba(255,255,255,0.85)",
  faded: 0.16, // alpha for dimmed (non-focused) orbs/wires
};

const PULSE_MS = 850;

// Marketing figure shown in the brain's "N Chats" pill — matches the original
// Hive ad's copy, deliberately decoupled from the handful of orbs on screen
// (they are representative, not a literal count).
const BRAIN_CHATS_LABEL = "50";

// ctx.letterSpacing exists in modern Chrome but not on jsdom's fake test
// contexts (and older canvases); guard so tests don't throw and it degrades.
function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string): void {
  if ("letterSpacing" in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = value;
  }
}

export interface HiveFrame {
  timeMs: number;
  revenue: number;
  pulses: { nodeId: string; startMs: number }[];
}

const EMPTY_FRAME: HiveFrame = { timeMs: 0, revenue: 0, pulses: [] };

export interface Camera {
  scale: number;
  lookAtX: number;
  lookAtY: number;
}

// The un-focused view: no zoom, looking at canvas center. createVisualizerApp
// keeps a persistent Camera and eases it toward whichever of these two
// targets is current every frame, so switching *between* two focused nodes
// pans smoothly instead of snapping (there's no separate "just zoomed in"
// vs "just switched" case — it's always "ease the camera toward its
// current target").
export function identityCamera(width: number, height: number): Camera {
  return { scale: 1, lookAtX: width / 2, lookAtY: height / 2 };
}

export type CardSide = "left" | "right";

// The drill camera used to zoom in on the focused node (see git history for
// the old focusedCamera/FOCUS_ZOOM). It now instead pans the wheel aside so a
// quiz card can sit beside it with zero overlap, including the dimmed
// background nodes — the card is the magnifier now, not the camera. Panning
// keeps scale at 1: the target on-screen wheel center is expressed as a
// fraction of `width` (measured against the 1440px-wide reference column),
// then converted to a lookAt via the same width - target relationship
// worldToScreen uses, so it holds at any canvas size.
export function asideCamera(width: number, height: number, cardSide: CardSide): Camera {
  const targetCx = cardSide === "right" ? width * (500 / 1440) : width * (940 / 1440);
  return { scale: 1, lookAtX: width - targetCx, lookAtY: height / 2 };
}

export function nodePixelPosition(
  node: WheelNode,
  width: number,
  height: number,
): { x: number; y: number } {
  const centerX = width / 2;
  const centerY = height / 2;
  const wheelRadius = wheelRadiusFor(width, height);
  return polarToCartesian(centerX, centerY, node.angle, node.radiusFraction * wheelRadius);
}

export function neighborIds(graph: WheelGraph, focusedNodeId: string): Set<string> {
  const ids = new Set<string>([focusedNodeId]);
  for (const link of graph.links) {
    if (link.sourceId === focusedNodeId) ids.add(link.targetId);
    if (link.targetId === focusedNodeId) ids.add(link.sourceId);
  }
  // Hive: an orb links only to the brain, so this is {orb, brain} on a drill —
  // exactly the "magnify one conversation" highlight. (No zone-lighting; the
  // wheel's whole-zone branch was removed with the wheel.)
  return ids;
}

export function nodeIdAtPoint(
  pointX: number,
  pointY: number,
  nodes: WheelNode[],
  width: number,
  height: number,
  tolerancePx = 4,
): string | undefined {
  let closestId: string | undefined;
  let closestDistance = Infinity;
  for (const node of nodes) {
    const position = nodePixelPosition(node, width, height);
    const distance = Math.hypot(pointX - position.x, pointY - position.y);
    if (distance <= node.radius + tolerancePx && distance < closestDistance) {
      closestDistance = distance;
      closestId = node.id;
    }
  }
  return closestId;
}

// Inverse of the render()-time camera transform: translates a click's raw
// canvas coordinates back into the same space nodePixelPosition works in,
// using whatever camera state is actually on screen right now (not assuming
// fully zoomed), so hit-testing stays correct mid-animation too.
export function screenToWorld(
  screenX: number,
  screenY: number,
  width: number,
  height: number,
  camera: Camera,
): { x: number; y: number } {
  return {
    x: (screenX - width / 2) / camera.scale + camera.lookAtX,
    y: (screenY - height / 2) / camera.scale + camera.lookAtY,
  };
}

// The inverse of screenToWorld. The floating quiz card is a DOM element
// positioned in canvas-screen space, so it needs the focused node's position
// after the camera transform, not its layout position.
export function worldToScreen(
  world: { x: number; y: number },
  width: number,
  height: number,
  camera: Camera,
): { x: number; y: number } {
  return {
    x: (world.x - camera.lookAtX) * camera.scale + width / 2,
    y: (world.y - camera.lookAtY) * camera.scale + height / 2,
  };
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(
        "This browser could not create a 2D canvas. Try a current version of Chrome or Edge.",
      );
    }
    this.ctx = context;
  }

  render(
    graph: WheelGraph,
    focusedNodeId: string | undefined,
    camera?: Camera,
    frame: HiveFrame = EMPTY_FRAME,
  ): void {
    const { ctx, canvas } = this;
    const width = canvas.width;
    const height = canvas.height;
    const activeCamera = camera ?? identityCamera(width, height);
    const focused = focusedNodeId !== undefined;

    // Dark stage + soft radial vignette (pre-camera, fills the whole canvas).
    const vignette = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.1,
      width / 2, height / 2, Math.max(width, height) * 0.7,
    );
    vignette.addColorStop(0, PALETTE.stageInner);
    vignette.addColorStop(1, PALETTE.stageOuter);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    const positionById = new Map(
      graph.nodes.map((node) => [node.id, nodePixelPosition(node, width, height)]),
    );
    const litIds = focusedNodeId ? neighborIds(graph, focusedNodeId) : undefined;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(activeCamera.scale, activeCamera.scale);
    ctx.translate(-activeCamera.lookAtX, -activeCamera.lookAtY);

    // Wires (brain → orb). Lit wire glows and flows; others dim.
    for (const link of graph.links) {
      const a = positionById.get(link.sourceId);
      const b = positionById.get(link.targetId);
      if (!a || !b) continue;
      const isLit = !litIds || (litIds.has(link.sourceId) && litIds.has(link.targetId));
      ctx.globalAlpha = isLit ? 1 : PALETTE.faded;
      // base + mid
      ctx.strokeStyle = PALETTE.wireBase;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.strokeStyle = PALETTE.wireMid;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      // animated flow dashes on lit wires
      if (isLit) {
        ctx.save();
        ctx.strokeStyle = PALETTE.wireFlow;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.setLineDash([14, 26]);
        ctx.lineDashOffset = -(frame.timeMs / 22) % 40;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;

    // Sale pulses: a bright dot travels orb → brain along its wire.
    for (const pulse of frame.pulses) {
      const orb = positionById.get(pulse.nodeId);
      const brain = positionById.get("center");
      if (!orb || !brain) continue;
      const p = (frame.timeMs - pulse.startMs) / PULSE_MS;
      if (p < 0 || p > 1) continue;
      const x = orb.x + (brain.x - orb.x) * p;
      const y = orb.y + (brain.y - orb.y) * p;
      ctx.fillStyle = PALETTE.wireFlow;
      ctx.shadowColor = PALETTE.wireFlow;
      ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(x, y, 7 * (1 - p) + 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Orbs, then the brain on top.
    for (const node of graph.nodes) {
      if (node.ring === "center") continue;
      const pos = positionById.get(node.id);
      if (!pos) continue;
      const isLit = !litIds || litIds.has(node.id);
      ctx.globalAlpha = focused && !isLit ? PALETTE.faded : 1;
      this.drawOrb(node, pos, isLit && focused);
    }
    ctx.globalAlpha = 1;

    const brain = graph.nodes.find((n) => n.ring === "center");
    if (brain) {
      const pos = positionById.get(brain.id)!;
      this.drawBrain(brain, pos, frame);
    }

    ctx.restore();
  }

  private drawOrb(
    node: WheelNode,
    pos: { x: number; y: number },
    highlighted: boolean,
  ): void {
    const { ctx } = this;
    const isClosed = node.closed === true;
    if (highlighted) {
      ctx.shadowColor = PALETTE.focusRing;
      ctx.shadowBlur = 22;
    }
    ctx.fillStyle = isClosed ? PALETTE.orbClosed : PALETTE.orbFill;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, node.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = highlighted || isClosed ? PALETTE.focusRing : PALETTE.orbBorder;
    ctx.stroke();
    if (node.initials) {
      ctx.fillStyle = PALETTE.orbInitials;
      ctx.font = `600 ${Math.round(node.radius * 0.8)}px Inter, ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.initials, pos.x, pos.y);
    }
  }

  private drawBrain(
    node: WheelNode,
    pos: { x: number; y: number },
    frame: HiveFrame,
  ): void {
    const { ctx } = this;
    // Subtle bump if a pulse landed in the brain very recently.
    const recent = frame.pulses.reduce(
      (m, p) => Math.max(m, 1 - Math.min(1, (frame.timeMs - p.startMs - PULSE_MS) / 250)),
      0,
    );
    const bump = recent > 0 && recent <= 1 ? 1 + 0.05 * recent : 1;
    const r = node.radius * bump;

    // Body — matches the original CSS exactly:
    //   radial-gradient(circle at 30% 30%, #4ade80 0%, #166534 60%, #064e3b 100%)
    // A CSS radial gradient reaches its final stop at the farthest box CORNER,
    // so #064e3b only appears in a small bottom-right crescent and the sphere
    // stays mostly bright green. Reproduce that by centring the gradient at the
    // 30%/30% point (0.4r up-left of centre) with an outer radius of ~1.5r
    // (past the circle), NOT ending #064e3b at the visible rim.
    const family = this.brainFontFamily();
    const hx = pos.x - r * 0.4;
    const hy = pos.y - r * 0.4;
    const grad = ctx.createRadialGradient(hx, hy, r * 0.05, hx, hy, r * 1.5);
    grad.addColorStop(0, "#4ade80");
    grad.addColorStop(0.6, "#166534");
    grad.addColorStop(1, "#064e3b");
    ctx.shadowColor = "rgba(74,222,128,0.4)";
    ctx.shadowBlur = 64;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inset sheen — the original's `inset 0 4px 16px rgba(255,255,255,0.4)` is a
    // SUBTLE soft-white glow hugging the top inner rim, not a broad wash. Keep it
    // concentrated near the top edge and low-alpha, clipped to the sphere.
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.clip();
    const sheen = ctx.createRadialGradient(
      pos.x, pos.y - r * 0.82, r * 0.02, pos.x, pos.y - r * 0.82, r * 0.7,
    );
    sheen.addColorStop(0, "rgba(255,255,255,0.32)");
    sheen.addColorStop(0.6, "rgba(255,255,255,0.05)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(pos.x - r, pos.y - r, r * 2, r * 2);
    ctx.restore();

    // Text — the page's Instrument Sans (read from the canvas's computed style),
    // at the original weights: caption 700 + letter-spacing, revenue 700 with a
    // drop shadow, pill 700.
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = `700 16px ${family}`;
    setLetterSpacing(ctx, "1.5px");
    ctx.fillText("TOTAL REVENUE", pos.x, pos.y - 50);
    setLetterSpacing(ctx, "0px");

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 64px ${family}`;
    ctx.fillText(`$${Math.round(frame.revenue).toLocaleString()}`, pos.x, pos.y + 2);
    ctx.restore();

    // "1 AI Brain • N Chats" pill (rounded chip + border), matching the original
    // ad. BRAIN_CHATS_LABEL is a marketing figure, not the visible orb count.
    const label = `1 AI Brain • ${BRAIN_CHATS_LABEL} Chats`;
    ctx.font = `700 13px ${family}`;
    const pillH = 28;
    const pillW = ctx.measureText(label).width + 30;
    const pillX = pos.x - pillW / 2;
    const pillY = pos.y + 38;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
    } else {
      ctx.rect(pillX, pillY, pillW, pillH);
    }
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, pos.x, pillY + pillH / 2 + 1);
  }

  // The page font is Instrument Sans, loaded via next/font under a hashed
  // family name — so the literal string 'Instrument Sans' does NOT resolve on
  // the canvas. Read the actual computed family off the canvas element (it
  // inherits the body font) so the brain text matches the rest of the demo
  // instead of falling back to a system face. Cached; falls back if unavailable.
  private cachedFontFamily?: string;
  private brainFontFamily(): string {
    if (this.cachedFontFamily) return this.cachedFontFamily;
    let family = "";
    try {
      family = getComputedStyle(this.canvas).fontFamily;
    } catch {
      family = "";
    }
    this.cachedFontFamily =
      family || "'Instrument Sans', ui-sans-serif, system-ui, sans-serif";
    return this.cachedFontFamily;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
