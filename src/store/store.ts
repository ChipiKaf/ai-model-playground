import { configureStore } from '@reduxjs/toolkit';
import networkReducer from './slices/networkSlice';
import simulationReducer from './slices/simulationSlice';

export const store = configureStore({
  reducer: {
    network: networkReducer,
    simulation: simulationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
