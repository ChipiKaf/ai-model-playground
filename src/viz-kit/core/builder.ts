import type {
  VizScene,
  VizNode,
  VizEdge,
  NodeLabel,
  EdgeLabel,
} from "./types";

interface VizBuilder {
  view(w: number, h: number): VizBuilder;
  node(id: string): NodeBuilder;
  edge(from: string, to: string, id?: string): EdgeBuilder;
  build(): VizScene;
}

interface NodeBuilder {
  at(x: number, y: number): NodeBuilder;
  circle(r: number): NodeBuilder;
  rect(w: number, h: number, rx?: number): NodeBuilder;
  diamond(w: number, h: number): NodeBuilder;
  label(text: string, opts?: Partial<NodeLabel>): NodeBuilder;
  class(name: string): NodeBuilder;
  data(payload: unknown): NodeBuilder;
  onClick(handler: (id: string, node: VizNode) => void): NodeBuilder;
  done(): VizBuilder;

  // Seamless chaining extensions
  node(id: string): NodeBuilder;
  edge(from: string, to: string, id?: string): EdgeBuilder;
  build(): VizScene;
}

interface EdgeBuilder {
  straight(): EdgeBuilder;
  label(text: string, opts?: Partial<EdgeLabel>): EdgeBuilder;
  arrow(enabled?: boolean): EdgeBuilder;
  class(name: string): EdgeBuilder;
  hitArea(px: number): EdgeBuilder;
  data(payload: unknown): EdgeBuilder;
  onClick(handler: (id: string, edge: VizEdge) => void): EdgeBuilder;
  done(): VizBuilder;

  // Seamless chaining extensions
  node(id: string): NodeBuilder;
  edge(from: string, to: string, id?: string): EdgeBuilder;
  build(): VizScene;
}

class VizBuilderImpl implements VizBuilder {
  private _viewBox = { w: 800, h: 600 };
  private _nodes = new Map<string, Partial<VizNode>>();
  private _edges = new Map<string, Partial<VizEdge>>();
  private _nodeOrder: string[] = [];
  private _edgeOrder: string[] = [];

  view(w: number, h: number): VizBuilder {
    this._viewBox = { w, h };
    return this;
  }

  node(id: string): NodeBuilder {
    if (!this._nodes.has(id)) {
      this._nodes.set(id, { id, pos: { x: 0, y: 0 }, shape: { kind: "circle", r: 10 } });
      this._nodeOrder.push(id);
    }
    return new NodeBuilderImpl(this, this._nodes.get(id)!);
  }

  edge(from: string, to: string, id?: string): EdgeBuilder {
    const edgeId = id || `${from}->${to}`;
    if (!this._edges.has(edgeId)) {
      this._edges.set(edgeId, { id: edgeId, from, to });
      this._edgeOrder.push(edgeId);
    }
    return new EdgeBuilderImpl(this, this._edges.get(edgeId)!);
  }

  build(): VizScene {
    this._edges.forEach((edge) => {
      if (!this._nodes.has(edge.from!)) {
        console.warn(`VizBuilder: Edge ${edge.id} references missing source node ${edge.from}`);
      }
      if (!this._nodes.has(edge.to!)) {
        console.warn(`VizBuilder: Edge ${edge.id} references missing target node ${edge.to}`);
      }
    });

    const nodes = this._nodeOrder.map((id) => this._nodes.get(id) as VizNode);
    const edges = this._edgeOrder.map((id) => this._edges.get(id) as VizEdge);

    return {
      viewBox: this._viewBox,
      nodes,
      edges,
    };
  }
}

class NodeBuilderImpl implements NodeBuilder {
  private parent: VizBuilder;
  private nodeDef: Partial<VizNode>;

  constructor(parent: VizBuilder, nodeDef: Partial<VizNode>) {
    this.parent = parent;
    this.nodeDef = nodeDef;
  }

  at(x: number, y: number): NodeBuilder {
    this.nodeDef.pos = { x, y };
    return this;
  }

  circle(r: number): NodeBuilder {
    this.nodeDef.shape = { kind: "circle", r };
    return this;
  }

  rect(w: number, h: number, rx?: number): NodeBuilder {
    this.nodeDef.shape = { kind: "rect", w, h, rx };
    return this;
  }

  diamond(w: number, h: number): NodeBuilder {
    this.nodeDef.shape = { kind: "diamond", w, h };
    return this;
  }

  label(text: string, opts?: Partial<NodeLabel>): NodeBuilder {
    this.nodeDef.label = { text, ...opts };
    return this;
  }

  class(name: string): NodeBuilder {
    if (this.nodeDef.className) {
        this.nodeDef.className += ` ${name}`;
    } else {
        this.nodeDef.className = name;
    }
    return this;
  }

  data(payload: unknown): NodeBuilder {
    this.nodeDef.data = payload;
    return this;
  }

  onClick(handler: (id: string, node: VizNode) => void): NodeBuilder {
    this.nodeDef.onClick = handler;
    return this;
  }

  done(): VizBuilder {
    return this.parent;
  }

  // Chaining
  node(id: string): NodeBuilder {
    return this.parent.node(id);
  }
  edge(from: string, to: string, id?: string): EdgeBuilder {
    return this.parent.edge(from, to, id);
  }
  build(): VizScene {
    return this.parent.build();
  }
}

class EdgeBuilderImpl implements EdgeBuilder {
  private parent: VizBuilder;
  private edgeDef: Partial<VizEdge>;

  constructor(parent: VizBuilder, edgeDef: Partial<VizEdge>) {
    this.parent = parent;
    this.edgeDef = edgeDef;
  }

  straight(): EdgeBuilder {
    // No-op for now as it is default
    return this;
  }

  label(text: string, opts?: Partial<EdgeLabel>): EdgeBuilder {
    this.edgeDef.label = { position: "mid", text, ...opts };
    return this;
  }

  arrow(enabled: boolean = true): EdgeBuilder {
    this.edgeDef.markerEnd = enabled ? "arrow" : "none";
    return this;
  }

  class(name: string): EdgeBuilder {
      if (this.edgeDef.className) {
          this.edgeDef.className += ` ${name}`;
      } else {
          this.edgeDef.className = name;
      }
    return this;
  }

  hitArea(px: number): EdgeBuilder {
    this.edgeDef.hitArea = px;
    return this;
  }

  data(payload: unknown): EdgeBuilder {
    this.edgeDef.data = payload;
    return this;
  }

  onClick(handler: (id: string, edge: VizEdge) => void): EdgeBuilder {
    this.edgeDef.onClick = handler;
    return this;
  }

  done(): VizBuilder {
    return this.parent;
  }

  // Chaining
  node(id: string): NodeBuilder {
    return this.parent.node(id);
  }
  edge(from: string, to: string, id?: string): EdgeBuilder {
    return this.parent.edge(from, to, id);
  }
  build(): VizScene {
    return this.parent.build();
  }
}

export function viz(): VizBuilder {
  return new VizBuilderImpl();
}
