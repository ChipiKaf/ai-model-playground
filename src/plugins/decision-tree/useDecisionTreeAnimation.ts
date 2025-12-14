import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../../store/store';
import { type DecisionTreeState, stepDataPoints, type DataPoint, initialState } from './decisionTreeSlice';

// Define the state shape this plugin expects
interface StateWithDecisionTree {
  decisionTree: DecisionTreeState;
}

export const useDecisionTreeAnimation = (onAnimationComplete?: () => void) => {
  const dispatch = useDispatch();
  // We need to know if the simulation is currently "processing" (animating)
  const { currentStep } = useSelector((state: RootState) => state.simulation);
  const isProcessing = currentStep % 2 !== 0; // Odd steps are usually "processing" in this app's logic
  
  const { tree, dataPoints } = useSelector((state: RootState & StateWithDecisionTree) => state.decisionTree || initialState);

  useEffect(() => {
    if (isProcessing) {
        // If we represent a "step" as moving data points forward:
        const allFinished = dataPoints.every((p: DataPoint) => p.isFinished);
        
        if (!allFinished) {
            // Visualize the move with a slight delay or immediately
            const timer = setTimeout(() => {
                dispatch(stepDataPoints());
                // If we want to wait for visual transition, we might delay onAnimationComplete
                // For now, let's signal complete immediately after dispatch to let Shell advance
                if (onAnimationComplete) onAnimationComplete();
            }, 500); // 500ms delay to simulate "thinking" or travel time
            return () => clearTimeout(timer);
        } else {
             // If all finished, just complete
             if (onAnimationComplete) onAnimationComplete();
        }
    }
  }, [isProcessing, dispatch, onAnimationComplete, dataPoints]);

  return {
    tree,
    dataPoints
  };
};
