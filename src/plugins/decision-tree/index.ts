import type { ModelPlugin } from '../../types/ModelPlugin';
import decisionTreeReducer, { type DecisionTreeState, initialState } from './decisionTreeSlice';
import DecisionTreeVisualization from './main';
import type { Action, Dispatch } from '@reduxjs/toolkit';

type LocalRootState = { decisionTree: DecisionTreeState };

const DecisionTreePlugin: ModelPlugin<DecisionTreeState, Action, LocalRootState, Dispatch<Action>> = {
  id: 'decision-tree',
  name: 'DecisionTree',
  description: 'Description for DecisionTree model.',
  initialState,
  reducer: decisionTreeReducer,
  Component: DecisionTreeVisualization,
  getSteps: (_state: DecisionTreeState) => {
    return [
        { label: 'Step 1', autoAdvance: false },
        { label: 'Step 2', autoAdvance: false }
    ];
  },
  init: (dispatch) => {
    dispatch({ type: 'decisionTree/resetTree' }); // Dispatching raw action or import action creator
  },
  selector: (state: LocalRootState) => state.decisionTree,
};

export default DecisionTreePlugin;
