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
}
