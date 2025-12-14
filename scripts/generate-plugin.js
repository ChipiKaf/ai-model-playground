import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginName = process.argv[2];

if (!pluginName) {
  console.error('Please provide a plugin name (kebab-case), e.g., npm run generate-plugin decision-tree');
  process.exit(1);
}

// Helpers
const toPascalCase = (str) =>
  str.replace(/(^\w|-\w)/g, (clear) => clear.replace(/-/, '').toUpperCase());

const toCamelCase = (str) =>
  str.replace(/-\w/g, (clear) => clear[1].toUpperCase());

const pascalName = toPascalCase(pluginName);
const camelName = toCamelCase(pluginName);
const targetDir = path.join(__dirname, '../src/plugins', pluginName);

if (fs.existsSync(targetDir)) {
  console.error(`Plugin "${pluginName}" already exists at ${targetDir}`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

// 1. Slice
const sliceContent = `import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ${pascalName}State {
  // Define your state here
  value: number;
}

export const initialState: ${pascalName}State = {
  value: 0,
};

const ${camelName}Slice = createSlice({
  name: '${camelName}',
  initialState,
  reducers: {
    setValue(state, action: PayloadAction<number>) {
      state.value = action.payload;
    },
  },
});

export const { setValue } = ${camelName}Slice.actions;
export default ${camelName}Slice.reducer;
`;

fs.writeFileSync(path.join(targetDir, `${camelName}Slice.ts`), sliceContent);

// 2. Animation Hook
const hookContent = `import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../../store/store';
import { type ${pascalName}State, initialState } from './${camelName}Slice';

// Define the state shape this plugin expects
interface StateWith${pascalName} {
  ${camelName}: ${pascalName}State;
}

export const use${pascalName}Animation = (onAnimationComplete?: () => void) => {
  const dispatch = useDispatch();
  // Select from the local slice, falling back to initial state if not yet registered
  const { value } = useSelector((state: RootState & StateWith${pascalName}) => state.${camelName} || initialState);

  useEffect(() => {
    // Animation logic here
    if (onAnimationComplete) {
        // Call when done
    }
  }, [onAnimationComplete]);

  return {
    value,
  };
};
`;

fs.writeFileSync(path.join(targetDir, `use${pascalName}Animation.ts`), hookContent);

// 3. Main Component
const mainComponentContent = `import React from 'react';
import './main.scss';
import { use${pascalName}Animation } from './use${pascalName}Animation';

interface ${pascalName}VisualizationProps {
  onAnimationComplete?: () => void;
}

const ${pascalName}Visualization: React.FC<${pascalName}VisualizationProps> = ({
  onAnimationComplete,
}) => {
  const { value } = use${pascalName}Animation(onAnimationComplete);

  return (
    <div className="${pluginName}-visualization">
      <h2>${pascalName} Visualization</h2>
      <p>Value: {value}</p>
    </div>
  );
};

export default ${pascalName}Visualization;
`;

fs.writeFileSync(path.join(targetDir, 'main.tsx'), mainComponentContent);

// 4. SCSS
const scssContent = `.${pluginName}-visualization {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12px;
  
  h2 {
    color: #334155;
  }
}
`;

fs.writeFileSync(path.join(targetDir, 'main.scss'), scssContent);

// 5. Index
const indexContent = `import type { ModelPlugin } from '../../types/ModelPlugin';
import ${camelName}Reducer, { type ${pascalName}State, initialState } from './${camelName}Slice';
import ${pascalName}Visualization from './main';
import type { Action, Dispatch } from '@reduxjs/toolkit';

type LocalRootState = { ${camelName}: ${pascalName}State };

const ${pascalName}Plugin: ModelPlugin<${pascalName}State, Action, LocalRootState, Dispatch<Action>> = {
  id: '${pluginName}',
  name: '${pascalName}',
  description: 'Description for ${pascalName} model.',
  initialState,
  reducer: ${camelName}Reducer,
  Component: ${pascalName}Visualization,
  getSteps: (_state: ${pascalName}State) => {
    return ['Step 1', 'Step 2'];
  },
  init: (dispatch) => {
    // Initialization logic
  },
  selector: (state: LocalRootState) => state.${camelName},
};

export default ${pascalName}Plugin;
`;

fs.writeFileSync(path.join(targetDir, 'index.ts'), indexContent);

console.log('Successfully created plugin "' + pluginName + '" in src/plugins/' + pluginName);
console.log("Don't forget to register it in src/store/store.ts!");
