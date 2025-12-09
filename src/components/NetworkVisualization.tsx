import React from 'react';
import { useDispatch } from 'react-redux';
import './NetworkVisualization.scss';
import { selectNeuron } from '../store/slices/simulationSlice';
import { useNetworkAnimation } from '../hooks/useNetworkAnimation';

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
  } = useNetworkAnimation(onAnimationComplete);

  // Constants for layout
  const width = 800;
  const height = 600;
  const neuronRadius = 15;

  return (
    <div className="network-visualization">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Connections & Weights */}
        <g className="connections">
          {connections.map((conn) => {
            const mx = (conn.x1 + conn.x2) / 2;
            const my = (conn.y1 + conn.y2) / 2;
            return (
              <g key={conn.id} className="connection-group">
                <line x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2} className="connection" />
                <line x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2} className="connection-hit-area" />
                <text x={mx} y={my} className="weight-label" textAnchor="middle" alignmentBaseline="middle">
                  {conn.weight.toFixed(2)}
                </text>
                {activeLayer === conn.sourceLayer && conn.weight > 0 && (
                  <line x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2} className="idle-flow" />
                )}
              </g>
            );
          })}
        </g>

        {/* Signals */}
        <g className="signals">
          {signals.map((sig) => {
            const currentX = sig.x + (sig.targetX - sig.x) * sig.progress;
            const currentY = sig.y + (sig.targetY - sig.y) * sig.progress;
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

        {/* Neurons */}
        <g className="neurons">
          {neurons.map((neuron) => {
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

            return (
              <g key={`neuron-group-${neuron.layerIndex}-${neuron.neuronIndex}`}>
                <circle
                  cx={neuron.x}
                  cy={neuron.y}
                  r={neuronRadius}
                  className={neuronClass}
                  onClick={() => {
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
                  }}
                />
                <text
                  x={neuron.x}
                  y={neuron.y}
                  className={`neuron-value ${isVisible ? 'visible' : ''}`}
                >
                  {displayValue}
                </text>
              </g>
            );
          })}
        </g>

        {/* Layer Labels */}
        <g className="labels">
          {layerSizes.map((_, idx) => {
            const layerNeuron = neurons.find((n) => n.layerIndex === idx);
            if (!layerNeuron) return null;

            return (
              <text
                key={`label-${idx}`}
                x={layerNeuron.x}
                y={height - 10}
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
      </svg>
    </div>
  );
};

export default NetworkVisualization;
