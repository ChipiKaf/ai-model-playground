import React, { useMemo } from "react";
import type { VizScene, VizNode } from "../core/types";

import "./VizCanvas.scss";

export interface VizCanvasProps {
  scene: VizScene;
  className?: string; // Container class
  children?: React.ReactNode; // For custom overlays (lines, signals, etc)
}

export function VizCanvas({ scene, className, children }: VizCanvasProps) {
  const { viewBox, nodes, edges } = scene;
  
  // Create a map for quick node lookup by ID to calculate edge paths
  const nodesById = useMemo(() => {
    const map = new Map<string, VizNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  return (
    <div className={`viz-canvas ${className || ""}`}>
      <svg
        viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="viz-arrow"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
          </marker>
        </defs>

        {/* 1. Edges (Visual + Hit + Labels) */}
        <g className="viz-layer-edges">
          {edges.map(edge => {
            const start = nodesById.get(edge.from);
            const end = nodesById.get(edge.to);
            if (!start || !end) return null;

            return (
              <g key={edge.id} className={`viz-edge-group ${edge.className || ""}`}>
                {/* Visual Line */}
                <line
                  x1={start.pos.x}
                  y1={start.pos.y}
                  x2={end.pos.x}
                  y2={end.pos.y}
                  className="viz-edge"
                  markerEnd={edge.markerEnd === "arrow" ? "url(#viz-arrow)" : undefined}
                  stroke="currentColor"
                />
                
                {/* Hit Area */}
                {(edge.hitArea || edge.onClick) && (
                   <line
                    x1={start.pos.x}
                    y1={start.pos.y}
                    x2={end.pos.x}
                    y2={end.pos.y}
                    className="viz-edge-hit"
                    stroke="transparent"
                    strokeWidth={edge.hitArea || 10}
                    onClick={(e) => {
                        if (edge.onClick) {
                            e.stopPropagation();
                            edge.onClick(edge.id, edge);
                        }
                    }}
                    style={{ cursor: edge.onClick ? "pointer" : undefined }}
                  />
                )}

                {/* Edge Label */}
                {edge.label && (
                    <text
                        x={(start.pos.x + end.pos.x) / 2 + (edge.label.dx || 0)}
                        y={(start.pos.y + end.pos.y) / 2 + (edge.label.dy || 0)}
                        className={`viz-edge-label ${edge.label.className || ""}`}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ pointerEvents: "none" }}
                    >
                        {edge.label.text}
                    </text>
                )}
              </g>
            );
          })}
        </g>
        
        {/* 2. Nodes (Shape + Labels) */}
        <g className="viz-layer-nodes">
          {nodes.map(node => (
            <g 
                key={node.id} 
                className={`viz-node-group ${node.className || ""}`}
                onClick={(e) => {
                    if (node.onClick) {
                        e.stopPropagation();
                        node.onClick(node.id, node);
                    }
                }}
                style={{ cursor: node.onClick ? "pointer" : undefined }}
            >
              <RenderShape node={node} />
              
              {/* Node Label */}
              {node.label && (
                  <text
                      x={node.pos.x + (node.label.dx || 0)}
                      y={node.pos.y + (node.label.dy || 0)}
                      className={`viz-node-label ${node.label.className || ""}`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ pointerEvents: "none" }}
                  >
                      {node.label.text}
                  </text>
              )}
            </g>
          ))}
        </g>

        {/* 6. Custom Overlays (Children) */}
        {children}
      </svg>
    </div>
  );
}

function RenderShape({ node }: { node: VizNode }) {
    const { shape, pos } = node;
    const { x, y } = pos;

    switch (shape.kind) {
        case "circle":
            return <circle cx={x} cy={y} r={shape.r} className="viz-node-shape" />;
        case "rect":
            return (
                <rect 
                    x={x - shape.w / 2} 
                    y={y - shape.h / 2} 
                    width={shape.w} 
                    height={shape.h} 
                    rx={shape.rx} 
                    className="viz-node-shape"
                />
            );
        case "diamond":
             // Points: top, right, bottom, left
            const halfW = shape.w / 2;
            const halfH = shape.h / 2;
            const points = `
                ${x},${y - halfH} 
                ${x + halfW},${y} 
                ${x},${y + halfH} 
                ${x - halfW},${y}
            `;
            return <polygon points={points} className="viz-node-shape" />;
        default:
            return null;
    }
}
