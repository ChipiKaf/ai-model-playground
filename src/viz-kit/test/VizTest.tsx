import { useMemo } from 'react';
import { viz, VizCanvas } from '../index';

export function VizTest() {
  const scene = useMemo(() => {
    return viz()
      .view(800, 600)
      .node("n1").circle(30).at(100, 100).label("Start").class("start-node")
      .node("n2").rect(80, 40, 5).at(300, 100).label("Process").class("process-node")
      .node("n3").diamond(50, 50).at(500, 100).label("Decision").class("decision-node")
      .edge("n1", "n2").label("Go").arrow().class("primary-link")
      .edge("n2", "n3").label("Check").arrow().class("primary-link")
      .build();
  }, []);

  return (
    <div style={{ width: 800, height: 600, border: '1px solid #ccc' }}>
      <VizCanvas scene={scene} />
      <style>{`
        .viz-node-shape { fill: #fff; stroke: #333; stroke-width: 2px; }
        .viz-edge { stroke: #666; stroke-width: 2px; }
        .viz-node-label, .viz-edge-label { font-family: sans-serif; font-size: 12px; fill: #333; }
        .start-node .viz-node-shape { stroke: green; }
        .process-node .viz-node-shape { stroke: blue; }
        .decision-node .viz-node-shape { stroke: orange; }
      `}</style>
    </div>
  );
}
