export type WheelRing = "center" | "hub" | "gray" | "gold" | "icon" | "avatar" | "satellite";

export interface WheelNode {
  id: string;
  ring: WheelRing;
  zoneIndex?: number;
  angle: number;
  radiusFraction: number;
  radius: number;
  color: string;
  label?: string;
  initials?: string;
  leadId?: number;
  closed?: boolean;
}

export interface WheelLink {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface WheelGraph {
  nodes: WheelNode[];
  links: WheelLink[];
}
