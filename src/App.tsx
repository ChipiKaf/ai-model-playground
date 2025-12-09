import { useState } from 'react';
import './App.scss'
import NetworkVisualization from './components/NetworkVisualization';
import NeuronDetail from './components/NeuronDetail';

function App() {
  // Example structure: 3 inputs, 5 hidden, 5 hidden, 2 outputs
  const layerSizes = [3, 5, 5, 2];
  const [selectedNeuron, setSelectedNeuron] = useState<{layer: number, neuron: number} | null>(null);

  return (
    <div className="app">
      <div style={{ width: '100%', height: '100%' }}>
        <NetworkVisualization 
          layerSizes={layerSizes} 
          onNeuronSelect={(layer, neuron) => setSelectedNeuron({layer, neuron})}
        />
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
