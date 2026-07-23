// Shared types for the Sales Brain graph + entity model.

export type Squad = { id: string; name: string; color: string };

export type Agent = {
  id: string; name: string; initials: string; squadId: string; role: string;
  status: 'working' | 'idle'; currentTask: string;
  sales: number; calls: number; revenue: number;
  playbookId: string; toolIds: string[]; leadIds: string[]; subAgentIds: string[];
  permissions: { label: string; allowed: boolean }[];
};
export type SubAgent = { id: string; name: string; squadId: string | null };
export type Lead = {
  id: string; name: string; source: 'IG ad' | 'FB ad' | 'YouTube' | 'TikTok';
  stage: string; agentId: string; valueUsd: number; outcome: 'working' | 'buy' | 'book';
};
export type Tool = { id: string; name: string };
export type Offer = { id: string; name: string; priceUsd: number; steps: string[] };

export type NodeType = 'core' | 'hub' | 'agent' | 'lead' | 'tool' | 'offer';
// tier drives the ring radius in layout: 0 core, 1 hub, 2 lead, 3 tool/offer, 4 agent
export type GNode = {
  id: string; type: NodeType; tier: number; label: string;
  initials?: string; squadId?: string; color: string;
};
export type GEdge = { source: string; target: string; kind: 'hub' | 'squad' | 'access' | 'working' };
export type Positioned = GNode & { x: number; y: number; tierIndex: number; tierCount: number };

export type BrainModel = {
  squads: Squad[]; agents: Agent[]; subAgents: SubAgent[]; leads: Lead[];
  tools: Tool[]; offers: Offer[]; nodes: GNode[]; edges: GEdge[];
};
