import React, { useMemo } from 'react';
import './main.scss';
import { useDecisionTreeAnimation } from './useDecisionTreeAnimation';
import { type TreeNode } from './decisionTreeSlice';
import { viz } from '../../viz-kit/core/builder';
import { VizCanvas } from '../../viz-kit/react/VizCanvas';

interface DecisionTreeVisualizationProps {
  onAnimationComplete?: () => void;
}

const DecisionTreeVisualization: React.FC<DecisionTreeVisualizationProps> = ({
  onAnimationComplete,
}) => {
  const { tree, dataPoints } = useDecisionTreeAnimation(onAnimationComplete);

  const scene = useMemo(() => {
    const b = viz().view(800, 600);

    // 1. Build Nodes
    Object.values(tree).forEach((node: TreeNode) => {
        const n = b.node(node.id).at(node.x || 0, node.y || 0);

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
  }, [tree, dataPoints]);

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
