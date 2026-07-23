// Dark surface tokens for the Hive rail. The funnel-shared `C` tokens in
// lib/adStage.tsx are light and must NOT be edited (the funnel depends on them),
// so the rail carries its own dark palette. Green accent matches the brain.
export const RAIL = {
  panel: "#111c2e",
  border: "#334155",
  ink: "#f1f5f9",
  muted: "#94a3b8",
  green: "#4ade80",
  slate: "#94a3b8",
  shadow: "0 8px 24px rgba(0,0,0,0.35)",
  radius: "16px",
  radiusSm: "14px",
} as const;
