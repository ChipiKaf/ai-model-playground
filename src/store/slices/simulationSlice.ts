import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Re-defining NeuronData here to avoid circular dependency or just for cleanliness if we move it later
// But for now let's define a compatible interface or import it.
// Actually, let's define it here to be self-contained.
export interface NeuronDetailData {
  layerIndex: number;
  neuronIndex: number;
  bias: number;
  output: number;
  inputs: number[];
  weights: number[];
}

interface SimulationState {
  currentStep: number;
  passCount: number;
  isPlaying: boolean;
  selectedNeuron: NeuronDetailData | null;
}

const initialState: SimulationState = {
  currentStep: 0,
  passCount: 1,
  isPlaying: false,
  selectedNeuron: null,
};

const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    nextStep(state, action: PayloadAction<number>) {
        // action.payload is maxSteps
        state.currentStep = Math.min(state.currentStep + 1, action.payload);
    },
    setStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload;
    },
    incrementPass(state) {
      state.passCount += 1;
    },
    resetSimulation(state) {
        state.currentStep = 0;
        state.passCount = 1;
        state.isPlaying = false;
        state.selectedNeuron = null;
    },
    setIsPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
    },
    selectNeuron(state, action: PayloadAction<NeuronDetailData | null>) {
      state.selectedNeuron = action.payload;
    },
  },
});

export const { nextStep, setStep, incrementPass, resetSimulation, setIsPlaying, selectNeuron } = simulationSlice.actions;
export default simulationSlice.reducer;
