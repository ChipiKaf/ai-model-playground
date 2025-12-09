import type { ModelPlugin } from '../../types/ModelPlugin';
import annReducer, { initializeNetwork } from './annSlice';
import AnnVisualization from './AnnVisualization';

const AnnPlugin: ModelPlugin = {
  id: 'ann',
  name: 'Artificial Neural Network',
  description: 'A classic feedforward neural network visualization.',
  initialState: undefined, // Reducer handles initial state
  reducer: annReducer,
  Component: AnnVisualization,
  getSteps: (state: any) => {
    // state is the NetworkState
    const { layerSizes } = state;
    const s = ['Input Layer Initialization'];
    for (let i = 0; i < layerSizes.length - 1; i++) {
        s.push(`Layer ${i + 1} Activation`);
        s.push(`Signal Transmission to Layer ${i + 2}`);
    }
    return s;
  },
  init: (dispatch) => {
    dispatch(initializeNetwork());
  },
  selector: (state) => state.network,
};

export default AnnPlugin;
