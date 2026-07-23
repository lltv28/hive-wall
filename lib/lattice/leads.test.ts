import { describe, expect, it } from "vitest";
import { buildLeadIdentities } from "./leads";

describe("buildLeadIdentities", () => {
  it("builds 96 leads numbered 101 through 196", () => {
    const leads = buildLeadIdentities();
    expect(leads).toHaveLength(96);
    expect(leads[0]!.leadNo).toBe(101);
    expect(leads[95]!.leadNo).toBe(196);
  });

  it("gives every lead a unique name and a unique id", () => {
    const leads = buildLeadIdentities();
    expect(new Set(leads.map((lead) => lead.name)).size).toBe(96);
    expect(new Set(leads.map((lead) => lead.id)).size).toBe(96);
  });

  it("derives two-letter initials from the name", () => {
    const [first] = buildLeadIdentities();
    const [firstName, lastName] = first!.name.split(" ");
    expect(first!.initials).toBe(`${firstName![0]}${lastName![0]}`);
  });

  it("is deterministic across calls", () => {
    expect(buildLeadIdentities()).toEqual(buildLeadIdentities());
  });
});
