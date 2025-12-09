import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store/store';
import { nextStep, incrementPass, resetSimulation, selectNeuron } from '../store/slices/simulationSlice';
import type { ModelPlugin } from '../types/ModelPlugin';
import StepIndicator from './components/StepIndicator';
import NeuronDetail from '../components/NeuronDetail';

interface ShellProps {
  plugin: ModelPlugin;
}

const Shell: React.FC<ShellProps> = ({ plugin }) => {
  const dispatch = useDispatch();
  const simulationState = useSelector((state: RootState) => state.simulation);
  
  // Use the plugin's selector to get its specific state
  const modelState = useSelector(plugin.selector);

  React.useEffect(() => {
     // Initialize the plugin on mount
     plugin.init(dispatch);
  }, [dispatch, plugin]);

  const steps = plugin.getSteps(modelState);
  const { currentStep, passCount } = simulationState;

  return (
    <div className="app">
      <header className="app-header">
        <h1>{plugin.name}</h1>
        <p>{plugin.description}</p>
      </header>

      <div className="main-content">
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onNextStep={() => dispatch(nextStep(steps.length))}
          onReset={() => {
            dispatch(resetSimulation());
            dispatch(incrementPass());
          }}
          passCount={passCount}
          isProcessing={currentStep % 2 !== 0}
        />
        
        <div className="visualization-container">
           <plugin.Component 
             onAnimationComplete={() => dispatch(nextStep(steps.length))}
           />
        </div>
      </div>

      {simulationState.selectedNeuron && (
        <NeuronDetail
          data={simulationState.selectedNeuron}
          onClose={() => dispatch(selectNeuron(null))}
        />
      )}
    </div>
  );
};

export default Shell;
