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

export type VizNode = {
  id: string;
  pos: Vec2;
  shape: NodeShape;
  className?: string;
  label?: NodeLabel;
  data?: unknown;
  onClick?: (nodeId: string, node: VizNode) => void;
};

export type EdgeLabel = {
  text: string;
  position?: "mid"; // MVP only
  dx?: number;
  dy?: number;
  className?: string;
};

export type VizEdge = {
  id: string;
  from: string;
  to: string;
  className?: string;
  label?: EdgeLabel;
  markerEnd?: "arrow" | "none";
  hitArea?: number; // px stroke width for transparent hit line
  data?: unknown;
  onClick?: (edgeId: string, edge: VizEdge) => void;
};

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
