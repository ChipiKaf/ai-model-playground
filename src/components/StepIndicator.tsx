import React from 'react';
import './StepIndicator.scss';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  onNextStep: () => void;
  onReset: () => void;
  passCount?: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, onNextStep, onReset, passCount = 1 }) => {
  const isFinished = currentStep >= steps.length;

  return (
    <div className="step-indicator">
      <h2>Process Flow <span style={{ fontSize: '0.8em', opacity: 0.6, marginLeft: '10px' }}>Pass {passCount}</span></h2>
      
      <div className="step-list">
        {steps.map((step, index) => {
          let status = 'pending';
          if (index < currentStep) status = 'completed';
          if (index === currentStep) status = 'active';

          return (
            <div key={index} className={`step-item ${status}`}>
              <div className="step-marker">
                <div className="step-circle">
                  {status === 'completed' ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && <div className="step-line" />}
              </div>
              <div className="step-content">
                <div className="step-label">{step}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="controls">
        {isFinished ? (
          <button onClick={onReset} style={{ background: '#4f46e5' }}>
            Start Next Pass
          </button>
        ) : (
          <button onClick={onNextStep}>
            Next Step
          </button>
        )}
      </div>
    </div>
  );
};

export default StepIndicator;
