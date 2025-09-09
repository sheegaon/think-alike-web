# Components Documentation

This document provides an overview of the components in the `think-alike-web/components` directory.

## App.tsx

This is the root component of the application. It uses a `RenderScreen` component to determine which screen to display based on the user's authentication status, whether they are in a room, and the current game phase or view.

## Context Architecture (`context/` directory)

The application's state management is organized in a modular context architecture within the `context/` directory:

### GameContext.tsx

The main context provider that orchestrates all game state management. This is the primary interface that components use to access game state and actions through the `useGame()` hook.

### types.ts

Contains all TypeScript type definitions for the game state, including:
- `GameState`: The comprehensive interface defining the entire application state
- Player data types
- Room and game phase types
- UI settings interfaces
- WebSocket message types

### initialState.ts

Defines the initial state configuration for the GameContext, providing default values for all state properties.

### gameActions.ts

Contains all the action functions that components can call, such as:
- `register`: Player registration functionality
- `quickJoin`: Quick room joining
- `leaveRoom`: Room departure logic
- `commitChoice`: Choice submission during rounds
- `logout`: User logout functionality

### socketHandlers.ts

Manages all WebSocket event handlers, including:
- `onDeal`: Handles round start events
- `onRoundResults`: Processes round completion data
- `onPlayerJoinedRoom`: Updates state when players join
- Other real-time game event handlers

### websocketManager.ts

Responsible for WebSocket connection management:
- Connection establishment and teardown
- Message routing to appropriate handlers
- Connection state monitoring
- Reconnection logic

### notificationManager.ts

Handles the notification system:
- Adding new notifications
- Auto-removal after timeout (5 seconds)
- Limiting notification queue to prevent overflow

### emoteManager.ts

Manages the emote system:
- Emote display and timing
- Auto-removal of expired emotes
- Emote queue management

### index.ts

The main export file that provides a clean interface to the context system, exporting the provider, hook, and key types.

## Screen Components

### Home.tsx

The `Home` component serves as the main dashboard for the user after logging in. It displays:
- A welcome message.
- A primary button to navigate to the `Lobby` to see all available rooms.
- A "Quick Rejoin" button to rejoin the last played game tier.
- A set of icon buttons for navigating to `Leaderboard`, `Rewards`, `Settings`, and for logging out.
- A "Join a Room" section that fetches and displays a list of aggregated room options (quick join options) based on game tiers. Each option shows the number of players, the stake, and the entry fee. Users can click on an option to quickly join a game of that tier.
- The component handles loading and error states for fetching room data.

### Login.tsx

The `Login` component serves as the initial screen for new users. Its purpose is to allow users to register and enter the game.
- It provides a simple interface with social login options (Apple, Google) which are currently disabled.
- The primary method of entry is to "Continue as Guest" by providing a username.
- It uses the `GameContext` to handle the player registration process.
- The component displays loading states and any errors that occur during registration, providing immediate feedback to the user.

### WaitingRoom.tsx

The `WaitingRoom` component is the waiting room screen. It's displayed when a player has joined a room but the game has not yet started. Its main features are:
- Displaying the current number of players and the number of players needed to start the game.
- Showing the entry fee for the current room.
- Providing a list of game rules.
- Offering buttons to "Switch Rooms" to a different game tier.
- A button to return to the `Lobby`.
- A disabled "Start Round" button, as the game starts automatically when enough players join.

### Lobby.tsx

The `Lobby` component displays a list of all available game rooms. It allows users to browse and join rooms. Key features include:
- Fetching and displaying a list of all rooms from the server.
- Filtering rooms by tier (e.g., "All", "Casual", "Competitive").
- For each room, it shows details like the tier, stake, number of players, and entry fee.
- A "Join" button for each room that is not full.
- A "Spectate" button for full rooms.
- A "Refresh" button to update the list of rooms.
- A navigation button to return to the `Home` screen.
- It handles loading and error states during the fetching process.

### RoundSelect.tsx

This is the main gameplay screen where the player makes their choice for the round.
- It displays the current round's adjective prominently.
- It shows a grid of `WireCard` components representing the noun choices.
- A countdown timer and a progress bar indicate the time remaining for selection.
- It displays the number of players who have already "locked in" their choices.
- The player clicks on a noun card to make their selection, which calls the `commitChoice` action from the `GameContext`. Once a choice is made, the cards are disabled.
- It includes a dropdown menu for the player to decide their action for the end of the round: continue playing, sit out the next round, or leave the room.

### RoundReveal.tsx

The `RoundReveal` component is displayed at the end of a round to show the results.
- It waits for the `game.results` from the `GameContext`.
- It reveals the popularity of each noun choice one by one using a staggered animation.
- For each noun, it displays the number of players who chose it and the percentage of the total. The player's own choice is highlighted.
- After all results are revealed, it shows a summary of the player's winnings for the round.
- It provides a button that allows the player to leave the room or indicates their status for the next round (e.g., "Sitting Out").

### Spectator.tsx

The `Spectator` component is designed for users who are watching a game in progress. It provides a read-only view of the live game state from the `GameContext`.
- It displays the current game state, including the time remaining, the number of players who have locked in their choices, the round's adjective, and the noun options.
- It features a "Queue to play" option, allowing spectators to join the game automatically when a slot becomes available.
- A button is provided to leave the spectator view and return to the home screen.

### Leaderboard.tsx

The `Leaderboard` component displays a ranked list of players by fetching data from the backend API.
- It shows a table with columns for Rank, Player, Rating, Tokens, and Wins.
- It handles loading and error states while fetching the data.
- It includes a navigation button to return to the `Home` screen.

### Rewards.tsx

The `Rewards` component fetches and displays daily and seasonal quests for the user from the backend API.
- It shows two main sections: "Daily Quests" and "Seasonal Quests".
- Each quest has a title, a reward amount, a progress bar, and a progress indicator (e.g., 3/5).
- For completable quests, a "Collect" button is displayed. This action calls the API to claim the reward and updates the player's balance in the global state.
- The component automatically re-fetches quest data after a reward is collected to update the view.
- It includes a navigation button to return to the `Home` screen.

### Settings.tsx

The `Settings` component provides a screen for users to view and manage their game settings.
- It displays a list of settings options, such as "Sound effects", "Haptics", and "Auto-advance".
- The current state of each setting is read from the `GameContext`.
- The UI includes `Switch` controls for each setting that update the global state via the `GameContext` when toggled.
- A "Back" button allows the user to navigate back to the `Home` screen.

## screens.ts

This file defines the `Screen` type alias. It is a union of string literals that represent all the possible views or screens a user can navigate to within the application. This type is used to manage the `currentView` in the `GameContext`, ensuring type-safe navigation.

## theme-provider.tsx

This component is a simple wrapper around the `next-themes` library. It is used in the root layout to provide theme-switching capabilities (e.g., light/dark mode) to the entire application.

## Subdirectories

### `shared/`

This directory contains custom, reusable components that are specific to the `Think Alike` application but are used across multiple different screens. These components might combine `ui` elements with application logic or styling.

- **`Pill.tsx`**: A simple component for displaying a label and value in a styled "pill" format.
- **`Frame.tsx`**: A container component that provides a consistent styled frame with a border and background for its children.
- **`WireCard.tsx`**: A button styled as a card, with a "selected" state. It's used for the noun choices in the `RoundSelect` screen.
- **`InfoStrip.tsx`**: A component for displaying player count and the current prize pool.
- **`StatusBar.tsx`**: A component that displays user information like username and balance from the `GameContext`. When in a room, it also shows player count and the prize pool.
- **`ProgressBar.tsx`**: A simple component for displaying a progress bar with a customizable progress percentage.
- **`SectionHeader.tsx`**: A component for displaying a section title with optional children, which are typically buttons or other controls.

### `ui/`

This directory contains general-purpose, reusable UI components that are styled and adapted for this project, likely sourced from a UI library like `shadcn/ui`. These components are not specific to the game's logic.

- **`input.tsx`**: A standard, styled text input field.
- **`button.tsx`**: A highly versatile button component built with `cva` (class-variance-authority) to provide multiple styles (`variant`) and sizes (`size`).
- **`select.tsx`**: A composite component built on `@radix-ui/react-select` that provides a full suite of styled and accessible dropdown select elements (`Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, etc.).
- **`switch.tsx`**: A styled toggle switch component built on `@radix-ui/react-switch`.
- **`checkbox.tsx`**: A styled checkbox component built on `@radix-ui/react-checkbox` with a custom indicator.

---

## Project Architecture and Data Flow

For a new developer, it's helpful to understand how these components fit into the broader application structure. The project follows a standard React application pattern, separating concerns into `src`, `lib`, and `components` directories.

### 1. Application Entry Point: `src/`

- **`src/main.jsx`**: This is the starting point of the application. It renders the root `App` component and wraps it with essential context providers, such as the `ThemeProvider` and, most importantly, the `GameProvider` from `components/context/GameContext.tsx`.
- **`src/index.css`**: This file contains global styles and Tailwind CSS base configurations that apply to the entire application.

### 2. Core Logic and Services: `lib/`

This directory contains the application's core services and utilities, which are primarily consumed by the GameContext to manage the application's state and data flow.

- **`lib/rest.ts`**: This file is responsible for all communication with the backend's REST API. It exports functions for actions like creating a player (`createOrGetPlayer`) and joining a room (`quickJoinRoom`). These functions are called within the `gameActions.ts` functions.
- **`lib/socket.ts`**: This file manages the real-time WebSocket connection to the game server. It provides the `createGameSocket` function that `websocketManager.ts` uses to establish and maintain the connection, as well as handle incoming and outgoing game events.
- **`lib/config.ts`**: Contains environment-specific configurations, such as the base URLs for the API and WebSocket servers.
- **`lib/utils.ts`**: A set of utility functions used throughout the project. The most common one is `cn`, which is used for conditionally combining CSS classes from Tailwind CSS.

### 3. The Central Hub: Context Architecture

The modular context architecture connects the UI components to the core logic in `lib/`:

- **UI Components** (like `RoundSelect`, `Login`, etc.) call action functions from `gameActions.ts` (e.g., `game.commitChoice()`, `game.register()`).
- **`gameActions.ts`** then uses the services from `lib/` to execute these actions (e.g., it calls `rest.createOrGetPlayer()` or `socket.commit()`).
- When the **`lib/` services** receive a response (either an HTTP response from `rest.ts` or a WebSocket message from `socket.ts`), the `socketHandlers.ts` or action functions update the state in `GameContext.tsx`.
- Because all components are wrapped by the `GameProvider`, any component that uses the `useGame()` hook will automatically re-render with the new state, ensuring the UI is always in sync with the application's data.

### 4. Data Flow

The application follows a unidirectional data flow:

1. **UI Components** → Call action functions from `gameActions.ts`
2. **Actions** → Use services from `lib/` directory (REST API, WebSocket)
3. **WebSocket Events** → Handled by `socketHandlers.ts`
4. **State Updates** → Trigger re-renders in subscribed components
5. **Components** → Access updated state via `useGame()` hook

This architecture creates a clear, predictable data flow that makes the application easier to understand and maintain. New developers should start by understanding the `GameState` interface in `types.ts` and the available actions in `gameActions.ts`, as these define how the UI interacts with the backend services.

## Getting Started for New Developers

1. **Start with the types**: Review `context/types.ts` to understand the complete application state structure.
2. **Understand the actions**: Look at `context/gameActions.ts` to see what operations components can perform.
3. **Follow the data flow**: Trace how a user action (like clicking a button) flows through the action → service → WebSocket handler → state update cycle.
4. **Examine key screens**: Start with `Login.tsx` and `Home.tsx` to understand the basic user journey.
5. **Study the context usage**: See how components use `const game = useGame()` to access state and actions.

The modular architecture ensures that each file has a single, clear responsibility, making it easier to understand, maintain, and extend the application.
