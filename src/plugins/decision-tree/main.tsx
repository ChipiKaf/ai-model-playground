import React from 'react';
import './main.scss';
import { useDecisionTreeAnimation } from './useDecisionTreeAnimation';
import { type TreeNode, type DataPoint } from './decisionTreeSlice';

interface DecisionTreeVisualizationProps {
  onAnimationComplete?: () => void;
}

const DecisionTreeVisualization: React.FC<DecisionTreeVisualizationProps> = ({
  onAnimationComplete,
}) => {
  const { tree, dataPoints } = useDecisionTreeAnimation(onAnimationComplete);

  const renderLink = (source: TreeNode, targetId: string, type: 'left' | 'right') => {
    const target = tree[targetId];
    if (!target) return null;
    
    // Simple straight lines or curves
    return (
      <g key={`${source.id}-${target.id}`}>
        <line 
            x1={source.x} y1={source.y} 
            x2={target.x} y2={target.y} 
            className="tree-link" 
        />
        {/* Label for the branch */}
        <text 
            x={(source.x! + target.x!) / 2} 
            y={(source.y! + target.y!) / 2 - 5}
            className="link-label"
            textAnchor="middle"
        >
            {type === 'left' ? 'Yes' : 'No'}
        </text>
      </g>
    );
  };

  const renderNode = (node: TreeNode) => {
    const isLeaf = node.type === 'leaf';
    return (
      <g key={node.id} className={`tree-node ${isLeaf ? 'leaf' : 'internal'}`}>
        {isLeaf ? (
            <circle cx={node.x} cy={node.y} r={30} />
        ) : (
            <rect x={node.x! - 40} y={node.y! - 20} width={80} height={40} rx={5} />
        )}
        <text 
            x={node.x}
            y={node.y! + 5}
            textAnchor="middle"
            className="node-label"
        >
            {node.label}
        </text>
      </g>
    );
  };

  const renderDataPoint = (point: DataPoint) => {
    const node = tree[point.currentNodeId];
    if (!node) return null;

    // We can add a little random offset so they don't stack perfectly
    // Use a deterministic hash based on ID for visual stability across renders
    const offsetX = (parseInt(point.id.split('-')[1]) % 5 - 2) * 10; 
    const offsetY = (parseInt(point.id.split('-')[1]) % 3 - 1) * 10;

    return (
        <circle 
            key={point.id}
            cx={node.x! + offsetX}
            cy={node.y! + offsetY}
            r={6}
            className="data-point"
        />
    );
  };

  return (
    <div className="decision-tree-visualization">
      <svg width="100%" height="100%" viewBox="0 0 800 600">
        <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#ccc" />
            </marker>
        </defs>

        {/* Links */}
        {Object.values(tree).map((node: any) => {
            if (node.type === 'leaf') return null;
            return (
                <React.Fragment key={`links-${node.id}`}>
                    {node.children?.left && renderLink(node, node.children.left, 'left')}
                    {node.children?.right && renderLink(node, node.children.right, 'right')}
                </React.Fragment>
            );
        })}

        {/* Nodes */}
        {Object.values(tree).map((node: any) => renderNode(node))}

        {/* Data Points */}
        {dataPoints.map((p: any) => renderDataPoint(p))}
      </svg>
      <div className="controls-overlay">
         {/* Could add manual step controls here via overlay if needed by Shell was not enough */}
      </div>
    </div>
  );
};

export default DecisionTreeVisualization;
