
import React from 'react';
import { useDispatch } from 'react-redux';
import './main.scss';
import { selectNeuron } from '../../store/slices/simulationSlice';
import { useAnnAnimation } from './useAnnAnimation';
import { viz, VizCanvas } from '../../viz-kit';
import { useMemo } from 'react';

interface NetworkVisualizationProps {
  onAnimationComplete?: () => void;
}

export interface NeuronData {
  layerIndex: number;
  neuronIndex: number;
  bias: number;
  output: number;
  inputs: number[];
  weights: number[];
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  onAnimationComplete,
}) => {
  const dispatch = useDispatch();
  const { 
    signals, 
    activeLayer, 
    neurons, 
    connections, 
    neuronValues, 
    layerSizes 
  } = useAnnAnimation(onAnimationComplete);

  // Constants for layout
  const width = 800;
  const height = 600;
  const neuronRadius = 15;

  const scene = useMemo(() => {
    // Grid Configuration
    const cols = layerSizes.length;
    const rows = Math.max(...layerSizes);
    const b = viz().view(width, height).grid(cols, rows, { x: 50, y: 50 });

    // Nodes
    neurons.forEach((neuron) => {
      const val = neuronValues[`${neuron.layerIndex}-${neuron.neuronIndex}`];
      const isVisible = val !== undefined;

      let neuronClass = `neuron ${
        activeLayer === neuron.layerIndex ? 'active' : ''
      }`;
      let displayValue = '';

      if (isVisible) {
        if (val.state === 'sum') {
          neuronClass += val.sum < 0 ? ' negative' : ' positive';
          displayValue = val.sum.toFixed(2);
        } else {
          if (val.output === 0) {
            neuronClass += ' inactive';
            displayValue = '0.00';
          } else {
            neuronClass += ' positive';
            displayValue = val.output.toFixed(2);
          }
        }
      }

      // Calculate centered row index
      const layerSize = layerSizes[neuron.layerIndex] || 0;
      const rowOffset = (rows - layerSize) / 2;
      // Fractional positioning allowed in viz-kit
      const row = neuron.neuronIndex + rowOffset;
      
      b.node(`${neuron.layerIndex}-${neuron.neuronIndex}`)
       .cell(neuron.layerIndex, row) // Use calculated grid coordinates
       //.at(neuron.x, neuron.y) // old implementation
       .circle(neuronRadius)
       .class(neuronClass)
       .label(isVisible ? displayValue : '', { className: `neuron-value ${isVisible ? 'visible' : ''}` })
       .onClick(() => {
          // Gather data for this neuron
          const incomingConnections = connections.filter(
            (c) =>
              c.targetIndex === neuron.neuronIndex &&
              c.sourceLayer === neuron.layerIndex - 1
          );

          const inputs = incomingConnections.map((c) => {
            const sourceKey = `${c.sourceLayer}-${c.sourceIndex}`;
            return neuronValues[sourceKey]?.output || 0;
          });

          const weights = incomingConnections.map((c) => c.weight);

          dispatch(selectNeuron({
            layerIndex: neuron.layerIndex,
            neuronIndex: neuron.neuronIndex,
            bias: neuron.bias,
            output: val?.output || 0,
            inputs,
            weights,
          }));
       });
    });

    // Connections
    connections.forEach((conn) => {
        let edgeClass = 'connection';
        // Check "idle flow" condition: active layer matches source, source output > 0, weight > 0
        // We add a class if this condition is met.
        if (activeLayer === conn.sourceLayer && neuronValues[`${conn.sourceLayer}-${conn.sourceIndex}`]?.sum > 0 && conn.weight > 0) {
            edgeClass += ' idle-flow';
        }

        b.edge(`${conn.sourceLayer}-${conn.sourceIndex}`, `${conn.sourceLayer + 1}-${conn.targetIndex}`, conn.id)
         .label(conn.weight.toFixed(2), { className: 'weight-label' })
         .class(edgeClass)
         .hitArea(10); // Standard hit area width
    });

    return b.build();
  }, [neurons, connections, neuronValues, activeLayer, dispatch, width, height, layerSizes]);

  // Create lookup for node positions from the generated scene
  // This ensures signals align with Grid layout
  const nodePosMap = useMemo(() => {
      const map = new Map<string, {x: number, y: number}>();
      scene.nodes.forEach(n => map.set(n.id, n.pos));
      return map;
  }, [scene]);

  return (
    <div className="network-visualization">
      <VizCanvas scene={scene}>
        {/* Layer Labels */}
        <g className="labels">
          {layerSizes.map((_: number, idx: number) => {
            // Find a node in this layer to get X position
            const layerNode = scene.nodes.find(n => n.id.startsWith(`${idx}-`));
            if (!layerNode) return null;

            return (
              <text
                key={`label-${idx}`}
                x={layerNode.pos.x}
                y={height - 20} // Slightly higher padding
                className="layer-label"
              >
                {idx === 0
                  ? 'Input Layer'
                  : idx === layerSizes.length - 1
                  ? 'Output Layer'
                  : `Hidden Layer ${idx}`}
              </text>
            );
          })}
        </g>

         {/* Signals */}
        <g className="signals">
          {signals.map((sig) => {
            const startPos = nodePosMap.get(`${sig.sourceLayer}-${sig.sourceIndex}`);
            const endPos = nodePosMap.get(`${sig.targetLayer}-${sig.targetIndex}`);
            
            if (!startPos || !endPos) return null;

            const currentX = startPos.x + (endPos.x - startPos.x) * sig.progress;
            const currentY = startPos.y + (endPos.y - startPos.y) * sig.progress;

            let v = Math.abs(sig.sourceOutput);
            if (v > 1) v = 1;
            const radius = 2 + v * 4;

            return (
              <circle
                key={sig.id}
                cx={currentX}
                cy={currentY}
                r={radius}
                className="signal"
              />
            );
          })}
        </g>
      </VizCanvas>
    </div>
  );
};

export default NetworkVisualization;
