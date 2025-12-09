import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './NetworkVisualization.scss';
import { type RootState } from '../store/store';
import { updateNeuronValues, resetNeuronValues } from '../store/slices/networkSlice';
import { selectNeuron } from '../store/slices/simulationSlice';

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

interface Signal {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  weight?: number;
  sourceLayer: number;
  sourceIndex: number;
  sourceOutput: number;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  onAnimationComplete,
}) => {
  const dispatch = useDispatch();
  const { layerSizes, neurons, connections, neuronValues } = useSelector((state: RootState) => state.network);
  const { currentStep, passCount } = useSelector((state: RootState) => state.simulation);

  // Constants for layout
  const width = 800;
  const height = 600;
  const neuronRadius = 15;

  // Animation State (Visual only)
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  
  const animationRef = useRef<number | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Handle Step Changes
  useEffect(() => {
    // Cancel any ongoing animations or timeouts when step changes
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (currentStep === 0) {
      // Initialize Input Layer
      dispatch(resetNeuronValues());
      const newValues: Record<string, { sum: number; output: number; state: 'sum' | 'active' }> = {};
      
      // We need to know how many inputs. layerSizes[0]
      if (layerSizes.length > 0) {
        for (let i = 0; i < layerSizes[0]; i++) {
          const val = Math.random();
          newValues[`0-${i}`] = {
            sum: val,
            output: val,
            state: 'active',
          };
        }
        dispatch(updateNeuronValues(newValues));
      }

      setActiveLayer(0);
      setSignals([]);
    } else if (currentStep % 2 === 0) {
      // Layer Activation
      const layerIndex = currentStep / 2;
      setActiveLayer(layerIndex);
      setSignals([]);

      const currentLayerNeurons = neurons.filter(
        (n) => n.layerIndex === layerIndex
      );
      const prevLayerIndex = layerIndex - 1;

      // Calculate sums immediately
      const nextValues: Record<string, { sum: number; output: number; state: 'sum' | 'active' }> = {};

      currentLayerNeurons.forEach((neuron) => {
        const incomingConnections = connections.filter(
          (c) =>
            c.targetIndex === neuron.neuronIndex &&
            c.sourceLayer === prevLayerIndex
        );

        let weightedSum = 0;
        incomingConnections.forEach((conn) => {
          const sourceVal =
            neuronValues[`${prevLayerIndex}-${conn.sourceIndex}`]?.output || 0;
          weightedSum += sourceVal * conn.weight;
        });

        // Bias
        weightedSum += neuron.bias;

        nextValues[`${layerIndex}-${neuron.neuronIndex}`] = {
          sum: weightedSum,
          output: weightedSum, // placeholder
          state: 'sum',
        };
      });

      dispatch(updateNeuronValues(nextValues));

      // Activate after delay
      timeoutRef.current = setTimeout(() => {
        const activatedValues: Record<string, { sum: number; output: number; state: 'sum' | 'active' }> = {};
        currentLayerNeurons.forEach((neuron) => {
          const key = `${layerIndex}-${neuron.neuronIndex}`;
          const current = nextValues[key] || neuronValues[key]; // Use calculated or existing
          if (current) {
             // Re-read sum from nextValues to be safe, or just recalculate/use current
             // Since we just dispatched nextValues, we can use it.
            const output = Math.max(0, current.sum); // ReLU
            activatedValues[key] = { ...current, output, state: 'active' };
          }
        });
        dispatch(updateNeuronValues(activatedValues));
        timeoutRef.current = undefined;
      }, 1000);

    } else {
      // Signal Transmission
      const sourceLayerIndex = (currentStep - 1) / 2;
      setActiveLayer(null);
      createSignals(sourceLayerIndex, neuronValuesRef.current);
    }
  }, [currentStep, passCount, layerSizes, neurons, connections, dispatch]); // Removed neuronValues from dependency to avoid infinite loop if we are careful, but we need it for calculation.
  // Wait, if we depend on neuronValues, and we update it, we trigger effect again?
  // The effect depends on `currentStep`. We only want to run this logic when `currentStep` changes.
  // So we should NOT include `neuronValues` in the dependency array for the MAIN logic, 
  // OR we should use a ref for the latest neuronValues, 
  // OR we should rely on the fact that we only dispatch when step changes.
  // Actually, `neuronValues` is needed for calculation. 
  // If we include it, `updateNeuronValues` will trigger this effect again.
  // We must be careful.
  // The logic `if (currentStep === 0)` etc runs on every render if dependencies change.
  // If `neuronValues` changes, we don't want to re-run the step logic.
  // We only want to run when `currentStep` changes.
  // So I will remove `neuronValues` from the dependency array and use `store.getState()` or a ref, 
  // OR better: use a separate `useEffect` for the step logic that only depends on `currentStep`.
  // But inside that effect, I need the *current* `neuronValues`.
  // I can use a ref to track `neuronValues`.

  const neuronValuesRef = useRef(neuronValues);
  useEffect(() => {
      neuronValuesRef.current = neuronValues;
  }, [neuronValues]);

  // Re-implementing the main effect with refs for values
  useEffect(() => {
    // ... (same logic but use neuronValuesRef.current)
    // Actually, let's just copy the logic and fix the access.
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (currentStep === 0) {
       // ... (init logic doesn't need prev values)
       dispatch(resetNeuronValues());
       // ...
       if (layerSizes.length > 0) {
        const newValues: Record<string, any> = {};
        for (let i = 0; i < layerSizes[0]; i++) {
          const val = Math.random();
          newValues[`0-${i}`] = { sum: val, output: val, state: 'active' };
        }
        dispatch(updateNeuronValues(newValues));
       }
       setActiveLayer(0);
       setSignals([]);
    } else if (currentStep % 2 === 0) {
        // Activation
        const layerIndex = currentStep / 2;
        setActiveLayer(layerIndex);
        setSignals([]);
        
        const prevLayerIndex = layerIndex - 1;
        const currentVals = neuronValuesRef.current; // Use Ref
        
        const currentLayerNeurons = neurons.filter(n => n.layerIndex === layerIndex);
        const nextValues: Record<string, any> = {};

        currentLayerNeurons.forEach((neuron) => {
            const incoming = connections.filter(c => c.targetIndex === neuron.neuronIndex && c.sourceLayer === prevLayerIndex);
            let sum = 0;
            incoming.forEach(conn => {
                const sVal = currentVals[`${prevLayerIndex}-${conn.sourceIndex}`]?.output || 0;
                sum += sVal * conn.weight;
            });
            sum += neuron.bias;
            nextValues[`${layerIndex}-${neuron.neuronIndex}`] = { sum, output: sum, state: 'sum' };
        });
        
        dispatch(updateNeuronValues(nextValues));

        timeoutRef.current = setTimeout(() => {
            const activated: Record<string, any> = {};
            currentLayerNeurons.forEach(neuron => {
                const key = `${layerIndex}-${neuron.neuronIndex}`;
                const curr = nextValues[key]; // safe to use local var
                if (curr) {
                    const out = Math.max(0, curr.sum);
                    activated[key] = { ...curr, output: out, state: 'active' };
                }
            });
            dispatch(updateNeuronValues(activated));
            timeoutRef.current = undefined;
        }, 1000);

    } else {
        // Signal
        const sourceLayerIndex = (currentStep - 1) / 2;
        setActiveLayer(null);
        // We need current values to know who fires
        // We can use neuronValuesRef.current, but we just updated it in the previous step (even step).
        // So it should be up to date.
        createSignals(sourceLayerIndex, neuronValuesRef.current);
    }

  }, [currentStep, passCount, layerSizes, neurons, connections, dispatch]); 


  const createSignals = (
    sourceLayerIndex: number,
    currentValues: Record<string, { sum: number; output: number; state: 'sum' | 'active' }>
  ) => {
    const relevantConnections = connections.filter(
      (c) => c.sourceLayer === sourceLayerIndex
    );

    const newSignals: Signal[] = [];

    relevantConnections.forEach((conn) => {
      const sourceKey = `${conn.sourceLayer}-${conn.sourceIndex}`;
      const sourceVal = currentValues[sourceKey];

      const isInput = conn.sourceLayer === 0;
      const isActive = sourceVal && sourceVal.output > 0.01;

      if (isInput || isActive) {
        const sourceOutput = sourceVal?.output ?? 0;

        newSignals.push({
          id: `sig-${conn.key}-${Date.now()}`,
          x: conn.x1,
          y: conn.y1,
          targetX: conn.x2,
          targetY: conn.y2,
          progress: 0,
          weight: conn.weight,
          sourceLayer: conn.sourceLayer,
          sourceIndex: conn.sourceIndex,
          sourceOutput,
        });
      }
    });

    setSignals(newSignals);
    animateSignals();
  };

  const animateSignals = () => {
    const startTime = performance.now();
    const duration = 2500;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setSignals((prev) => prev.map((s) => ({ ...s, progress })));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="network-visualization">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Connections & Weights */}
        <g className="connections">
          {connections.map((conn) => {
            const mx = (conn.x1 + conn.x2) / 2;
            const my = (conn.y1 + conn.y2) / 2;
            return (
              <g key={conn.key} className="connection-group">
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
