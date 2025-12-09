import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './App.scss'
import NetworkVisualization from './components/NetworkVisualization';
import NeuronDetail from './components/NeuronDetail';
import StepIndicator from './components/StepIndicator';
import { type RootState } from './store/store';
import { initializeNetwork } from './store/slices/networkSlice';
import { nextStep, incrementPass, selectNeuron, resetSimulation } from './store/slices/simulationSlice';

function App() {
  const dispatch = useDispatch();
  const { layerSizes } = useSelector((state: RootState) => state.network);
  const { currentStep, passCount, selectedNeuron } = useSelector((state: RootState) => state.simulation);

  useEffect(() => {
    dispatch(initializeNetwork());
  }, [dispatch, layerSizes]); // Re-init if layer sizes change (though they are static for now)

  // Generate steps based on layer structure
  const steps = useMemo(() => {
    const stepList: string[] = [];
    for (let i = 0; i < layerSizes.length; i++) {
      if (i === 0) {
        stepList.push("Input Layer Receives Data");
      } else {
        stepList.push(`Signals Travel to ${i === layerSizes.length - 1 ? 'Output Layer' : `Hidden Layer ${i}`}`);
        stepList.push(`${i === layerSizes.length - 1 ? 'Output Layer' : `Hidden Layer ${i}`} Processes`);
      }
    }
    return stepList;
  }, [layerSizes]);

  return (
    <div className="app">
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
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
        
        <div style={{ flex: 1, position: 'relative' }}>
          <NetworkVisualization 
            onAnimationComplete={() => dispatch(nextStep(steps.length))}
          />
        </div>
      </div>

      {selectedNeuron && (
        <NeuronDetail 
          data={selectedNeuron}
          onClose={() => dispatch(selectNeuron(null))} 
        />
      )}
    </div>
  )
}

export default App
