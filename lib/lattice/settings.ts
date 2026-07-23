export interface VisualSettings {
  nodeCount: number;
  linkDensity: number;
  growEnabled: boolean;
  growIntervalSeconds: number;
  growNodesPerBatch: number;
}

export const VAULT_PRESET: VisualSettings = {
  nodeCount: 220,
  linkDensity: 0.08,
  growEnabled: false,
  growIntervalSeconds: 2,
  growNodesPerBatch: 1,
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export function normalizeSettings(input: Partial<VisualSettings>): VisualSettings {
  return {
    ...VAULT_PRESET,
    ...input,
    nodeCount: Math.round(clamp(input.nodeCount ?? VAULT_PRESET.nodeCount, 80, 400)),
    linkDensity: clamp(input.linkDensity ?? VAULT_PRESET.linkDensity, 0.02, 0.3),
    growEnabled: input.growEnabled ?? VAULT_PRESET.growEnabled,
    growIntervalSeconds: clamp(
      input.growIntervalSeconds ?? VAULT_PRESET.growIntervalSeconds,
      0.1,
      5,
    ),
    growNodesPerBatch: Math.round(
      clamp(input.growNodesPerBatch ?? VAULT_PRESET.growNodesPerBatch, 1, 3),
    ),
  };
}
