import React, { useMemo } from 'react';
import './NetworkVisualization.scss';

interface NetworkVisualizationProps {
  layerSizes: number[];
  onNeuronSelect?: (layerIndex: number, neuronIndex: number) => void;
}

interface NeuronPosition {
  x: number;
  y: number;
  layerIndex: number;
  neuronIndex: number;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ layerSizes, onNeuronSelect }) => {
  // Constants for layout
  const width = 800;
  const height = 600;
  const paddingX = 100;
  const paddingY = 50;
  const neuronRadius = 15;

  // Calculate positions of all neurons
  const neurons: NeuronPosition[] = useMemo(() => {
    const positions: NeuronPosition[] = [];
    
    const layerSpacing = (width - 2 * paddingX) / (layerSizes.length - 1);

    layerSizes.forEach((size, layerIndex) => {
      const x = paddingX + layerIndex * layerSpacing;
      const layerHeight = height - 2 * paddingY;
      const neuronSpacing = layerHeight / (size + 1);

      for (let i = 0; i < size; i++) {
        positions.push({
          x,
          y: paddingY + (i + 1) * neuronSpacing,
          layerIndex,
          neuronIndex: i,
        });
      }
    });

    return positions;
  }, [layerSizes]);

  // Generate connections (fully connected between adjacent layers)
  const connections = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];

    for (let l = 0; l < layerSizes.length - 1; l++) {
      const currentLayerNeurons = neurons.filter(n => n.layerIndex === l);
      const nextLayerNeurons = neurons.filter(n => n.layerIndex === l + 1);

      currentLayerNeurons.forEach(source => {
        nextLayerNeurons.forEach(target => {
          lines.push({
            x1: source.x,
            y1: source.y,
            x2: target.x,
            y2: target.y,
            key: `l${l}-n${source.neuronIndex}-to-l${l + 1}-n${target.neuronIndex}`,
          });
        });
      });
    }
    return lines;
  }, [layerSizes, neurons]);

  return (
    <div className="network-visualization">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Connections */}
        <g className="connections">
          {connections.map(conn => (
            <line
              key={conn.key}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              className="connection"
            />
          ))}
        </g>

        {/* Neurons */}
        <g className="neurons">
          {neurons.map((neuron) => (
            <circle
              key={`neuron-${neuron.layerIndex}-${neuron.neuronIndex}`}
              cx={neuron.x}
              cy={neuron.y}
              r={neuronRadius}
              className="neuron"
              onClick={() => onNeuronSelect?.(neuron.layerIndex, neuron.neuronIndex)}
            />
          ))}
        </g>
        
        {/* Layer Labels */}
        <g className="labels">
           {layerSizes.map((_, idx) => {
             // Find x position of this layer (using the first neuron of the layer)
             const layerNeuron = neurons.find(n => n.layerIndex === idx);
             if (!layerNeuron) return null;
             
             return (
               <text 
                 key={`label-${idx}`} 
                 x={layerNeuron.x} 
                 y={height - 10} 
                 className="layer-label"
               >
                 {idx === 0 ? 'Input Layer' : idx === layerSizes.length - 1 ? 'Output Layer' : `Hidden Layer ${idx}`}
               </text>
             );
           })}
        </g>
      </svg>
    </div>
  );
};

export default NetworkVisualization;
