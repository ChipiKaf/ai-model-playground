import type { VizNode, VizEdge, VizAnimSpec } from './types';

export interface AnimRendererContext<T = any> {
    spec: VizAnimSpec<T>;
    element: VizNode | VizEdge;
}

export interface AnimRenderer<T = any> {
    getClass?: (ctx: AnimRendererContext<T>) => string;
    getStyle?: (ctx: AnimRendererContext<T>) => Record<string, string | number>;
}

export class AnimationRegistry {
    private nodeAnims = new Map<string, AnimRenderer>();
    private edgeAnims = new Map<string, AnimRenderer>();

    constructor() {}

    registerNode(id: string, renderer: AnimRenderer) {
        this.nodeAnims.set(id, renderer);
        return this;
    }

    registerEdge(id: string, renderer: AnimRenderer) {
        this.edgeAnims.set(id, renderer);
        return this;
    }

    getNodeRenderer(id: string): AnimRenderer | undefined {
        return this.nodeAnims.get(id);
    }

    getEdgeRenderer(id: string): AnimRenderer | undefined {
        return this.edgeAnims.get(id);
    }
}

// Default Implementations

// Flow: Moves a dashed line along the path.
// CSS Class: .viz-anim-flow (needs to be defined in CSS)
// Params: { duration: string }
export const flowAnimation: AnimRenderer<{ duration?: string }> = {
    getClass: () => 'viz-anim-flow',
    getStyle: ({ spec }) => {
        const duration = spec.params?.duration ?? '2s';
        return {
            '--viz-anim-duration': duration
        };
    }
};

export const defaultRegistry = new AnimationRegistry()
    .registerEdge('flow', flowAnimation);
