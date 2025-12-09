# AI Model Playground

A universal, extensible playground for visualizing and interacting with various AI models.

This project is designed to be a comprehensive platform for exploring the inner workings of different Artificial Intelligence architectures. While it currently features visualizations for Neural Networks (ANN) and Computational Theory of Mind (CTM) concepts, its core architecture is built to be agnostic and extensible, allowing for the integration and visualization of *any* AI model.

## Vision

The goal is to demystify AI by providing a tangible, interactive interface where users can observe models in action. Whether it's a simple perceptron, a complex transformer, a decision tree, or a theoretical cognitive model, this playground aims to provide the tools to visualize it.

## Features

- **Extensible Plugin Architecture**: Easily add new model types through a modular plugin system.
- **Interactive Visualizations**: Real-time rendering of model states, signal propagation, and decision processes.
- **Universal Viz Kit**: A shared library of visualization components (`viz-kit`) to ensure consistent and high-quality rendering across different models.
- **Current Plugins**:
    - **Artificial Neural Networks (ANN)**: Visualize layers, neurons, weights, biases, and activation functions.
    - **Computational Theory of Mind (CTM)**: Explore cognitive architectures and mental state transitions.

## Tech Stack

- **Framework**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Styling**: SCSS / CSS Modules

## Getting Started

Follow these steps to get the project running locally:

1.  **Clone the repository**

    ```bash
    git clone <repository-url>
    cd ai-model-playground
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Run the development server**

    ```bash
    npm run dev
    ```

4.  **Open in Browser**

    Navigate to `http://localhost:5173` (or the URL shown in your terminal) to view the application.

## Contributing

We welcome contributions! If you want to add a visualization for a new model type (e.g., Genetic Algorithms, SVMs, LLMs), please check out the plugin development guide (coming soon).

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run preview`: Previews the production build locally.
