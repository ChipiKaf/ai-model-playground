import './App.scss'
import Shell from './viz-kit/Shell';
import AnnPlugin from './plugins/ann';

function App() {
  return (
    <Shell plugin={AnnPlugin} />
  )
}

export default App
