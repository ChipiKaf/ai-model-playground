import type { ModelPlugin } from '../../types/ModelPlugin';
import annReducer, { initializeNetwork, type NetworkState, initialState } from './annSlice';
import AnnVisualization from './main';
import { type RootState } from '../../store/store';

const AnnPlugin: ModelPlugin<NetworkState> = {
  id: 'ann',
  name: 'Artificial Neural Network',
  description: 'A classic feedforward neural network visualization.',
  initialState,
  reducer: annReducer,
  Component: AnnVisualization,
  getSteps: (state: NetworkState) => {
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
  selector: (state: RootState) => state.network,
};

export default AnnPlugin;
