export type Vec2 = { x: number; y: number };

export type NodeShape =
  | { kind: "circle"; r: number }
  | { kind: "rect"; w: number; h: number; rx?: number }
  | { kind: "diamond"; w: number; h: number };

export type NodeLabel = {
  text: string;
  dx?: number;
  dy?: number;
  className?: string;
};

export type AnimationDuration = `${number}s`;

export interface AnimationConfig {
  duration?: AnimationDuration;
  [key: string]: any;
}

export interface VizAnimation {
  type: string;
  config?: AnimationConfig;
}

export interface VizNode {
  id: string;
  pos: Vec2;
  shape: NodeShape;
  label?: NodeLabel;
  className?: string; // e.g. "active", "input-layer"
  data?: unknown; // User payload
  onClick?: (id: string, node: VizNode) => void;
  animation?: VizAnimation;
}

export interface EdgeLabel {
  text: string;
  position: "start" | "mid" | "end"; // Simplified for now
  className?: string;
  dx?: number;
  dy?: number;
}

export interface VizEdge {
  id: string;
  from: string;
  to: string;
  label?: EdgeLabel;
  markerEnd?: "arrow" | "none";
  className?: string;
  hitArea?: number; // width in px
  data?: unknown;
  onClick?: (id: string, edge: VizEdge) => void;
  animation?: VizAnimation;
}

export type VizOverlay = {
  kind: "custom"; // placeholder for now
  id: string;
  render?: unknown;
};

export type VizScene = {
  viewBox: { w: number; h: number };
  nodes: VizNode[];
  edges: VizEdge[];
  overlays?: VizOverlay[];
};
