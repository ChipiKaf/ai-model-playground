import './App.scss'
import NetworkVisualization from './components/NetworkVisualization';

function App() {
  // Example structure: 3 inputs, 5 hidden, 5 hidden, 2 outputs
  const layerSizes = [3, 5, 5, 2];

  return (
    <div className="app">
      <div style={{ width: '100%', height: '100%' }}>
        <NetworkVisualization layerSizes={layerSizes} />
      </div>
    </div>
  )
}

export default App
