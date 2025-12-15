import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { resetSimulation } from '../../store/slices/simulationSlice';

export interface TreeNode {
  id: string;
  type: 'internal' | 'leaf';
  label: string; // Display text (e.g., "x > 0.5" or "Class A")
  // For internal nodes
  feature?: string;
  threshold?: number;
  children?: {
    left: string; // ID of left child (true path)
    right: string; // ID of right child (false path)
  };
  // For leaf nodes
  prediction?: string;
  // Visual layout
  x?: number;
  y?: number;
}

export interface DataPoint {
  id: string;
  features: Record<string, number>;
  expectedLabel: string;
  currentNodeId: string; // Where the point currently is
  isFinished: boolean;   // True if it reached a leaf
  history: string[];     // Path taken
}

export interface DecisionTreeState {
  tree: Record<string, TreeNode>;
  rootId: string;
  dataPoints: DataPoint[];
  speed: number;
}

// A simple mock tree (XOR-like problem or simple classification)
// Root: x > 0.5?
// Left: y > 0.5? -> A / B
// Right: y > 0.5? -> B / A
const initialTree: Record<string, TreeNode> = {
  'root': {
    id: 'root',
    type: 'internal',
    label: 'x > 0.5?',
    feature: 'x',
    threshold: 0.5,
    children: { left: 'n1', right: 'n2' },
    x: 400, y: 50
  },
  'n1': { // Left (False path for x > 0.5? i.e. x <= 0.5)
    id: 'n1',
    type: 'internal',
    label: 'y > 0.5?',
    feature: 'y',
    threshold: 0.5,
    children: { left: 'leaf1', right: 'leaf2' },
    x: 200, y: 200
  },
  'n2': { // Right (True path for x > 0.5?)
    id: 'n2',
    type: 'internal',
    label: 'y > 0.5?',
    feature: 'y',
    threshold: 0.5,
    children: { left: 'leaf3', right: 'leaf4' },
    x: 600, y: 200
  },
  'leaf1': { // x <= 0.5, y <= 0.5
    id: 'leaf1',
    type: 'leaf',
    label: 'Class A',
    prediction: 'A',
    x: 100, y: 400
  },
  'leaf2': { // x <= 0.5, y > 0.5
    id: 'leaf2',
    type: 'leaf',
    label: 'Class B',
    prediction: 'B',
    x: 300, y: 400
  },
  'leaf3': { // x > 0.5, y <= 0.5 (Wait, logic check: if x > 0.5 is FALSE, it goes left. So left child matches condition FALSE)
             // Standard Convention: Left = True, Right = False OR Left = <, Right = >=.
             // Let's stick to: Left = Condition True ( < Threshold in many libs, or just "Yes"), Right = "No"
             // Let's define: Left child is when condition is TRUE? Or False?
             // Usually: Condition: x < 0.5. True -> Left.
             // Let's explicitly define in logic: if (val < threshold) go left else right.
    id: 'leaf3',
    type: 'leaf',
    label: 'Class B',
    prediction: 'B',
    x: 500, y: 400
  },
  'leaf4': { // x > 0.5, y > 0.5
    id: 'leaf4',
    type: 'leaf',
    label: 'Class A',
    prediction: 'A',
    x: 700, y: 400
  }
};

const generateDataPoints = (count: number): DataPoint[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `p-${i}`,
    features: {
      x: Math.random(),
      y: Math.random()
    },
    expectedLabel: '?', // Not strictly needed for viz flow
    currentNodeId: 'root',
    isFinished: false,
    history: ['root']
  }));
};

export const initialState: DecisionTreeState = {
  tree: initialTree,
  rootId: 'root',
  dataPoints: generateDataPoints(10), // Start with 10 points
  speed: 1
};

const resetState = (state: DecisionTreeState) => {
    state.dataPoints = generateDataPoints(10);
    state.dataPoints.forEach(p => {
    p.currentNodeId = state.rootId;
    p.history = [state.rootId];
    p.isFinished = false;
    });
};

const decisionTreeSlice = createSlice({
  name: 'decisionTree',
  initialState,
  reducers: {
    resetTree(state) {
      resetState(state);
    },
    stepDataPoints(state) {
      // Move each point to the next node if not finished
      state.dataPoints.forEach(point => {
        if (point.isFinished) return;

        const node = state.tree[point.currentNodeId];
        if (!node || node.type === 'leaf') {
          point.isFinished = true;
          return;
        }

        // Evaluate condition
        // Convention: Left = value < threshold (True), Right = value >= threshold (False)
        // Let's fix our logic: feature < threshold ? left : right
        const val = point.features[node.feature!];
        const threshold = node.threshold!;
        
        let nextNodeId: string;
        // Logic: Is Condition True? -> Left. Condition False -> Right.
        // Label says "x > 0.5?". if 0.8 > 0.5 (True) -> Left?
        // Let's assume Left = True branch, Right = False branch.
        
        // Let's look at our labels.
        // Root: x > 0.5? 
        // If x=0.8, 0.8 > 0.5 is True. Logic should go to "True" child.
        // Let's assume 'left' is True branch.
        const conditionMet = val > threshold; 

        if (conditionMet) {
           nextNodeId = node.children!.left;
        } else {
           nextNodeId = node.children!.right;
        }

        if (nextNodeId && state.tree[nextNodeId]) {
          point.currentNodeId = nextNodeId;
          point.history.push(nextNodeId);
          // If new node is leaf, mark finished next tick? Or now?
          // Let's mark finished only after it sits in the leaf for 1 tick, or just let UI show it.
          if (state.tree[nextNodeId].type === 'leaf') {
            point.isFinished = true;
          }
        }
      });
    },
    setSpeed(state, action: PayloadAction<number>) {
        state.speed = action.payload;
    }
  },
  extraReducers: (builder) => {
      builder.addCase(resetSimulation, (state) => {
          resetState(state);
      });
  },
});

export const { resetTree, stepDataPoints, setSpeed } = decisionTreeSlice.actions;
export default decisionTreeSlice.reducer;
