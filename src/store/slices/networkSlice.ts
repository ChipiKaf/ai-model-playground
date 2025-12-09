import { createSlice, createEntityAdapter, type PayloadAction, type EntityState } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface NeuronPosition {
  id: string; // `${layerIndex}-${neuronIndex}`
  x: number;
  y: number;
  layerIndex: number;
  neuronIndex: number;
  bias: number;
}

export interface Connection {
  id: string; // `${sourceLayer}-${sourceIndex}-to-${targetLayer}-${targetIndex}` (was key)
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sourceLayer: number;
  sourceIndex: number;
  targetIndex: number;
  weight: number;
}

export interface NeuronValue {
  sum: number;
  output: number;
  state: 'sum' | 'active';
}

// Adapters
export const neuronsAdapter = createEntityAdapter<NeuronPosition>();
export const connectionsAdapter = createEntityAdapter<Connection>();

interface NetworkState {
  layerSizes: number[];
  neurons: EntityState<NeuronPosition, string>;
  connections: EntityState<Connection, string>;
  neuronValues: Record<string, NeuronValue>;
}

const initialState: NetworkState = {
  layerSizes: [3, 5, 5, 2], // Default
  neurons: neuronsAdapter.getInitialState(),
  connections: connectionsAdapter.getInitialState(),
  neuronValues: {},
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setLayerSizes(state, action: PayloadAction<number[]>) {
      state.layerSizes = action.payload;
    },
    initializeNetwork(state) {
      const width = 800;
      const height = 600;
      const paddingX = 100;
      const paddingY = 50;
      
      const positions: NeuronPosition[] = [];
      const layerSpacing = (width - 2 * paddingX) / (state.layerSizes.length - 1);

      state.layerSizes.forEach((size, layerIndex) => {
        const x = paddingX + layerIndex * layerSpacing;
        const layerHeight = height - 2 * paddingY;
        const neuronSpacing = layerHeight / (size + 1);

        for (let i = 0; i < size; i++) {
          positions.push({
            id: `${layerIndex}-${i}`,
            x,
            y: paddingY + (i + 1) * neuronSpacing,
            layerIndex,
            neuronIndex: i,
            bias: Math.random() * 0.4 - 0.2,
          });
        }
      });
      neuronsAdapter.setAll(state.neurons, positions);

      // Generate connections
      const lines: Connection[] = [];
      for (let l = 0; l < state.layerSizes.length - 1; l++) {
        const currentLayerNeurons = positions.filter((n) => n.layerIndex === l);
        const nextLayerNeurons = positions.filter((n) => n.layerIndex === l + 1);

        currentLayerNeurons.forEach((source) => {
          nextLayerNeurons.forEach((target) => {
            const seed = l * 1000 + source.neuronIndex * 100 + target.neuronIndex;
            const raw = Math.sin(seed) * 43758.5453123;
            const pseudoRandom = raw - Math.floor(raw);
            const base = pseudoRandom * 2 - 1;
            const bias = 0.25;
            let signedWeight = base + bias;
            signedWeight = Math.max(-1, Math.min(1, signedWeight));

            lines.push({
              id: `l${l}-n${source.neuronIndex}-to-l${l + 1}-n${target.neuronIndex}`,
              x1: source.x,
              y1: source.y,
              x2: target.x,
              y2: target.y,
              sourceLayer: l,
              sourceIndex: source.neuronIndex,
              targetIndex: target.neuronIndex,
              weight: signedWeight,
            });
          });
        });
      }
      connectionsAdapter.setAll(state.connections, lines);
    },
    updateNeuronValues(state, action: PayloadAction<Record<string, NeuronValue>>) {
      state.neuronValues = { ...state.neuronValues, ...action.payload };
    },
    resetNeuronValues(state) {
      state.neuronValues = {};
    }
  },
});

export const { setLayerSizes, initializeNetwork, updateNeuronValues, resetNeuronValues } = networkSlice.actions;

// Selectors
export const {
  selectAll: selectAllNeurons,
  selectById: selectNeuronById,
} = neuronsAdapter.getSelectors<RootState>((state) => state.network.neurons);

export const {
  selectAll: selectAllConnections,
} = connectionsAdapter.getSelectors<RootState>((state) => state.network.connections);

export default networkSlice.reducer;
