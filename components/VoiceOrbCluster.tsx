'use client';

// Ported from the WL-Voice-chat / kodara-coach repo (src/components/VoiceOrbCluster.tsx).
// A self-contained canvas particle-cluster orb — sphere ⇄ ring morph, audio- or
// level-reactive, with smooth color crossfades. No external dependencies.

import Image from "next/image";
import { useEffect, useRef } from "react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type Speaker = "idle" | "user" | "ai" | "processing" | "user-processing";

export interface VoiceOrbClusterProps {
  /**
   * Current conversation state.
   * "idle"             — slow rotating cluster.
   * "user"             — cluster reacts to user voice (orange).
   * "user-processing"  — ring forms while user still speaking (orange).
   * "processing"       — ring spins at fixed size, no amplitude (green).
   * "ai"               — cluster reacts to AI audio (green).
   */
  speaker?: Speaker;
  /** User microphone stream. Read when speaker is "user" or "user-processing". */
  userStream?: MediaStream | null;
  /** AI TTS output as a MediaStream. Read when speaker is "ai". */
  aiStream?: MediaStream | null;
  /** Alternative AI source: an <audio> element playing TTS. */
  aiAudioElement?: HTMLAudioElement | null;
  /** Manual amplitude override (0..1). Bypasses stream analysers. */
  level?: number;
  /** Particle color when the user is talking. Default: orange. */
  userColor?: string;
  /** Particle color when the AI is talking. Default: Kodara green. */
  aiColor?: string;
  /** Particle color while idle. Defaults to aiColor. */
  idleColor?: string;
  /** Canvas size in px (square). Default 320. */
  size?: number;
  /** Number of particles. Default 560. */
  count?: number;
  /** Rotation speed multiplier (1 = default). Lower = slower spin. */
  spin?: number;
  /** Sphere⇄ring morph lerp rate per frame (0.08 = default). Lower = slower transition. */
  morphSpeed?: number;
  /**
   * Optional avatar image rendered as a circle in the cluster's center, IN FRONT of
   * the particles (nothing draws over the face). The shell dots ring tightly around
   * the avatar edge and spray outward — they orbit/pulse around its perimeter.
   */
  avatarSrc?: string;
  /** Avatar diameter as a fraction of canvas size. Default 0.46. */
  avatarScale?: number;
  /** Keep the particle ramp in a mid/dark range so it stays visible on a light bg. */
  light?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/* -------------------------------------------------------------------------- */
/*  Color helpers                                                              */
/* -------------------------------------------------------------------------- */

type RGB = [number, number, number];
interface Ramp { deep: RGB; brand: RGB; mint: RGB; hi: RGB; }

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}
function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) return [l, l, l];
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}
function buildRamp(hex: string, light = false): Ramp {
  const rgb = hexToRgb(hex);
  const [h, s] = rgbToHsl(rgb);
  // On a light background the near-white top of the ramp vanishes, so the cluster
  // looks like it only sits below the avatar. In light mode keep the whole ramp in a
  // visible mid/dark range so particles ring the avatar evenly.
  if (light) {
    return {
      deep: hslToRgb(h, Math.min(s, 1), 0.24),
      brand: rgb,
      mint: hslToRgb(h, Math.min(s * 0.9, 1), 0.44),
      hi: hslToRgb(h, Math.min(s * 0.85, 1), 0.32),
    };
  }
  return {
    deep: hslToRgb(h, Math.min(s, 1), 0.17),
    brand: rgb,
    mint: hslToRgb(h, Math.min(s * 0.75, 1), 0.78),
    hi: hslToRgb(h, Math.min(s * 0.5, 1), 0.96),
  };
}
function cloneRamp(r: Ramp): Ramp {
  return { deep: [...r.deep] as RGB, brand: [...r.brand] as RGB, mint: [...r.mint] as RGB, hi: [...r.hi] as RGB };
}
function lerpRamp(cur: Ramp, tgt: Ramp, k: number) {
  (["deep", "brand", "mint", "hi"] as const).forEach((key) => {
    for (let i = 0; i < 3; i++) cur[key][i] += (tgt[key][i] - cur[key][i]) * k;
  });
}
function mix3(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

interface Particle {
  x: number; y: number; z: number; seed: number;
  ra: number; rjx: number; rjy: number; rjz: number;
}

const elementSourceCache = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function VoiceOrbCluster({
  speaker = "idle",
  userStream = null,
  aiStream = null,
  aiAudioElement = null,
  level,
  userColor = "#FF7A00",
  aiColor = "#106844",
  idleColor,
  size = 320,
  count = 560,
  spin = 1,
  morphSpeed = 0.08,
  avatarSrc,
  avatarScale = 0.46,
  light = false,
  className,
  style,
}: VoiceOrbClusterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const speakerRef = useRef(speaker);
  const levelRef   = useRef(level);
  const sizeRef    = useRef(size);
  const spinRef    = useRef(spin);
  const morphRef   = useRef(morphSpeed);
  const avatarOnRef    = useRef(!!avatarSrc);
  const avatarScaleRef = useRef(avatarScale);

  const userRamp = useRef(buildRamp(userColor, light));
  const aiRamp   = useRef(buildRamp(aiColor, light));
  const idleRamp = useRef(buildRamp(idleColor ?? aiColor, light));

  useEffect(() => {
    speakerRef.current = speaker;
    levelRef.current   = level;
    sizeRef.current    = size;
    spinRef.current    = spin;
    morphRef.current   = morphSpeed;
    avatarOnRef.current    = !!avatarSrc;
    avatarScaleRef.current = avatarScale;
    userRamp.current   = buildRamp(userColor, light);
    aiRamp.current     = buildRamp(aiColor, light);
    idleRamp.current   = buildRamp(idleColor ?? aiColor, light);
  });

  /* ---- audio ---- */
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const userAnalyser = useRef<AnalyserNode | null>(null);
  const userBuf      = useRef<Uint8Array | null>(null);
  const aiAnalyser   = useRef<AnalyserNode | null>(null);
  const aiBuf        = useRef<Uint8Array | null>(null);

  const ensureCtx = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") void audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  useEffect(() => {
    if (!userStream) return;
    const ctx = ensureCtx();
    const src = ctx.createMediaStreamSource(userStream);
    const an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.78;
    src.connect(an); userAnalyser.current = an; userBuf.current = new Uint8Array(an.fftSize);
    return () => { try { src.disconnect(); an.disconnect(); } catch { /**/ } userAnalyser.current = null; };
  }, [userStream]);

  useEffect(() => {
    if (!aiStream) return;
    const ctx = ensureCtx();
    const src = ctx.createMediaStreamSource(aiStream);
    const an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.78;
    src.connect(an); aiAnalyser.current = an; aiBuf.current = new Uint8Array(an.fftSize);
    return () => { try { src.disconnect(); an.disconnect(); } catch { /**/ } aiAnalyser.current = null; };
  }, [aiStream]);

  useEffect(() => {
    if (!aiAudioElement) return;
    const ctx = ensureCtx();
    let src = elementSourceCache.get(aiAudioElement);
    if (!src) { src = ctx.createMediaElementSource(aiAudioElement); elementSourceCache.set(aiAudioElement, src); }
    const an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.78;
    src.connect(an); src.connect(ctx.destination);
    aiAnalyser.current = an; aiBuf.current = new Uint8Array(an.fftSize);
    return () => { try { an.disconnect(); } catch { /**/ } aiAnalyser.current = null; };
  }, [aiAudioElement]);

  /* ---- particles ---- */
  const particlesRef = useRef<Particle[]>([]);
  useEffect(() => {
    const arr: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const shell = 0.6 + Math.random() * 0.4;
      arr.push({
        x: r * Math.cos(th) * shell, y: u * shell, z: r * Math.sin(th) * shell,
        seed: Math.random() * 1000,
        ra: (i / count) * Math.PI * 2,
        rjx: Math.random() * 2 - 1,
        rjy: Math.random() * 2 - 1,
        rjz: Math.random() * 2 - 1,
      });
    }
    particlesRef.current = arr;
  }, [count]);

  /* ---- render loop ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const readRMS = (an: AnalyserNode, b: Uint8Array) => {
      an.getByteTimeDomainData(b as Uint8Array<ArrayBuffer>);
      let sum = 0;
      for (let i = 0; i < b.length; i++) { const v = (b[i] - 128) / 128; sum += v * v; }
      return Math.min(Math.sqrt(sum / b.length) * 4.2, 1);
    };

    // ring tilt: 1.45 rad (~83°) gives a top-view near-circle
    const TILT = 1.45, cT = Math.cos(TILT), sT = Math.sin(TILT);

    const cur = cloneRamp(idleRamp.current);
    let smoothLevel = 0, ay = 0, morph = 0, ringPhase = 0;
    let last = performance.now(), raf = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;
      const sp = speakerRef.current;
      const S  = sizeRef.current;

      /* canvas sizing */
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const dev = Math.round(S * dpr);
      if (canvas.width !== dev) { canvas.width = dev; canvas.height = dev; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const C   = S / 2;
      const ORB = S * 0.26;

      /* amplitude */
      let target = 0;
      if (typeof levelRef.current === "number") {
        target = Math.max(0, Math.min(1, levelRef.current));
      } else if ((sp === "user" || sp === "user-processing") && userAnalyser.current && userBuf.current) {
        target = readRMS(userAnalyser.current, userBuf.current);
      } else if (sp === "ai" && aiAnalyser.current && aiBuf.current) {
        target = readRMS(aiAnalyser.current, aiBuf.current);
      }
      smoothLevel += (target - smoothLevel) * (target > smoothLevel ? 0.35 : 0.1);
      const lvl = smoothLevel;

      /* color crossfade */
      const tgt = (sp === "user" || sp === "user-processing") ? userRamp.current
                : sp === "ai"        ? aiRamp.current
                : sp === "processing"? aiRamp.current
                :                      idleRamp.current;
      lerpRamp(cur, tgt, 0.06);

      /* ring morph */
      const processing = sp === "processing" || sp === "user-processing";
      morph     += ((processing ? 1 : 0) - morph) * morphRef.current;
      ay        += dt * (0.25 + lvl * 2.6) * spinRef.current;
      ringPhase += dt * (processing ? 1.6 : 0.4) * spinRef.current;

      ctx.clearRect(0, 0, S, S);

      /* particles */
      const ca    = Math.cos(ay), sa = Math.sin(ay);
      const amp   = processing ? 1.0 : 1 + lvl * 0.18;   // ring never expands
      const jit   = lvl * 0.11 * ORB;
      const small = 1 - lvl * 0.4;
      const pts   = particlesRef.current;
      const proj: { sx: number; sy: number; rz: number; ry: number }[] = [];

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        // sphere position
        const sx3 = p.x * ca - p.z * sa, sz3 = p.x * sa + p.z * ca, sy3 = p.y;
        // ring position (top-view, travelling)
        const a = p.ra + ringPhase, rr = 0.95;
        const rxr = Math.cos(a) * rr + p.rjx * 0.07;
        const ryr = p.rjy * 0.09;
        const rzr = Math.sin(a) * rr + p.rjz * 0.07;
        const ry_t = ryr * cT - rzr * sT;
        const rz_t = ryr * sT + rzr * cT;
        // morph
        const X = sx3 + (rxr - sx3) * morph;
        const Y = sy3 + (ry_t - sy3) * morph;
        const Z = sz3 + (rz_t - sz3) * morph;
        const persp = 1 + Z * 0.35;
        proj.push({
          sx: C + X * ORB * persp * amp + Math.sin(t * 3 + p.seed) * jit,
          sy: C + Y * ORB * persp * amp + Math.cos(t * 2.6 + p.seed * 1.3) * jit,
          rz: Z, ry: p.y,
        });
      }

      proj.sort((a, b) => a.rz - b.rz);

      // carve the interior so an avatar (if any) shows through cleanly: drop dots
      // landing inside 0.8× the avatar radius, keep the rim band + outward spray.
      const avatarOn = avatarOnRef.current;
      const rInnerSq = avatarOn ? Math.pow(S * avatarScaleRef.current * 0.5 * 0.8, 2) : 0;

      for (let k = 0; k < proj.length; k++) {
        const q  = proj[k];
        if (avatarOn) {
          const dx = q.sx - C, dy = q.sy - C;
          if (dx * dx + dy * dy < rInnerSq) continue;
        }
        const vt = (q.ry + 1) * 0.5;
        let c = vt < 0.5
          ? mix3(cur.deep, cur.brand, vt * 2)
          : mix3(cur.brand, cur.mint, (vt - 0.5) * 2);
        c = mix3(c, cur.hi, lvl * 0.4 * vt);
        const alpha = Math.min(0.22 + (q.rz + 1) * 0.25, 0.9) * (0.7 + lvl * 0.3);
        const rad   = Math.max((0.7 + (q.rz + 1) * 0.45) * small * (S / 150), 0.4);
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = `rgb(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0})`;
        ctx.beginPath();
        ctx.arc(q.sx, q.sy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed")
        void audioCtxRef.current.close();
    };
  }, []);

  if (!avatarSrc) {
    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{ width: size, height: size, display: "block", ...style }}
      />
    );
  }

  const avatarPx = Math.round(size * avatarScale);
  return (
    <div className={className} style={{ position: "relative", width: size, height: size, ...style }}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />
      {/* Avatar last in DOM → paints ON TOP of the particle canvas, so no dot ever
          covers the face; the carved-out interior keeps the dots ringing the edge. */}
      <div
        style={{
          position: "absolute", left: "50%", top: "50%", width: avatarPx, height: avatarPx,
          transform: "translate(-50%, -50%)", borderRadius: "50%", overflow: "hidden",
          boxShadow: "0 0 0 2px rgba(255,255,255,0.14), 0 8px 28px rgba(0,0,0,0.45)",
        }}
      >
        <Image src={avatarSrc} alt="" fill sizes={`${avatarPx}px`} style={{ objectFit: "cover" }} />
      </div>
    </div>
  );
}
