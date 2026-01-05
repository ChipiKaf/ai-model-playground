
import type { VizNode, VizEdge, VizOverlaySpec, VizScene } from './types';

export interface CoreOverlayRenderContext<T = any> {
    spec: VizOverlaySpec<T>;
    nodesById: Map<string, VizNode>;
    edgesById: Map<string, VizEdge>;
    scene: VizScene;
}

export interface CoreOverlayRenderer<T = any> {
    render: (ctx: CoreOverlayRenderContext<T>) => string;
}

export class CoreOverlayRegistry {
    private overlays = new Map<string, CoreOverlayRenderer>();

    register(id: string, renderer: CoreOverlayRenderer) {
        this.overlays.set(id, renderer);
        return this;
    }

    get(id: string) {
        return this.overlays.get(id);
    }
}

// Built-in Overlay: Signal
export const signalOverlay: CoreOverlayRenderer<{
    from: string;
    to: string;
    progress: number;
    magnitude?: number;
}> = {
    render: ({ spec, nodesById }) => {
        const { from, to, progress } = spec.params;
        const start = nodesById.get(from);
        const end = nodesById.get(to);
        
        if (!start || !end) return '';

        const x = start.pos.x + (end.pos.x - start.pos.x) * progress;
        const y = start.pos.y + (end.pos.y - start.pos.y) * progress;

        let v = Math.abs(spec.params.magnitude ?? 1);
        if (v > 1) v = 1;
        const r = 2 + v * 4;

        const className = spec.className ?? "viz-signal";

        return `
            <g transform="translate(${x}, ${y})">
                <g class="${className}">
                    <circle r="10" fill="transparent" stroke="none" />
                    <circle r="${r}" class="viz-signal-shape" />
                </g>
            </g>
        `;
    }
};

// Built-in Overlay: Grid Labels
export const gridLabelsOverlay: CoreOverlayRenderer<{
    colLabels?: Record<number, string>;
    rowLabels?: Record<number, string>;
    yOffset?: number;
    xOffset?: number;
}> = {
    render: ({ spec, scene }) => {
        const grid = scene.grid;
        if (!grid) return '';

        const { w, h } = scene.viewBox;
        const { colLabels, rowLabels, yOffset = 20, xOffset = 20 } = spec.params;

        // Safer string rendering for overlay to avoid weird spacing if grid missing
        const cellW = (w - (grid.padding.x * 2)) / grid.cols;
        const cellH = (h - (grid.padding.y * 2)) / grid.rows;

        let output = '';

        if (colLabels) {
            Object.entries(colLabels).forEach(([colStr, text]) => {
                const col = parseInt(colStr, 10);
                const x = grid.padding.x + (col * cellW) + (cellW / 2);
                const cls = spec.className || "viz-grid-label";
                output += `<text x="${x}" y="${yOffset}" class="${cls}" text-anchor="middle">${text}</text>`;
            });
        }

        if (rowLabels) {
            Object.entries(rowLabels).forEach(([rowStr, text]) => {
                const row = parseInt(rowStr, 10);
                const y = grid.padding.y + (row * cellH) + (cellH / 2);
                const cls = spec.className || "viz-grid-label";
                output += `<text x="${xOffset}" y="${y}" dy=".35em" class="${cls}" text-anchor="middle">${text}</text>`;
            });
        }

        return output;
    }
};

// Built-in Overlay: Data Points
export const dataPointOverlay: CoreOverlayRenderer<{
    points: { id: string; currentNodeId: string; [key: string]: any }[];
}> = {
    render: ({ spec, nodesById }) => {
        const { points } = spec.params;
        let output = '';
        
        points.forEach(point => {
            const node = nodesById.get(point.currentNodeId);
            if (!node) return;

            const idNum = parseInt(point.id.split('-')[1] || '0', 10);
            const offsetX = ((idNum % 5) - 2) * 10;
            const offsetY = ((idNum % 3) - 1) * 10;

            const x = node.pos.x + offsetX;
            const y = node.pos.y + offsetY;
            
            const cls = spec.className ?? "viz-data-point";
            output += `<circle cx="${x}" cy="${y}" r="6" class="${cls}" />`;
        });

        return output;
    }
};

export const defaultCoreOverlayRegistry = new CoreOverlayRegistry()
    .register("signal", signalOverlay)
    .register("grid-labels", gridLabelsOverlay)
    .register("data-points", dataPointOverlay);
