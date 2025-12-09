import React from 'react';
import type { Reducer, Action } from '@reduxjs/toolkit';

export interface ModelPluginComponentProps {
  onAnimationComplete?: () => void;
}

export interface ModelPlugin<State = any, Actions extends Action = any> {
  id: string;
  name: string;
  description: string;
  
  // State Management
  initialState: State;
  reducer: Reducer<State, Actions>;
  
  // Rendering
  Component: React.FC<ModelPluginComponentProps>;
  Controls?: React.FC; // Optional settings panel
  
  // Helpers
  getSteps: (state: State) => string[];
  
  // Lifecycle & Data Access
  init: (dispatch: any) => void; // Using any for dispatch to avoid circular deps or complex types for now
  selector: (state: any) => State; // Using any for root state to avoid circular deps
}
