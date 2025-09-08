# /lib Directory Overview

This document provides a summary of the files in the `/lib` directory of the think-alike-web project. This directory contains core utilities, configuration management, and communication clients for the application.

## File Summaries

### `config.ts`

This file is responsible for managing the application's configuration. It dynamically loads the appropriate configuration (`local_config.json` for development or `heroku_config.json` for production) at build time. It also allows for runtime overrides of the API and WebSocket URLs through `NEXT_PUBLIC_*` environment variables. This setup ensures the frontend can connect to the correct backend services in any environment.

### `rest.ts`

This file acts as a comprehensive REST API client for the frontend. It features a generic `call` function that handles making `fetch` requests to the API endpoints defined in the configuration. It also includes:

-   A full set of TypeScript interfaces for all expected API responses (e.g., `PlayerResponse`, `RoomResponse`).
-   A collection of convenience functions (e.g., `createPlayer`, `getRooms`, `quickJoinRoom`) that wrap the `call` function, providing a clean, type-safe way to interact with the backend API.

### `socket.ts`

This file manages the real-time WebSocket communication using Socket.IO. It exports a `createGameSocket` function that returns a `GameSocket` object, which abstracts away the complexities of the connection.

-   **Connection Management**: Handles connecting, disconnecting, and reconnecting to the WebSocket server.
-   **Event Handling**: Provides `on` and `off` methods for subscribing to and unsubscribing from game events. It intelligently queues event handlers registered before a connection is established.
-   **Game Actions**: Exposes methods for sending game-specific events to the server, such as `joinRoom`, `commit`, and `reveal`.
-   **Crypto Utility**: Includes a `generateCommitHash` function for the commit-reveal scheme used in the game logic.

### `utils.ts`

This file provides common utility functions, primarily focused on CSS class name manipulation. It exports a `cn` function that merges the functionality of `clsx` (for conditionally applying classes) and `tailwind-merge` (for resolving conflicting Tailwind CSS classes), ensuring clean and predictable component styling.

### `cva.ts`

This is a lightweight, custom implementation of the popular `class-variance-authority` (CVA) library. It provides a `cva` function that allows for the creation of style variants for components. This utility is used to define different visual states (e.g., primary, secondary) of UI elements in a structured and reusable way.

### `icons.tsx`

This file contains a collection of simple, stateless React components, each rendering a specific SVG icon (e.g., `CheckIcon`, `ChevronDownIcon`). This approach allows for easy and consistent use of icons throughout the application.
