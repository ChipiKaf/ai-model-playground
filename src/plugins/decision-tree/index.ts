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
  restartConfig: {
    text: 'Restart',
  },
  getSteps: (_state: DecisionTreeState) => {
    return [
        { label: 'Initialization', autoAdvance: false, nextButtonText: 'Start' },
        { label: 'Level 1 Decision', autoAdvance: false },
        { label: 'Level 2 Decision', autoAdvance: true }
    ];
  },
  init: (dispatch) => {
    dispatch({ type: 'decisionTree/resetTree' }); // Dispatching raw action or import action creator
  },
  selector: (state: LocalRootState) => state.decisionTree,
};

export default DecisionTreePlugin;
