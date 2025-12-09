import { useState, useMemo } from 'react';
import './App.scss'
import NetworkVisualization from './components/NetworkVisualization';
import NeuronDetail from './components/NeuronDetail';
import StepIndicator from './components/StepIndicator';

function App() {
  // Example structure: 3 inputs, 5 hidden, 5 hidden, 2 outputs
  const layerSizes = [3, 5, 5, 2];
  const [selectedNeuron, setSelectedNeuron] = useState<{layer: number, neuron: number} | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [passCount, setPassCount] = useState(1);

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
          onNextStep={() => setCurrentStep(prev => Math.min(prev + 1, steps.length))} 
          onReset={() => {
            setCurrentStep(0);
            setPassCount(prev => prev + 1);
          }}
          passCount={passCount}
          isProcessing={currentStep % 2 !== 0}
        />
        
        <div style={{ flex: 1, position: 'relative' }}>
          <NetworkVisualization 
            layerSizes={layerSizes} 
            currentStep={currentStep}
            onNeuronSelect={(layer, neuron) => setSelectedNeuron({layer, neuron})}
            onAnimationComplete={() => setCurrentStep(prev => Math.min(prev + 1, steps.length))}
            passCount={passCount}
          />
        </div>
      </div>

      {selectedNeuron && (
        <NeuronDetail 
          layerIndex={selectedNeuron.layer} 
          neuronIndex={selectedNeuron.neuron} 
          onClose={() => setSelectedNeuron(null)} 
        />
      )}
    </div>
  )
}

export default App
