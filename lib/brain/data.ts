// Seeded, deterministic Sales Brain model — the Lucas AI sales floor as an org
// graph. No backend; everything derives from a fixed seed so the app looks
// identical on every recording. Per-agent stats reuse makeAgentStats.
import { makeAgentStats } from '@/lib/adStage';
import { createSeededRandom } from '@/lib/demoAuto';
import type {
  Agent, BrainModel, GEdge, GNode, Lead, Offer, Squad, SubAgent, Tool,
} from './types';

export const SQUADS: Squad[] = [
  { id: 'acq', name: 'Acquisition', color: '#2563EB' },
  { id: 'qual', name: 'Qualifying', color: '#16A46C' },
  { id: 'close', name: 'Closing', color: '#D97706' },
  { id: 'book', name: 'Booking', color: '#7C3AED' },
  { id: 'follow', name: 'Follow-up', color: '#DB2777' },
  { id: 'react', name: 'Reactivation', color: '#0891B2' },
];

const FIRST = ['Brandon', 'Marcia', 'Andrew', 'Nina', 'Anika', 'Laura', 'Kwame', 'Jessica', 'Robert', 'Benjamin', 'Diego', 'Sofia', 'Tara', 'Hassan', 'Elena', 'Jacob', 'Sora', 'Liam', 'Ava', 'Noah', 'Maya', 'Devon', 'Priya', 'Jake', 'Ruth', 'Cole', 'Tess', 'Gabe', 'Mara', 'Evan', 'Vera', 'Leo', 'Rafa', 'Sana', 'Aria', 'Jonah', 'Mira', 'Caleb', 'Nadia', 'Kira', 'Drew', 'Paloma', 'Sage', 'Lena'];
const LAST = ['Liu', 'Chen', 'Kowalski', 'Patel', 'Gupta', 'Bennett', 'Asante', 'Alvarez', 'Okoye', 'Foster', 'Morales', 'Park', 'Nguyen', 'Vance', 'Cruz', 'Cole', 'Kim', 'Ortiz', 'Brooks', 'Vega', 'Reyes', 'Shah', 'Rao', 'Kerr', 'Webb', 'Mann', 'Frost', 'Dunn', 'Abel', 'Ware', 'Holt', 'Pike', 'Rossi', 'Dey', 'Nash', 'Tran', 'Bauer', 'Cano', 'Ali', 'Wood', 'Reed', 'Glass', 'Romero', 'Marsh'];
const ROLES = ['SDR', 'Closer', 'Setter', 'Account Exec', 'Retention Rep'];
const TASKS = ['Greeting a new lead', 'Asking qualifying questions', 'Presenting the offer', 'Handling an objection', 'Sending the checkout link', 'Booking a strategy call', 'Following up on a no-show'];

const SUB_AGENTS: SubAgent[] = [
  { id: 'sa:qualifier', name: 'Qualifier', squadId: 'qual' },
  { id: 'sa:objection', name: 'Objection-Handler', squadId: 'close' },
  { id: 'sa:closer', name: 'Closer', squadId: 'close' },
  { id: 'sa:booker', name: 'Booker', squadId: 'book' },
  { id: 'sa:followwriter', name: 'Follow-up Writer', squadId: 'follow' },
  { id: 'sa:scorer', name: 'Lead Scorer', squadId: 'acq' },
  { id: 'sa:transcript', name: 'Transcript Analyzer', squadId: null },
  { id: 'sa:offerpicker', name: 'Offer Picker', squadId: null },
];
const TOOLS: Tool[] = [
  { id: 'tool:hyros', name: 'Hyros' }, { id: 'tool:stripe', name: 'Stripe' },
  { id: 'tool:cal', name: 'Google Calendar' }, { id: 'tool:crm', name: 'CRM' },
  { id: 'tool:quiz', name: 'Quiz Funnel' }, { id: 'tool:slack', name: 'Slack' },
  { id: 'tool:gmail', name: 'Gmail' }, { id: 'tool:meta', name: 'Meta Ads' },
];
const OFFERS: Offer[] = [
  { id: 'offer:report', name: 'Low-Ticket Report', priceUsd: 27, steps: ['Quiz', 'Paywall', 'Checkout', 'Order bump'] },
  { id: 'offer:call', name: 'Strategy Call', priceUsd: 0, steps: ['Qualify', 'Book', 'Remind', 'Show'] },
  { id: 'offer:core', name: 'Core Program', priceUsd: 1497, steps: ['Pitch', 'Objections', 'Close'] },
  { id: 'offer:bump', name: 'Order Bump', priceUsd: 47, steps: ['Offer at checkout'] },
  { id: 'offer:upsell', name: 'Upsell', priceUsd: 297, steps: ['Post-purchase offer'] },
];
const SOURCES: Lead['source'][] = ['IG ad', 'FB ad', 'YouTube', 'TikTok'];

function initials(name: string): string {
  const p = name.split(' ');
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}

export function buildModel(): BrainModel {
  const rnd = createSeededRandom(20260610);
  const stats = makeAgentStats(44, 6011);

  const agents: Agent[] = Array.from({ length: 44 }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`;
    const squad = SQUADS[i % SQUADS.length];
    const toolIds = TOOLS.filter(() => rnd() < 0.4).map((t) => t.id).slice(0, 3);
    return {
      id: `agent:${i}`, name, initials: initials(name), squadId: squad.id,
      role: ROLES[i % ROLES.length], status: rnd() < 0.85 ? 'working' : 'idle',
      currentTask: TASKS[Math.floor(rnd() * TASKS.length)],
      sales: stats[i].sales, calls: stats[i].calls, revenue: stats[i].revenue,
      playbookId: OFFERS[i % OFFERS.length].id, toolIds,
      leadIds: [], subAgentIds: [SUB_AGENTS[i % SUB_AGENTS.length].id],
      permissions: [
        { label: 'Read lead conversations', allowed: true },
        { label: 'Charge cards via Stripe', allowed: squad.id === 'close' },
        { label: 'Book on the shared calendar', allowed: squad.id === 'book' || squad.id === 'qual' },
        { label: 'Export raw lead PII', allowed: false },
      ],
    };
  });

  const leads: Lead[] = Array.from({ length: 30 }, (_, i) => {
    const agent = agents[Math.floor(rnd() * agents.length)];
    const r = rnd();
    const outcome: Lead['outcome'] = r < 0.45 ? 'working' : r < 0.8 ? 'buy' : 'book';
    const lead: Lead = {
      id: `lead:${i}`, name: `${FIRST[(i * 7) % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`,
      source: SOURCES[i % SOURCES.length], stage: TASKS[i % TASKS.length],
      agentId: agent.id, valueUsd: outcome === 'buy' ? (rnd() < 0.6 ? 27 : 297) : 0, outcome,
    };
    agent.leadIds.push(lead.id);
    return lead;
  });

  // ── Graph nodes ──
  const nodes: GNode[] = [];
  nodes.push({ id: 'core', type: 'core', tier: 0, label: 'Lucas AI', color: '#111418' });
  for (const s of SQUADS) nodes.push({ id: `hub:${s.id}`, type: 'hub', tier: 1, label: s.name, squadId: s.id, color: s.color });
  for (let i = 0; i < 30; i++) nodes.push({ id: `leaddot:${i}`, type: 'lead', tier: 2, label: leads[i]?.name ?? `Lead ${i}`, color: i % 2 ? '#e0b400' : '#c2c7cf' });
  TOOLS.forEach((t) => nodes.push({ id: `node:${t.id}`, type: 'tool', tier: 3, label: t.name, color: '#64748b' }));
  OFFERS.forEach((o, i) => nodes.push({ id: `node:${o.id}`, type: 'offer', tier: 3, label: o.name, color: SQUADS[i % SQUADS.length].color }));
  for (const a of agents) {
    const color = SQUADS.find((s) => s.id === a.squadId)!.color;
    nodes.push({ id: a.id, type: 'agent', tier: 4, label: a.name, initials: a.initials, squadId: a.squadId, color });
  }

  // ── Graph edges ──
  const edges: GEdge[] = [];
  for (const s of SQUADS) edges.push({ source: 'core', target: `hub:${s.id}`, kind: 'hub' });
  for (const a of agents) edges.push({ source: `hub:${a.squadId}`, target: a.id, kind: 'squad' });
  for (const a of agents) for (const t of a.toolIds) edges.push({ source: a.id, target: `node:${t}`, kind: 'access' });

  return { squads: SQUADS, agents, subAgents: SUB_AGENTS, leads, tools: TOOLS, offers: OFFERS, nodes, edges };
}

export const squadColor = (id: string | undefined) => SQUADS.find((s) => s.id === id)?.color ?? '#64748b';
export const squadName = (id: string | undefined) => SQUADS.find((s) => s.id === id)?.name ?? '';
