import React from 'react';
import './StepIndicator.scss';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  onNextStep: () => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, onNextStep }) => {
  const isFinished = currentStep >= steps.length;

  return (
    <div className="step-indicator">
      <h2>Process Flow</h2>
      
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
        <button onClick={onNextStep} disabled={isFinished}>
          {isFinished ? 'Completed' : 'Next Step'}
        </button>
      </div>
    </div>
  );
};

export default StepIndicator;
