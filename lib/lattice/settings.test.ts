import { describe, expect, it } from "vitest";
import { VAULT_PRESET, normalizeSettings } from "./settings";

describe("settings", () => {
  it("loads the approved defaults", () => {
    expect(VAULT_PRESET.nodeCount).toBe(220);
    expect(VAULT_PRESET.linkDensity).toBe(0.08);
  });

  it("clamps unsafe settings", () => {
    const value = normalizeSettings({ nodeCount: 5000, linkDensity: 9 });
    expect(value.nodeCount).toBe(400);
    expect(value.linkDensity).toBe(0.3);
  });

  it("defaults growEnabled to false and passes explicit values through", () => {
    expect(VAULT_PRESET.growEnabled).toBe(false);
    expect(normalizeSettings({}).growEnabled).toBe(false);
    expect(normalizeSettings({ growEnabled: true }).growEnabled).toBe(true);
  });

  it("defaults and clamps the growth pace settings", () => {
    expect(VAULT_PRESET.growIntervalSeconds).toBe(2);
    expect(VAULT_PRESET.growNodesPerBatch).toBe(1);

    const clamped = normalizeSettings({ growIntervalSeconds: 50, growNodesPerBatch: 20 });
    expect(clamped.growIntervalSeconds).toBe(5);
    expect(clamped.growNodesPerBatch).toBe(3);

    const floored = normalizeSettings({ growIntervalSeconds: 0.01 });
    expect(floored.growIntervalSeconds).toBe(0.1);

    const passthrough = normalizeSettings({ growIntervalSeconds: 1.5, growNodesPerBatch: 2 });
    expect(passthrough.growIntervalSeconds).toBe(1.5);
    expect(passthrough.growNodesPerBatch).toBe(2);
  });
});
