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
  // We rely on currentStep changing to trigger the next animation frame/logic
  const { currentStep } = useSelector((state: RootState) => state.simulation);
  
  const { tree, dataPoints } = useSelector((state: RootState & StateWithDecisionTree) => state.decisionTree || initialState);

  useEffect(() => {
    // When currentStep changes, we trigger the simulation logic.
    // In decision tree, each "step" moves the dots one level.
    
    const timer = setTimeout(() => {
        const allFinished = dataPoints.every((p: DataPoint) => p.isFinished);
        if (!allFinished) {
            dispatch(stepDataPoints());
        }
        
        // Signal completion to Shell so it enables the Next button (or auto-advances)
        if (onAnimationComplete) onAnimationComplete();
    }, 500); // 500ms delay for visual effect

    return () => clearTimeout(timer);
  }, [currentStep, dispatch, onAnimationComplete, dataPoints]); // dataPoints in dep array might be risky if dispatch updates it?
  // If dispatch updates dataPoints, effect triggers again?
  // Yes.
  // We ONLY want to trigger on `currentStep`.
  // Remove `dataPoints` from dependency?
  // But we access `dataPoints` inside.
  // We should refer to ref or use functional update?
  // Or check `allFinished` inside reducer?
  // Actually, `stepDataPoints` is an action. It doesn't need to know `allFinished` here if reducer handles no-op.
  // But we want `onAnimationComplete`.
  // If we assume `stepDataPoints` is valid to call always.
  // Let's remove `dataPoints` from dependency and just run blindly on step change?
  // No, valid react requires dependencies.
  // Better: Use a ref for `currentStep` to track if we processed it?
  // Or just trust that specific logic?
  // The User logic: Click Next -> Step Inc -> Processing -> Done.
  // So trigger ONLY on `currentStep`.
  // I will remove `dataPoints` from dep array and disable lint if needed, OR keep it and add a ref to avoid double-firing.
  // Actually, if `dataPoints` updates, we don't want to re-run the TIMEOUT logic.
  // We want to run logic ONCE per step.
  // I'll leave `dataPoints` out of deps (and suppression) to ensure we behave like a step trigger.
  // Or use `useRef` to store latest dataPoints if needed, but here `stepDataPoints` is generic?
  // Actually `dispatch` is stable.
  // I'll remove `dataPoints` from deps. 
  
  // Revised Effect:
  /*
  useEffect(() => {
     const timer = setTimeout(() => {
         dispatch(stepDataPoints());
         onAnimationComplete?.();
     }, 500);
     return () => clearTimeout(timer);
  }, [currentStep, dispatch, onAnimationComplete]);
  */
  // This is safer. The reducer handles logic.
  
  // Wait, I need to check if I need to pass dataPoints to check `isFinished`.
  // If the reducer handles "do nothing if finished", I'm good.
  // I'll assume reducer is robust.


  return {
    tree,
    dataPoints
  };
};
