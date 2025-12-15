import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../../store/store';
import { 
  updateNeuronValues, 
  resetNeuronValues, 
  selectAllNeurons, 
  selectAllConnections,
  type NeuronValue
} from './annSlice';

export interface Signal {
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
  targetLayer: number;
  targetIndex: number;
}

export const useAnnAnimation = (onAnimationComplete?: () => void) => {
  const dispatch = useDispatch();
  const { layerSizes, neuronValues } = useSelector((state: RootState) => state.network);
  const neurons = useSelector(selectAllNeurons);
  const connections = useSelector(selectAllConnections);
  const { currentStep, passCount } = useSelector((state: RootState) => state.simulation);

  // Animation State (Visual only)
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  
  const animationRef = useRef<number | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const neuronValuesRef = useRef(neuronValues);

  // Keep ref in sync
  useEffect(() => {
      neuronValuesRef.current = neuronValues;
  }, [neuronValues]);

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
      
      if (layerSizes.length > 0) {
        const newValues: Record<string, NeuronValue> = {};
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
      
      // Step 0 is instant, so complete immediately
      setTimeout(() => onAnimationComplete?.(), 0);

    } else if (currentStep % 2 === 0) {
      // ... (Activation) ...
      const layerIndex = currentStep / 2;
      setActiveLayer(layerIndex);
      setSignals([]);

      const prevLayerIndex = layerIndex - 1;
      const currentVals = neuronValuesRef.current;

      const currentLayerNeurons = neurons.filter(
        (n) => n.layerIndex === layerIndex
      );

      // Calculate sums immediately
      const nextValues: Record<string, NeuronValue> = {};

      currentLayerNeurons.forEach((neuron) => {
        const incomingConnections = connections.filter(
          (c) =>
            c.targetIndex === neuron.neuronIndex &&
            c.sourceLayer === prevLayerIndex
        );

        let weightedSum = 0;
        incomingConnections.forEach((conn) => {
          const sourceVal =
            currentVals[`${prevLayerIndex}-${conn.sourceIndex}`]?.output || 0;
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
        const activatedValues: Record<string, NeuronValue> = {};
        currentLayerNeurons.forEach((neuron) => {
          const key = `${layerIndex}-${neuron.neuronIndex}`;
          const current = nextValues[key] || neuronValuesRef.current[key];
          if (current) {
            const output = Math.max(0, current.sum); // ReLU
            activatedValues[key] = { ...current, output, state: 'active' };
          }
        });
        dispatch(updateNeuronValues(activatedValues));
        timeoutRef.current = undefined;
        onAnimationComplete?.();
      }, 1000);

    } else {
      // Signal Transmission
      const sourceLayerIndex = (currentStep - 1) / 2;
      setActiveLayer(null);
      createSignals(sourceLayerIndex, neuronValuesRef.current);
    }
  }, [currentStep, passCount, layerSizes, neurons, connections, dispatch]);

  const createSignals = (
    sourceLayerIndex: number,
    currentValues: Record<string, NeuronValue>
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
          id: `sig-${conn.id}-${Date.now()}`,
          x: conn.x1,
          y: conn.y1,
          targetX: conn.x2,
          targetY: conn.y2,
          progress: 0,
          weight: conn.weight,
          sourceLayer: conn.sourceLayer,
          sourceIndex: conn.sourceIndex,
          sourceOutput,
          targetLayer: conn.sourceLayer + 1,
          targetIndex: conn.targetIndex,
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

  return {
    signals,
    activeLayer,
    neurons,
    connections,
    neuronValues,
    layerSizes
  };
};
