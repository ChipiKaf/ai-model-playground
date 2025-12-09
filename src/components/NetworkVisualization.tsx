import React, { useMemo, useState, useEffect, useRef } from 'react';
import './NetworkVisualization.scss';

interface NetworkVisualizationProps {
  layerSizes: number[];
  currentStep: number;
  onNeuronSelect?: (data: NeuronData) => void;
  onAnimationComplete?: () => void;
  passCount?: number;
}

export interface NeuronData {
  layerIndex: number;
  neuronIndex: number;
  bias: number;
  output: number;
  inputs: number[];
  weights: number[];
}

interface NeuronPosition {
  x: number;
  y: number;
  layerIndex: number;
  neuronIndex: number;
  bias: number; // Fixed bias for this neuron
}

interface Signal {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  weight?: number;

  // NEW: info about the source neuron so all signals from it can share size
  sourceLayer: number;
  sourceIndex: number;
  sourceOutput: number; // the neuron's activation/output value
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  layerSizes,
  currentStep,
  onNeuronSelect,
  onAnimationComplete,
  passCount = 1,
}) => {
  // Constants for layout
  const width = 800;
  const height = 600;
  const paddingX = 100;
  const paddingY = 50;
  const neuronRadius = 15;

  // Animation State
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [neuronValues, setNeuronValues] = useState<
    Record<string, { sum: number; output: number; state: 'sum' | 'active' }>
  >({});
  const animationRef = useRef<number | undefined>(undefined);

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
          bias: Math.random() * 0.4 - 0.2, // Random bias between -0.2 and 0.2
        });
      }
    });

    return positions;
  }, [layerSizes]);

  // Generate connections
  const connections = useMemo(() => {
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      key: string;
      sourceLayer: number;
      sourceIndex: number;
      targetIndex: number;
      weight: number;
    }[] = [];

    for (let l = 0; l < layerSizes.length - 1; l++) {
      const currentLayerNeurons = neurons.filter((n) => n.layerIndex === l);
      const nextLayerNeurons = neurons.filter((n) => n.layerIndex === l + 1);

      currentLayerNeurons.forEach((source) => {
        nextLayerNeurons.forEach((target) => {
          const seed = l * 1000 + source.neuronIndex * 100 + target.neuronIndex;

          // Deterministic pseudo-random in [0, 1)
          const raw = Math.sin(seed) * 43758.5453123;
          const pseudoRandom = raw - Math.floor(raw); // 0..1

          // Base weight in [-1, 1]
          const base = pseudoRandom * 2 - 1;

          // 🔹 Slight bias towards positive:
          // shift distribution right by ~0.25 then clamp back to [-1, 1]
          const bias = 0.25; // tweak this (0.1 .. 0.3) to taste
          let signedWeight = base + bias;
          signedWeight = Math.max(-1, Math.min(1, signedWeight));

          lines.push({
            x1: source.x,
            y1: source.y,
            x2: target.x,
            y2: target.y,
            key: `l${l}-n${source.neuronIndex}-to-l${l + 1}-n${target.neuronIndex}`,
            sourceLayer: l,
            sourceIndex: source.neuronIndex,
            targetIndex: target.neuronIndex,
            weight: signedWeight,
          });
        });
      });
    }
    return lines;
  }, [layerSizes, neurons]);

  // Handle Step Changes
  useEffect(() => {
    if (currentStep === 0) {
      if (passCount === 1) {
        // First pass: Initialize Input Layer immediately
        setNeuronValues({});
        const newValues: Record<
          string,
          { sum: number; output: number; state: 'active' }
        > = {};
        for (let i = 0; i < layerSizes[0]; i++) {
          const val = Math.random();
          newValues[`0-${i}`] = {
            sum: val,
            output: val,
            state: 'active',
          }; // Input layer
        }
        setNeuronValues(newValues as any);
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

      setNeuronValues((prev) => {
        const next = { ...prev };

        currentLayerNeurons.forEach((neuron) => {
          const incomingConnections = connections.filter(
            (c) =>
              c.targetIndex === neuron.neuronIndex &&
              c.sourceLayer === prevLayerIndex
          );

          let weightedSum = 0;
          incomingConnections.forEach((conn) => {
            const sourceVal =
              prev[`${prevLayerIndex}-${conn.sourceIndex}`]?.output || 0;
            weightedSum += sourceVal * conn.weight;
          });

          // Bias (fixed per neuron)
          weightedSum += neuron.bias;

          next[`${layerIndex}-${neuron.neuronIndex}`] = {
            sum: weightedSum,
            output: weightedSum, // placeholder before activation
            state: 'sum',
          };
        });

        return next;
      });

      setTimeout(() => {
        setNeuronValues((prev) => {
          const next = { ...prev };
          currentLayerNeurons.forEach((neuron) => {
            const key = `${layerIndex}-${neuron.neuronIndex}`;
            const current = next[key];
            if (current) {
              const output = Math.max(0, current.sum); // ReLU
              next[key] = { ...current, output, state: 'active' };
            }
          });
          return next;
        });
      }, 1000);
    } else {
      // Signal Transmission
      const sourceLayerIndex = (currentStep - 1) / 2;
      setActiveLayer(null);

      let valuesForSignal = neuronValues;

      if (sourceLayerIndex === 0 && passCount > 1) {
        const newInputs: Record<
          string,
          { sum: number; output: number; state: 'active' }
        > = {};
        for (let i = 0; i < layerSizes[0]; i++) {
          const val = Math.random();
          newInputs[`0-${i}`] = { sum: val, output: val, state: 'active' };
        }

        setNeuronValues((prev) => ({ ...prev, ...newInputs }));
        valuesForSignal = { ...neuronValues, ...newInputs };
      }

      createSignals(sourceLayerIndex, valuesForSignal);
    }
  }, [currentStep, connections, layerSizes, passCount, neurons]);

  const createSignals = (
    sourceLayerIndex: number,
    currentValues: Record<
      string,
      { sum: number; output: number; state: 'sum' | 'active' }
    >
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
          sourceOutput, // <-- same value for all edges from this neuron
        });
      }
    });

    setSignals(newSignals);
    animateSignals();
  };

  const animateSignals = () => {
    const startTime = performance.now();
    const duration = 2500; // 2.5s

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
                {/* Visible line */}
                <line
                  x1={conn.x1}
                  y1={conn.y1}
                  x2={conn.x2}
                  y2={conn.y2}
                  className="connection"
                />
                
                {/* Invisible wide line for easier hovering */}
                <line
                  x1={conn.x1}
                  y1={conn.y1}
                  x2={conn.x2}
                  y2={conn.y2}
                  className="connection-hit-area"
                />

                {/* Weight Label */}
                <text
                  x={mx}
                  y={my}
                  className="weight-label"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {conn.weight.toFixed(2)}
                </text>

                {/* Active Flow Line (if active) */}
                {activeLayer === conn.sourceLayer && conn.weight > 0 && (
                  <line
                    x1={conn.x1}
                    y1={conn.y1}
                    x2={conn.x2}
                    y2={conn.y2}
                    className="idle-flow"
                  />
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

            // Radius based on source neuron's output:
            // all signals from that neuron share this value.
            let v = Math.abs(sig.sourceOutput); // magnitude
            // normalize: anything >= 1 just treated as "strong"
            if (v > 1) v = 1;
            const radius = 2 + v * 4; // 2px .. 6px

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
            const val =
              neuronValues[`${neuron.layerIndex}-${neuron.neuronIndex}`];
            const isVisible = val !== undefined;

            let neuronClass = `neuron ${
              activeLayer === neuron.layerIndex ? 'active' : ''
            }`;
            let displayValue = '';

            if (isVisible) {
              if (val.state === 'sum') {
                neuronClass += val.sum < 0 ? ' negative' : ' positive';
                displayValue = val.sum.toFixed(1);
              } else {
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
              <g
                key={`neuron-group-${neuron.layerIndex}-${neuron.neuronIndex}`}
              >
                <circle
                  cx={neuron.x}
                  cy={neuron.y}
                  r={neuronRadius}
                  className={neuronClass}
                  onClick={() => {
                    if (!onNeuronSelect) return;

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

                    onNeuronSelect({
                      layerIndex: neuron.layerIndex,
                      neuronIndex: neuron.neuronIndex,
                      bias: neuron.bias,
                      output: val?.output || 0,
                      inputs,
                      weights,
                    });
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
