import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './App.scss'
import NeuronDetail from './components/NeuronDetail';
import StepIndicator from './components/StepIndicator';
import { type RootState } from './store/store';
import { initializeNetwork } from './plugins/ann/annSlice';
import { nextStep, incrementPass, selectNeuron, resetSimulation } from './store/slices/simulationSlice';
import AnnPlugin from './plugins/ann';

function App() {
  const dispatch = useDispatch();
  const { layerSizes } = useSelector((state: RootState) => state.network);
  const { currentStep, passCount, selectedNeuron } = useSelector((state: RootState) => state.simulation);

  useEffect(() => {
    dispatch(initializeNetwork());
  }, [dispatch, layerSizes]);

  // Generate steps based on layer sizes
  const steps = useMemo(() => {
    const s = ['Input Layer Initialization'];
    for (let i = 0; i < layerSizes.length - 1; i++) {
        s.push(`Layer ${i + 1} Activation`);
        s.push(`Signal Transmission to Layer ${i + 2}`);
    }
    return s;
  }, [layerSizes]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Neural Network Playground</h1>
        <p>Interactive visualization of a feedforward neural network</p>
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
           <AnnPlugin.Component 
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
