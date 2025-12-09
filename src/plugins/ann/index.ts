import type { ModelPlugin } from '../../types/ModelPlugin';
import annReducer from './annSlice';
import AnnVisualization from './AnnVisualization';

const AnnPlugin: ModelPlugin = {
  id: 'ann',
  name: 'Artificial Neural Network',
  description: 'A classic feedforward neural network visualization.',
  initialState: undefined, // Reducer handles initial state
  reducer: annReducer,
  Component: AnnVisualization,
};

export default AnnPlugin;
