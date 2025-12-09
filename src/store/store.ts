import { configureStore } from '@reduxjs/toolkit';
import simulationReducer from './slices/simulationSlice';
import AnnPlugin from '../plugins/ann';

export const store = configureStore({
  reducer: {
    network: AnnPlugin.reducer, // For now, we hardcode 'network' to ANN. Later we can make this dynamic.
    simulation: simulationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
