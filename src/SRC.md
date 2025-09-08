# /src Directory Overview

This document provides a summary of the files in the `/src` directory of the think-alike-web project. This directory contains the main application logic, styling, and state management.

## File Summaries

### `main.jsx`

This is the primary entry point for the React application. Its sole responsibility is to render the root `<App />` component into the DOM. It wraps the `App` component in `<React.StrictMode>` to enable additional checks and warnings during development.

### `App.jsx`

This file contains the main application component, which acts as a simple router. It uses a state variable (`currentScreen`) to determine which screen component to render (e.g., `Login`, `Home`, `Lobby`). It passes down navigation functions and user state to its children. The entire application is wrapped in a `<GameProvider>`, making the global game state available to all components.

### `index.css`

This is the global stylesheet for the application. It uses Tailwind CSS and defines a set of CSS custom properties (variables) for theming, supporting both light and dark modes. It sets up base styles for the body, custom scrollbars, and focus states.

### `App.css`

This file contains styles that are specific to the `App` component and its children screens. It defines layouts for containers, grids for displaying game cards, and a variety of animations (fade-in, slide-up, bounce-in) to enhance the user experience. It also includes styles for floating emotes and progress bars.

### `context/GameContext.jsx`

This file implements the global state management for the application using React's Context API. It creates a `GameContext` and a `GameProvider` component.

-   **`GameProvider`**: This component holds all the shared application state, such as game settings, round data, player information, and user stats. It uses the `useState` hook to manage this state.
-   **`useGame` hook**: This is a custom hook that allows any component within the `GameProvider`'s tree to easily access and manipulate the shared game state.
