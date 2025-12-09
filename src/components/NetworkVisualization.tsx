import React, { useMemo, useState, useEffect, useRef } from 'react';
import './NetworkVisualization.scss';

interface NetworkVisualizationProps {
  layerSizes: number[];
  currentStep: number;
  onNeuronSelect?: (layerIndex: number, neuronIndex: number) => void;
  onAnimationComplete?: () => void;
  passCount?: number;
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
  weight?: number;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ layerSizes, currentStep, onNeuronSelect, onAnimationComplete, passCount = 1 }) => {
  // Constants for layout
  const width = 800;
  const height = 600;
  const paddingX = 100;
  const paddingY = 50;
  const neuronRadius = 15;

  // Animation State
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [neuronValues, setNeuronValues] = useState<Record<string, { sum: number, output: number, state: 'sum' | 'active' }>>({});
  const animationRef = useRef<number>(undefined);

  // Calculate positions of all neurons
  const neurons: NeuronPosition[] = useMemo(() => {
    // ... (existing code)
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
    const lines: { x1: number; y1: number; x2: number; y2: number; key: string, sourceLayer: number, sourceIndex: number, targetIndex: number, weight: number }[] = [];

    for (let l = 0; l < layerSizes.length - 1; l++) {
      const currentLayerNeurons = neurons.filter(n => n.layerIndex === l);
      const nextLayerNeurons = neurons.filter(n => n.layerIndex === l + 1);

      currentLayerNeurons.forEach(source => {
        nextLayerNeurons.forEach(target => {
          // Generate a deterministic random weight based on indices for consistency across renders
          const seed = l * 1000 + source.neuronIndex * 100 + target.neuronIndex;
          // Weight range: -1.0 to 1.0
          const pseudoRandom = (Math.sin(seed) * 10000) % 1; 
          const signedWeight = (pseudoRandom * 2) - 1; // -1 to 1

          lines.push({
            x1: source.x,
            y1: source.y,
            x2: target.x,
            y2: target.y,
            key: `l${l}-n${source.neuronIndex}-to-l${l + 1}-n${target.neuronIndex}`,
            sourceLayer: l,
            sourceIndex: source.neuronIndex,
            targetIndex: target.neuronIndex,
            weight: signedWeight
          });
        });
      });
    }
    return lines;
  }, [layerSizes, neurons]);

  // Handle Step Changes
  useEffect(() => {
    // Determine what should be happening based on currentStep

    if (currentStep === 0) {
       if (passCount === 1) {
         // First pass: Initialize Input Layer immediately
         setNeuronValues({}); 
         const newValues: Record<string, { sum: number, output: number, state: 'active' }> = {};
         for(let i=0; i<layerSizes[0]; i++) {
           const val = Math.random();
           newValues[`0-${i}`] = { sum: val, output: val, state: 'active' }; // Input layer has no activation function really
         }
         setNeuronValues(newValues as any);
       }
       // If passCount > 1, we do NOTHING here. We keep the old values.
       
       setActiveLayer(0);
       setSignals([]);
    } else if (currentStep % 2 === 0) {
      // Layer Activation
      const layerIndex = currentStep / 2;
      setActiveLayer(layerIndex);
      setSignals([]); 
      
      // 1. Calculate Weighted Sums for this layer
      const currentLayerNeurons = neurons.filter(n => n.layerIndex === layerIndex);
      const prevLayerIndex = layerIndex - 1;
      
      setNeuronValues(prev => {
        const next = { ...prev };
        
        currentLayerNeurons.forEach(neuron => {
          // Find all connections pointing TO this neuron
          const incomingConnections = connections.filter(c => 
            c.targetIndex === neuron.neuronIndex && 
            (c.sourceLayer === prevLayerIndex) // Should be implicit by structure but good to be safe
          );

          let weightedSum = 0;
          incomingConnections.forEach(conn => {
            const sourceVal = prev[`${prevLayerIndex}-${conn.sourceIndex}`]?.output || 0;
            weightedSum += sourceVal * conn.weight;
          });

          // Add bias (random small value for simulation)
          weightedSum += (Math.random() * 0.2) - 0.1;

          // Initial State: Show Sum (Red/Blue)
          next[`${layerIndex}-${neuron.neuronIndex}`] = { 
            sum: weightedSum, 
            output: weightedSum, // Placeholder
            state: 'sum' 
          };
        });
        
        return next;
      });

      // 2. Trigger Activation Animation after delay
      setTimeout(() => {
        setNeuronValues(prev => {
          const next = { ...prev };
          currentLayerNeurons.forEach(neuron => {
            const key = `${layerIndex}-${neuron.neuronIndex}`;
            const current = next[key];
            if (current) {
              // ReLU Activation
              const output = Math.max(0, current.sum);
              next[key] = { ...current, output, state: 'active' };
            }
          });
          return next;
        });
      }, 1000); // 1 second delay to see the "Sum" state

    } else {
      // Signal Transmission
      const sourceLayerIndex = (currentStep - 1) / 2;
      setActiveLayer(null); 
      
      // If this is the first transmission (Input -> Hidden 1) AND we are in a later pass,
      // NOW is the time to update the input layer values.
      if (sourceLayerIndex === 0 && passCount > 1) {
         setNeuronValues(prev => {
           const next = { ...prev };
           for(let i=0; i<layerSizes[0]; i++) {
             const val = Math.random();
             next[`0-${i}`] = { sum: val, output: val, state: 'active' };
           }
           return next;
         });
      }

      createSignals(sourceLayerIndex);
    }
  }, [currentStep, connections, layerSizes, passCount, neurons]); 

  const createSignals = (sourceLayerIndex: number) => {
    const relevantConnections = connections.filter(c => c.sourceLayer === sourceLayerIndex);
    const newSignals: Signal[] = relevantConnections.map(conn => ({
      id: `sig-${conn.key}-${Date.now()}`,
      x: conn.x1,
      y: conn.y1,
      targetX: conn.x2,
      targetY: conn.y2,
      progress: 0,
      weight: conn.weight
    }));

    setSignals(newSignals);
    animateSignals();
  };

  const animateSignals = () => {
    const startTime = performance.now();
    const duration = 2500; // Slower animation (2.5s)

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
            <React.Fragment key={conn.key}>
              <line
                x1={conn.x1}
                y1={conn.y1}
                x2={conn.x2}
                y2={conn.y2}
                className="connection"
              />
              {activeLayer === conn.sourceLayer && (
                <line
                  x1={conn.x1}
                  y1={conn.y1}
                  x2={conn.x2}
                  y2={conn.y2}
                  className="idle-flow"
                />
              )}
            </React.Fragment>
          ))}
        </g>

        {/* Signals */}
        <g className="signals">
          {signals.map(sig => {
             const currentX = sig.x + (sig.targetX - sig.x) * sig.progress;
             const currentY = sig.y + (sig.targetY - sig.y) * sig.progress;
             
             // Scale radius based on weight: 1.5px to 4.5px
             const radius = 1.5 + (sig.weight || 0.5) * 3;

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
            
            let neuronClass = `neuron ${activeLayer === neuron.layerIndex ? 'active' : ''}`;
            let displayValue = '';

            if (isVisible) {
               if (val.state === 'sum') {
                 neuronClass += val.sum < 0 ? ' negative' : ' positive';
                 displayValue = val.sum.toFixed(1);
               } else {
                 // Active state (post-activation)
                 if (val.output === 0) {
                   neuronClass += ' inactive';
                   displayValue = '0.0';
                 } else {
                   neuronClass += ' positive';
                   displayValue = val.output.toFixed(1);
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
                  onClick={() => onNeuronSelect?.(neuron.layerIndex, neuron.neuronIndex)}
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
