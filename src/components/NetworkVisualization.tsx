import React, { useMemo, useState, useEffect, useRef } from 'react';
import './NetworkVisualization.scss';

interface NetworkVisualizationProps {
  layerSizes: number[];
  currentStep: number;
  onNeuronSelect?: (layerIndex: number, neuronIndex: number) => void;
  onAnimationComplete?: () => void;
}

interface NeuronPosition {
  x: number;
  y: number;
  layerIndex: number;
  neuronIndex: number;
}

interface Signal {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ layerSizes, currentStep, onNeuronSelect, onAnimationComplete }) => {
  // Constants for layout
  const width = 800;
  const height = 600;
  const paddingX = 100;
  const paddingY = 50;
  const neuronRadius = 15;

  // Animation State
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const animationRef = useRef<number>(undefined);

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

  // Generate connections
  const connections = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; key: string, sourceLayer: number, sourceIndex: number, targetIndex: number }[] = [];

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
            sourceLayer: l,
            sourceIndex: source.neuronIndex,
            targetIndex: target.neuronIndex
          });
        });
      });
    }
    return lines;
  }, [layerSizes, neurons]);

  // Handle Step Changes
  useEffect(() => {
    // Determine what should be happening based on currentStep
    // Even steps: Layer Activation
    // Odd steps: Signal Transmission

    if (currentStep % 2 === 0) {
      // Layer Activation
      const layerIndex = currentStep / 2;
      setActiveLayer(layerIndex);
      setSignals([]); // Clear any signals
    } else {
      // Signal Transmission
      const sourceLayerIndex = (currentStep - 1) / 2;
      setActiveLayer(null); // Or keep previous layer active? Let's turn off to focus on signals? 
      // User said "light that's moving along the line".
      // Let's keep the source layer active? No, usually signals leave.
      
      createSignals(sourceLayerIndex);
    }
  }, [currentStep, connections]); // Re-run when step changes

  const createSignals = (sourceLayerIndex: number) => {
    const relevantConnections = connections.filter(c => c.sourceLayer === sourceLayerIndex);
    const newSignals: Signal[] = relevantConnections.map(conn => ({
      id: `sig-${conn.key}-${Date.now()}`,
      x: conn.x1,
      y: conn.y1,
      targetX: conn.x2,
      targetY: conn.y2,
      progress: 0
    }));

    setSignals(newSignals);
    animateSignals();
  };

  const animateSignals = () => {
    const startTime = performance.now();
    const duration = 1500; // Slower animation as requested (1.5s)

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Update state with progress
      setSignals(prev => prev.map(s => ({...s, progress})));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        // Animation finished, signals stay at end until next step clears them
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(step);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

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

        {/* Signals */}
        <g className="signals">
          {signals.map(sig => {
             const currentX = sig.x + (sig.targetX - sig.x) * sig.progress;
             const currentY = sig.y + (sig.targetY - sig.y) * sig.progress;
             
             return (
              <circle
                key={sig.id}
                cx={currentX}
                cy={currentY}
                r={3} // Smaller radius
                className="signal"
              />
             );
          })}
        </g>

        {/* Neurons */}
        <g className="neurons">
          {neurons.map((neuron) => (
            <circle
              key={`neuron-${neuron.layerIndex}-${neuron.neuronIndex}`}
              cx={neuron.x}
              cy={neuron.y}
              r={neuronRadius}
              className={`neuron ${activeLayer === neuron.layerIndex ? 'active' : ''}`}
              onClick={() => onNeuronSelect?.(neuron.layerIndex, neuron.neuronIndex)}
            />
          ))}
        </g>
        
        {/* Layer Labels */}
        <g className="labels">
           {layerSizes.map((_, idx) => {
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
