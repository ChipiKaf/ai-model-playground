import React from 'react';
import type { NeuronData } from './NetworkVisualization';
import './NeuronDetail.scss';

interface NeuronDetailProps {
  data: NeuronData;
  onClose: () => void;
}

const NeuronDetail: React.FC<NeuronDetailProps> = ({ data, onClose }) => {
  const { layerIndex, neuronIndex, inputs, weights, bias, output } = data;

  // Calculate Weighted Sum (re-calculate for display, though we have output)
  // Note: output might be ReLU(sum), so we want the raw sum for Step 1
  const isInputLayer = layerIndex === 0;
  
  const weightedSum = isInputLayer
    ? output // For input layer, "sum" is just the value
    : inputs.reduce((acc, val, idx) => acc + val * weights[idx], 0) + bias;

  // Activation Function (ReLU)
  const activation = isInputLayer ? output : Math.max(0, weightedSum);

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="neuron-detail">
        <div className="header">
          <h2>Neuron Inspector (Layer {layerIndex}, Neuron {neuronIndex})</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="content">
          <div className="visualization-section">
            {/* Step 1: Weighted Sum */}
            <div className="step-container">
              <h3>{isInputLayer ? 'Input Value' : 'Step 1: Weighted Sum'}</h3>
              <div className="math-visual">
                {isInputLayer ? (
                  <div className="input-group">
                    <span className="value">{output.toFixed(2)}</span>
                    <span className="weight">(Raw Input)</span>
                  </div>
                ) : (
                  <>
                    {inputs.length === 0 ? (
                      <div className="input-group">
                        <span className="value">No Inputs</span>
                      </div>
                    ) : (
                      inputs.map((input, idx) => (
                        <div key={idx} className="input-group">
                          <span className="value">{input.toFixed(1)}</span>
                          <span className="operator">&times;</span>
                          <span className="weight">{weights[idx].toFixed(1)}</span>
                          {idx < inputs.length - 1 && <span className="operator" style={{marginLeft: '0.5rem'}}>+</span>}
                        </div>
                      ))
                    )}
                    <span className="operator">+</span>
                    <div className="input-group">
                      <span className="value">{bias.toFixed(1)}</span>
                      <span className="weight">(Bias)</span>
                    </div>
                    <span className="operator">=</span>
                    <span className="result">{weightedSum.toFixed(2)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Step 2: Activation */}
            <div className="step-container">
              <h3>Step 2: Activation (ReLU)</h3>
              <div className="math-visual">
                <span className="operator">max(0, </span>
                <span className="value">{weightedSum.toFixed(2)}</span>
                <span className="operator">) = </span>
                <span className="result">{activation.toFixed(2)}</span>
              </div>
              <div className="activation-graph">
                {/* SVG Graph could go here */}
                <svg width="100%" height="100%" viewBox="0 0 200 100">
                  <line x1="10" y1="90" x2="190" y2="90" stroke="#4b5563" strokeWidth="2" /> {/* X-axis */}
                  <line x1="100" y1="10" x2="100" y2="90" stroke="#4b5563" strokeWidth="2" /> {/* Y-axis */}
                  
                  {/* ReLU Line */}
                  <polyline 
                    points="10,90 100,90 190,10" 
                    fill="none" 
                    stroke="#34d399" 
                    strokeWidth="3" 
                  />
                  
                  {/* Current Point */}
                  <circle 
                    cx={weightedSum > 0 ? 100 + weightedSum * 40 : 100 + weightedSum * 40} 
                    cy={weightedSum > 0 ? 90 - weightedSum * 40 : 90} 
                    r="5" 
                    fill="#f472b6" 
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="narrative-section">
            <h3>The Story of this Neuron</h3>
            <p>
              <strong>1. Gathering Info:</strong> This neuron receives signals from the previous layer. Some signals are strong (positive), others are inhibitory (negative).
            </p>
            <p>
              <strong>2. Weighing Importance:</strong> Each input is multiplied by a "weight". This weight represents how important that specific input is to this neuron's job.
            </p>
            <p>
              <strong>3. The Decision:</strong> Finally, the neuron adds a bias and runs the total through an "activation function" (ReLU). This decides if the neuron should "fire" (pass a signal forward) or stay silent.
            </p>
            <p>
              In this case, the total was <strong>{weightedSum.toFixed(2)}</strong>, so the neuron fires with an intensity of <strong>{activation.toFixed(2)}</strong>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default NeuronDetail;
