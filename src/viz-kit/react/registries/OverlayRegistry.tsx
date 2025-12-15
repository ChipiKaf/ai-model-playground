import type React from 'react';
import type { VizNode, VizEdge, VizOverlaySpec, VizScene } from '../../core/types';

export interface OverlayRenderContext<T = any> {
    spec: VizOverlaySpec<T>;
    nodesById: Map<string, VizNode>;
    edgesById: Map<string, VizEdge>;
    scene: VizScene;
}

export interface OverlayRenderer<T = any> {
    render: (ctx: OverlayRenderContext<T>) => React.ReactNode;
}

export class OverlayRegistry {
    private overlays = new Map<string, OverlayRenderer>();

    register(id: string, renderer: OverlayRenderer) {
        this.overlays.set(id, renderer);
        return this;
    }

    get(id: string) {
        return this.overlays.get(id);
    }
}

// Built-in Overlay: Signal
// Moves a circle between two nodes based on progress (0..1)
export const signalOverlay: OverlayRenderer<{
    from: string;
    to: string;
    progress: number;      // 0..1
    magnitude?: number;    // used for radius
}> = {
    render: ({ spec, nodesById }) => {
        const { from, to, progress } = spec.params;
        const start = nodesById.get(from);
        const end = nodesById.get(to);
        
        // If nodes aren't found (e.g. during init), don't render
        if (!start || !end) return null;

        // Linear interpolation
        const x = start.pos.x + (end.pos.x - start.pos.x) * progress;
        const y = start.pos.y + (end.pos.y - start.pos.y) * progress;

        // Calculate radius based on magnitude
        let v = Math.abs(spec.params.magnitude ?? 1);
        if (v > 1) v = 1;
        const r = 2 + v * 4;

        // Create a simple circle overlay
        // Note: Using 'circle' primitive directly. 
        // We could expand this to support more complex shapes or styles via params.
        return (
            <circle 
                cx={x} 
                cy={y} 
                r={r} 
                className={spec.className ?? "viz-signal"} 
            />
        );
    }
};

export const gridLabelsOverlay: OverlayRenderer<{
    colLabels?: Record<number, string>; // colIndex -> text (Column Labels)
    rowLabels?: Record<number, string>; // rowIndex -> text (Row Labels)
    yOffset?: number; // for col labels
    xOffset?: number; // for row labels
}> = {
    render: ({ spec, scene }) => {
        const grid = scene.grid;
        if (!grid) return null;

        const { w, h } = scene.viewBox;
        const { colLabels, rowLabels, yOffset = 20, xOffset = 20 } = spec.params;

        const cellW = (w - (grid.padding.x * 2)) / grid.cols;
        const cellH = (h - (grid.padding.y * 2)) / grid.rows;

        return (
            <>
                {/* Column Labels */}
                {colLabels && Object.entries(colLabels).map(([colStr, text]) => {
                    const col = parseInt(colStr, 10);
                    // Center of the column
                    const x = grid.padding.x + (col * cellW) + (cellW / 2);

                    return (
                        <text
                            key={`col-${col}`}
                            x={x}
                            y={yOffset}
                            className={spec.className || "viz-grid-label"}
                            textAnchor="middle"
                        >
                            {text as string}
                        </text>
                    );
                })}
                
                {/* Row Labels */}
                {rowLabels && Object.entries(rowLabels).map(([rowStr, text]) => {
                    const row = parseInt(rowStr, 10);
                    // Center of the row
                    const y = grid.padding.y + (row * cellH) + (cellH / 2);

                    return (
                        <text
                            key={`row-${row}`}
                            x={xOffset}
                            y={y} // Center vertically in the row
                            dy=".35em" // Optical vertical centering
                            className={spec.className || "viz-grid-label"}
                            textAnchor="middle"
                        >
                            {text as string}
                        </text>
                    );
                })}
            </>
        );
    }
};

export const defaultOverlayRegistry = new OverlayRegistry()
    .register("signal", signalOverlay)
    .register("grid-labels", gridLabelsOverlay);
