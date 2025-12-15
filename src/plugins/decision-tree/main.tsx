import React, { useMemo } from 'react';
import './main.scss';
import { useDecisionTreeAnimation } from './useDecisionTreeAnimation';
import { type TreeNode } from './decisionTreeSlice';
import { viz } from '../../viz-kit/core/builder';
import { VizCanvas } from '../../viz-kit/react/VizCanvas';

interface DecisionTreeVisualizationProps {
  onAnimationComplete?: () => void;
}

// Logic to dynamically position nodes on a grid based on tree structure
const calculateTreeLayout = (tree: Record<string, TreeNode>, rootId: string) => {
    const layout: Record<string, { col: number; row: number }> = {};
    let maxDepth = 0;
    let leafCount = 0;

    const traverse = (id: string, depth: number): number => {
        const node = tree[id];
        if (!node) return 0;
        
        if (depth > maxDepth) maxDepth = depth;

        // If leaf or no children, assign a new COLUMN slot (horizontal)
        if (!node.children || node.type === 'leaf') {
            const col = leafCount++;
            layout[id] = { row: depth, col };
            return col;
        }

        // Parent is centered horizontally between children
        const leftCol = traverse(node.children.left, depth + 1);
        const rightCol = traverse(node.children.right, depth + 1);
        const col = (leftCol + rightCol) / 2;

        layout[id] = { row: depth, col };
        return col;
    };

    traverse(rootId, 0);
    // Grid: Cols = Width (leaf count), Rows = Height (max depth + 1)
    return { layout, cols: leafCount, rows: maxDepth + 1 };
};

const DecisionTreeVisualization: React.FC<DecisionTreeVisualizationProps> = ({
  onAnimationComplete,
}) => {
  const { tree, dataPoints, rootId } = useDecisionTreeAnimation(onAnimationComplete);

  // Re-calculate layout if tree changes
  const { layout, cols, rows } = useMemo(() => calculateTreeLayout(tree, rootId), [tree, rootId]);

  const scene = useMemo(() => {
    // Configure Grid:
    // Columns = Number of Leaves (width)
    // Rows = Depth + 1 (height)
    // Padding ensures nodes aren't on the edge
    const b = viz().view(800, 600).grid(cols, rows, { x: 50, y: 50 });

    // 1. Build Nodes
    Object.values(tree).forEach((node: TreeNode) => {
        // Get calculated grid position
        const pos = layout[node.id] || { col: 0, row: 0 };
        
        const n = b.node(node.id).cell(pos.col, pos.row);

        if (node.type === 'leaf') {
             n.circle(30).class('leaf');
        } else {
             n.rect(80, 40, 5).class('internal');
        }

        n.label(node.label, { className: 'node-label' });
    });

    // 2. Build Edges
    Object.values(tree).forEach((node: TreeNode) => {
        if (node.type === 'leaf') return;
        
        if (node.children?.left) {
            b.edge(node.id, node.children.left)
             .label('Yes', { position: 'mid', className: 'link-label' });
        }
        if (node.children?.right) {
            b.edge(node.id, node.children.right)
             .label('No', { position: 'mid', className: 'link-label' });
        }
    });

    // 3. Add Data Points Overlay
    b.overlay('data-points', { points: dataPoints });

    return b.build();
  }, [tree, dataPoints, layout, cols, rows]);

  return (
    <div className="decision-tree-visualization-container">
       <VizCanvas scene={scene} className="decision-tree-visualization" />
       <div className="controls-overlay">
         {/* Controls placeholder */}
       </div>
    </div>
  );
};

export default DecisionTreeVisualization;
