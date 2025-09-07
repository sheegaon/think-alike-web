# Components Documentation

This document provides an overview of the components in the `think-alike-web/components` directory.

## App.tsx

This is the root component of the application. It uses a `RenderScreen` component to determine which screen to display based on the user's authentication status, whether they are in a room, and the current game phase or view.

## GameContext.tsx

This is the most critical file for the application's state management. It uses React's Context API to create a global state container that is accessible throughout the component tree.
- **`GameProvider`**: A component that wraps the entire application, providing the game state and actions to all its children.
- **`useGame` hook**: A custom hook that allows any component to easily access the game state and actions.
- **`GameState`**: A comprehensive interface that defines the shape of the entire application state, including player data, navigation state, room details, game phase, round data, and UI settings.
- **Actions**: It exports a set of functions for components to call, such as `register`, `quickJoin`, `leaveRoom`, `commitChoice`, and `logout`. These actions handle the logic for interacting with the REST API and the WebSocket server.
- **WebSocket Management**: It is responsible for creating, connecting, and managing the WebSocket connection. It defines handlers for all incoming WebSocket events (e.g., `onDeal`, `onRoundResults`, `onPlayerJoinedRoom`), which update the global state accordingly. In essence, this context is the central nervous system of the front-end application.

## Home.tsx

The `Home` component serves as the main dashboard for the user after logging in. It displays:
- A welcome message.
- A primary button to navigate to the `Lobby` to see all available rooms.
- A "Quick Rejoin" button to rejoin the last played game tier.
- A set of icon buttons for navigating to `Leaderboard`, `Rewards`, `Settings`, and for logging out.
- A "Join a Room" section that fetches and displays a list of aggregated room options (quick join options) based on game tiers. Each option shows the number of players, the stake, and the entry fee. Users can click on an option to quickly join a game of that tier.
- The component handles loading and error states for fetching room data.

## WaitingRoom.tsx

The `WaitingRoom` component is the waiting room screen. It's displayed when a player has joined a room but the game has not yet started. Its main features are:
- Displaying the current number of players and the number of players needed to start the game.
- Showing the entry fee for the current room.
- Providing a list of game rules.
- Offering buttons to "Switch Rooms" to a different game tier.
- A button to return to the `Lobby`.
- A disabled "Start Round" button, as the game starts automatically when enough players join.

## Lobby.tsx

The `Lobby` component displays a list of all available game rooms. It allows users to browse and join rooms. Key features include:
- Fetching and displaying a list of all rooms from the server.
- Filtering rooms by tier (e.g., "All", "Casual", "Competitive").
- For each room, it shows details like the tier, stake, number of players, and entry fee.
- A "Join" button for each room that is not full.
- A "Spectate" button for full rooms.
- A "Refresh" button to update the list of rooms.
- A navigation button to return to the `Home` screen.
- It handles loading and error states during the fetching process.

## Login.tsx

The `Login` component serves as the initial screen for new users. Its purpose is to allow users to register and enter the game.
- It provides a simple interface with social login options (Apple, Google) which are currently disabled.
- The primary method of entry is to "Continue as Guest" by providing a username.
- It uses the `GameContext` to handle the player registration process.
- The component displays loading states and any errors that occur during registration, providing immediate feedback to the user.

## screens.ts

This file defines the `Screen` type alias. It is a union of string literals that represent all the possible views or screens a user can navigate to within the application. This type is used to manage the `currentView` in the `GameContext`, ensuring type-safe navigation.

## Rewards.tsx

The `Rewards` component displays daily and seasonal quests for the user. It is currently using mock data for quests and progress.
- It shows two main sections: "Daily Quests" and "Seasonal Quests".
- Each quest has a title, a reward amount, a progress bar, and a progress indicator (e.g., 3/5).
- For completable quests, a "Collect" button is displayed. The collection process is currently a simulation with a delay.
- The component hides quests that have already been collected.
- It includes a navigation button to return to the `Home` screen.

## Settings.tsx

The `Settings` component provides a screen for users to view and manage their game settings. It is noted that this component is only partially connected.
- It displays a list of settings options, such as "Sound effects", "Haptics", and "Auto-advance".
- The current state of each setting is read from the `GameContext`.
- The UI includes `Switch` controls for each setting, but they are currently disabled, meaning users can view but not yet update their settings.
- A "Back" button allows the user to navigate back to the `Home` screen.

## Spectator.tsx

The `Spectator` component is designed for users who are watching a game in progress. It provides a read-only view of the game.
- It displays the current game state, including the time remaining, the number of players who have locked in their choices, the round's adjective, and the noun options.
- It features a "Queue to play" option, allowing spectators to join the game automatically when a slot becomes available.
- A button is provided to navigate back to the `Home` screen.
- The component currently uses mock data to simulate the game state.

## Leaderboard.tsx

The `Leaderboard` component displays a ranked list of players. It is currently populated with mock data.
- It shows a table with columns for Rank, Player, Rating, Tokens, and Wins.
- It includes a navigation button to return to the `Home` screen.

## RoundReveal.tsx

The `RoundReveal` component is displayed at the end of a round to show the results.
- It waits for the `game.results` from the `GameContext`.
- It reveals the popularity of each noun choice one by one using a staggered animation.
- For each noun, it displays the number of players who chose it and the percentage of the total. The player's own choice is highlighted.
- After all results are revealed, it shows a summary of the player's winnings for the round.
- It provides a button that allows the player to leave the room or indicates their status for the next round (e.g., "Sitting Out").

## RoundSelect.tsx

This is the main gameplay screen where the player makes their choice for the round.
- It displays the current round's adjective prominently.
- It shows a grid of `WireCard` components representing the noun choices.
- A countdown timer and a progress bar indicate the time remaining for selection.
- It displays the number of players who have already "locked in" their choices.
- The player clicks on a noun card to make their selection, which calls the `commitChoice` action from the `GameContext`. Once a choice is made, the cards are disabled.
- It includes a dropdown menu for the player to decide their action for the end of the round: continue playing, sit out the next round, or leave the room.

## theme-provider.tsx

This component is a simple wrapper around the `next-themes` library. It is used in the root layout to provide theme-switching capabilities (e.g., light/dark mode) to the entire application.

## Subdirectories

### `shared/`

This directory contains custom, reusable components that are specific to the `Think Alike` application but are used across multiple different screens. These components might combine `ui` elements with application logic or styling.

- **`Pill.tsx`**: A simple component for displaying a label and value in a styled "pill" format.
- **`Frame.tsx`**: A container component that provides a consistent styled frame with a border and background for its children.
- **`icons.tsx`**: A collection of SVG icon components used throughout the application, exported as a single `Icons` object.
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

- **`src/main.jsx`**: This is the starting point of the application. It renders the root `App` component and wraps it with essential context providers, such as the `ThemeProvider` and, most importantly, the `GameProvider` from `components/GameContext.tsx`.
- **`src/index.css`**: This file contains global styles and Tailwind CSS base configurations that apply to the entire application.

### 2. Core Logic and Services: `lib/`

This directory contains the application's core services and utilities, which are primarily consumed by the `GameContext` to manage the application's state and data flow.

- **`lib/rest.ts`**: This file is responsible for all communication with the backend's REST API. It exports functions for actions like creating a player (`createOrGetPlayer`) and joining a room (`quickJoinRoom`). These functions are called within the `GameContext` actions (e.g., `register`, `quickJoin`).
- **`lib/socket.ts`**: This file manages the real-time WebSocket connection to the game server. It provides the `createGameSocket` function that `GameContext` uses to establish and maintain the connection, as well as handle incoming and outgoing game events.
- **`lib/config.ts`**: Contains environment-specific configurations, such as the base URLs for the API and WebSocket servers.
- **`lib/utils.ts`**: A set of utility functions used throughout the project. The most common one is `cn`, which is used for conditionally combining CSS classes from Tailwind CSS.

### 3. The Central Hub: `GameContext.tsx`

As detailed earlier, `GameContext.tsx` is the central hub of the application. It connects the UI components to the core logic in `lib/`:

- **UI Components (`RoundSelect`, `Login`, etc.)** call action functions on the context (e.g., `game.commitChoice()`, `game.register()`).
- **`GameContext`** then uses the services from `lib/` to execute these actions (e.g., it calls `rest.createOrGetPlayer()` or `socket.commit()`).
- When the **`lib/` services** receive a response (either an HTTP response from `rest.ts` or a WebSocket message from `socket.ts`), `GameContext` updates its state.
- Because all components are wrapped by the `GameProvider`, any component that uses the `useGame()` hook will automatically re-render with the new state, ensuring the UI is always in sync with the application's data.

This architecture creates a clear, one-way data flow that makes the application easier to understand and maintain. A new developer should focus on understanding the `GameState` and actions in `GameContext.tsx`, as this is where the UI and the backend services are brought together.
