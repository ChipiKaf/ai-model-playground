import type {
  VizScene,
  VizNode,
  VizEdge,
  NodeLabel,
  EdgeLabel,
  AnimationConfig,
  VizOverlaySpec,
  VizGridConfig,
} from "./types";
import { DEFAULT_VIZ_CSS } from "./styles";
import { defaultRegistry } from "./animations";
import { defaultCoreOverlayRegistry } from "./overlays";

interface VizBuilder {
  view(w: number, h: number): VizBuilder;
  grid(cols: number, rows: number, padding?: { x: number; y: number }): VizBuilder;
  overlay<T>(id: string, params: T, key?: string): VizBuilder;
  node(id: string): NodeBuilder;
  edge(from: string, to: string, id?: string): EdgeBuilder;
  build(): VizScene;

  // Internal helper for NodeBuilder to access grid config
  _getGridConfig(): VizGridConfig | null;
  _getViewBox(): { w: number; h: number };
  svg(): string;
}

interface NodeBuilder {
  at(x: number, y: number): NodeBuilder;
  cell(col: number, row: number, align?: 'center' | 'start' | 'end'): NodeBuilder;
  circle(r: number): NodeBuilder;
  rect(w: number, h: number, rx?: number): NodeBuilder;
  diamond(w: number, h: number): NodeBuilder;
  label(text: string, opts?: Partial<NodeLabel>): NodeBuilder;
  class(name: string): NodeBuilder;
  animate(type: string, config?: AnimationConfig): NodeBuilder;
  data(payload: unknown): NodeBuilder;
  onClick(handler: (id: string, node: VizNode) => void): NodeBuilder;
  done(): VizBuilder;

  // Seamless chaining extensions
  node(id: string): NodeBuilder;
  edge(from: string, to: string, id?: string): EdgeBuilder;
  overlay<T>(id: string, params: T, key?: string): VizBuilder;
  build(): VizScene;
  svg(): string;
}

interface EdgeBuilder {
  straight(): EdgeBuilder;
  label(text: string, opts?: Partial<EdgeLabel>): EdgeBuilder;
  arrow(enabled?: boolean): EdgeBuilder;
  class(name: string): EdgeBuilder;
  hitArea(px: number): EdgeBuilder;
  animate(type: string, config?: AnimationConfig): EdgeBuilder;
  data(payload: unknown): EdgeBuilder;
  onClick(handler: (id: string, edge: VizEdge) => void): EdgeBuilder;
  done(): VizBuilder;

  // Seamless chaining extensions
  node(id: string): NodeBuilder;
  edge(from: string, to: string, id?: string): EdgeBuilder;
  overlay<T>(id: string, params: T, key?: string): VizBuilder;
  build(): VizScene;
  svg(): string;
}

class VizBuilderImpl implements VizBuilder {
  private _viewBox = { w: 800, h: 600 };
  private _nodes = new Map<string, Partial<VizNode>>();
  private _edges = new Map<string, Partial<VizEdge>>();
  private _overlays: VizOverlaySpec[] = [];
  private _nodeOrder: string[] = [];
  private _edgeOrder: string[] = [];
  private _gridConfig: VizGridConfig | null = null;

  view(w: number, h: number): VizBuilder {
    this._viewBox = { w, h };
    return this;
  }

  grid(cols: number, rows: number, padding: { x: number; y: number } = { x: 20, y: 20 }): VizBuilder {
      this._gridConfig = { cols, rows, padding };
      return this;
  }

  overlay<T>(id: string, params: T, key?: string): VizBuilder {
      this._overlays.push({ id, params, key });
      return this;
  }

  node(id: string): NodeBuilder {
    if (!this._nodes.has(id)) {
      // Set default position and shape
      this._nodes.set(id, { id, pos: { x: 0, y: 0 }, shape: { kind: "circle", r: 10 } });
      this._nodeOrder.push(id);
    }
    return new NodeBuilderImpl(this, this._nodes.get(id)!); // The ! asserts that the node exists, because we just added it
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
      grid: this._gridConfig || undefined,
      nodes,
      edges,
      overlays: this._overlays,
    };
  }

  _getGridConfig(): VizGridConfig | null {
      return this._gridConfig;
  }

  _getViewBox() {
      return this._viewBox;
  }
  
  svg(): string {
      const scene = this.build();
      return this._renderSceneToSvg(scene);
  }

  private _renderSceneToSvg(scene: VizScene): string {
      const { viewBox, nodes, edges, overlays } = scene;
      const nodesById = new Map(nodes.map(n => [n.id, n]));
      const edgesById = new Map(edges.map(e => [e.id, e]));

      let svgContent = `<svg viewBox="0 0 ${viewBox.w} ${viewBox.h}" xmlns="http://www.w3.org/2000/svg">`;
      
      // Inject Styles
      svgContent += `<style>${DEFAULT_VIZ_CSS}</style>`;

      // Defs (Arrow Marker)
      svgContent += `
        <defs>
          <marker id="viz-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
          </marker>
        </defs>`;

      // Render Edges
      svgContent += `<g class="viz-layer-edges">`;
      edges.forEach(edge => {
          const start = nodesById.get(edge.from);
          const end = nodesById.get(edge.to);
          if (!start || !end) return;

          // Animations
          let animClasses = "";
          let animStyleStr = "";

          if (edge.animations) {
              edge.animations.forEach(spec => {
                  const renderer = defaultRegistry.getEdgeRenderer(spec.id);
                  if (renderer) {
                      if (renderer.getClass) {
                          animClasses += ` ${renderer.getClass({ spec, element: edge })}`;
                      }
                      if (renderer.getStyle) {
                          const styles = renderer.getStyle({ spec, element: edge });
                          Object.entries(styles).forEach(([k, v]) => {
                              animStyleStr += `${k}: ${v}; `;
                          });
                      }
                  }
              });
          }

          const markerEnd = edge.markerEnd === "arrow" ? 'marker-end="url(#viz-arrow)"' : '';
          
          svgContent += `<g class="viz-edge-group ${edge.className || ''} ${animClasses}" style="${animStyleStr}">`;
          svgContent += `<line x1="${start.pos.x}" y1="${start.pos.y}" x2="${end.pos.x}" y2="${end.pos.y}" class="viz-edge" ${markerEnd} stroke="currentColor" />`;

          // Edge Label
          if (edge.label) {
             const mx = (start.pos.x + end.pos.x) / 2 + (edge.label.dx || 0);
             const my = (start.pos.y + end.pos.y) / 2 + (edge.label.dy || 0);
             const labelClass = `viz-edge-label ${edge.label.className || ''}`;
             svgContent += `<text x="${mx}" y="${my}" class="${labelClass}" text-anchor="middle" dominant-baseline="middle">${edge.label.text}</text>`;
          }
           svgContent += `</g>`;
      });
      svgContent += `</g>`;

      // Render Nodes
      svgContent += `<g class="viz-layer-nodes">`;
      nodes.forEach(node => {
          const { x, y } = node.pos;
          const { shape } = node;
          
          // Animations (Nodes)
          let animClasses = "";
           let animStyleStr = "";

          if (node.animations) {
              node.animations.forEach(spec => {
                  const renderer = defaultRegistry.getNodeRenderer(spec.id);
                   if (renderer) {
                      if (renderer.getClass) {
                          animClasses += ` ${renderer.getClass({ spec, element: node })}`;
                      }
                      if (renderer.getStyle) {
                          const styles = renderer.getStyle({ spec, element: node });
                          Object.entries(styles).forEach(([k, v]) => {
                              animStyleStr += `${k}: ${v}; `;
                          });
                      }
                  }
              });
          }

          const className = `viz-node-group ${node.className || ''} ${animClasses}`;
          
          svgContent += `<g class="${className}" style="${animStyleStr}">`;
          
          // Shape
          if (shape.kind === 'circle') {
             svgContent += `<circle cx="${x}" cy="${y}" r="${shape.r}" class="viz-node-shape" />`;
          } else if (shape.kind === 'rect') {
             svgContent += `<rect x="${x - shape.w/2}" y="${y - shape.h/2}" width="${shape.w}" height="${shape.h}" rx="${shape.rx || 0}" class="viz-node-shape" />`;
          } else if (shape.kind === 'diamond') {
             const hw = shape.w / 2;
             const hh = shape.h / 2;
             const pts = `${x},${y-hh} ${x+hw},${y} ${x},${y+hh} ${x-hw},${y}`;
             svgContent += `<polygon points="${pts}" class="viz-node-shape" />`;
          }
          
          // Label
          if (node.label) {
             const lx = x + (node.label.dx || 0);
             const ly = y + (node.label.dy || 0);
             const labelClass = `viz-node-label ${node.label.className || ''}`;
             svgContent += `<text x="${lx}" y="${ly}" class="${labelClass}" text-anchor="middle" dominant-baseline="middle">${node.label.text}</text>`;
          }
          
          svgContent += `</g>`;
      });
      svgContent += `</g>`;

      // Render Overlays
      if (overlays && overlays.length > 0) {
          svgContent += `<g class="viz-layer-overlays">`;
          overlays.forEach(spec => {
              const renderer = defaultCoreOverlayRegistry.get(spec.id);
              if (renderer) {
                  svgContent += renderer.render({ spec, nodesById, edgesById, scene });
              }
          });
          svgContent += `</g>`;
      }

      svgContent += `</svg>`;
      return svgContent;
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

  cell(col: number, row: number, align: 'center' | 'start' | 'end' = 'center'): NodeBuilder {
      const grid = this.parent._getGridConfig();
      if (!grid) {
          console.warn("VizBuilder: .cell() called but no grid configured. Use .grid() first.");
          return this;
      }
      
      const view = this.parent._getViewBox();
      const availableW = view.w - (grid.padding.x * 2);
      const availableH = view.h - (grid.padding.y * 2);
      
      const cellW = availableW / grid.cols;
      const cellH = availableH / grid.rows;

      let x = grid.padding.x + (col * cellW);
      let y = grid.padding.y + (row * cellH);

      // Alignment adjustments
      if (align === 'center') {
          x += cellW / 2;
          y += cellH / 2;
      } else if (align === 'end') {
          x += cellW;
          y += cellH;
      }
      
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

  animate(type: string, config?: AnimationConfig): NodeBuilder {
      if (!this.nodeDef.animations) {
          this.nodeDef.animations = [];
      }
      this.nodeDef.animations.push({ id: type, params: config });
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
  overlay<T>(id: string, params: T, key?: string): VizBuilder {
    return this.parent.overlay(id, params, key);
  }
  build(): VizScene {
    return this.parent.build();
  }
  svg(): string {
     return this.parent.svg();
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

  animate(type: string, config?: AnimationConfig): EdgeBuilder {
      if (!this.edgeDef.animations) {
          this.edgeDef.animations = [];
      }
      this.edgeDef.animations.push({ id: type, params: config });
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
  overlay<T>(id: string, params: T, key?: string): VizBuilder {
      return this.parent.overlay(id, params, key);
  }
  build(): VizScene {
    return this.parent.build();
  }
  svg(): string {
     return this.parent.svg();
  }
}

export function viz(): VizBuilder {
  return new VizBuilderImpl();
}
