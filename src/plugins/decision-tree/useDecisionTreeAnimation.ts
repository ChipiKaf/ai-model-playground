import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../../store/store';
import { type DecisionTreeState, stepDataPoints, type DataPoint, initialState } from './decisionTreeSlice';

// Define the state shape this plugin expects
interface StateWithDecisionTree {
  decisionTree: DecisionTreeState;
}

export const useDecisionTreeAnimation = (onAnimationComplete?: () => void) => {
  const dispatch = useDispatch();
  // We rely on currentStep changing to trigger the next animation frame/logic
  const { currentStep } = useSelector((state: RootState) => state.simulation);
  
  const { tree, dataPoints, rootId } = useSelector((state: RootState & StateWithDecisionTree) => state.decisionTree || initialState);

  // Keep callback fresh without triggering effect
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    // When currentStep changes, we trigger the simulation logic.
    
    // Step 0 is "Initialization" (Start). No movement, just unlock.
    if (currentStep === 0) {
        const timer = setTimeout(() => {
            if (onAnimationCompleteRef.current) onAnimationCompleteRef.current();
        }, 0);
        return () => clearTimeout(timer);
    }

    // For subsequent steps, move the data points.
    const timer = setTimeout(() => {
        const allFinished = dataPoints.every((p: DataPoint) => p.isFinished);
        if (!allFinished) {
            dispatch(stepDataPoints());
        }
        
        // Signal completion to Shell so it enables the Next button (or auto-advances)
        if (onAnimationCompleteRef.current) onAnimationCompleteRef.current();
    }, 1000); // 1 second delay for visual effect

    return () => clearTimeout(timer);
  }, [currentStep, dispatch]); // Only run when step changes

  return {
    tree,
    dataPoints,
    rootId
  };
};
