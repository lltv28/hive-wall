import { createLeads } from "@/lib/adStage";

export interface LeadIdentity {
  id: number;
  seed: number;
  leadNo: number;
  name: string;
  initials: string;
}

// 12 × 8 = 96 unique combinations, so a straight index split gives every
// lead node its own name without any collision handling.
const FIRST_NAMES = [
  "Jordan", "Avery", "Morgan", "Riley", "Casey", "Taylor",
  "Quinn", "Rowan", "Skyler", "Emerson", "Harper", "Sawyer",
];

const LAST_NAMES = [
  "Lee", "Nakamura", "Osei", "Brooks", "Chen", "Alvarez", "Whitfield", "Reyes",
];

export const LEAD_COUNT = 96;
export const FIRST_LEAD_NO = 101;

export function buildLeadIdentities(count: number = LEAD_COUNT): LeadIdentity[] {
  return createLeads(count).map((lead, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length]!;
    const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]!;
    return {
      id: lead.id,
      seed: lead.seed,
      leadNo: FIRST_LEAD_NO + index,
      name: `${firstName} ${lastName}`,
      initials: `${firstName[0]}${lastName[0]}`,
    };
  });
}
