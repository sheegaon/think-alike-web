# Game Context Documentation

This document provides an overview of the `GameContext` module, which is the central hub for managing the global state of the Think Alike web application.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Understanding the GameState](#understanding-the-gamestate)
- [File Breakdown](#file-breakdown)
- [State Management Flow](#state-management-flow)
- [Usage](#usage)
  - [1. Wrap your app in `GameProvider`](#1-wrap-your-app-in-gameprovider)
  - [2. Accessing State and Actions in Components](#2-accessing-state-and-actions-in-components)
  - [3. Using Convenience Hooks](#3-using-convenience-hooks)
  - [4. Using Operations Hooks](#4-using-operations-hooks)
  - [5. Debugging (Development Only)](#5-debugging-development-only)
- [Best Practices](#best-practices)
  - [Optimizing Performance with Selectors](#optimizing-performance-with-selectors)
  - [Handling Asynchronous Actions](#handling-asynchronous-actions)
  - [Extending the Context](#extending-the-context)
- [Advanced Topics](#advanced-topics)
  - [Managing End-of-Round Behavior](#managing-end-of-round-behavior)
  - [Communication Strategy: REST vs. WebSockets](#communication-strategy-rest-vs-websockets)
  - [Complex Component Example: A Game Round](#complex-component-example-a-game-round)
- [Architectural Patterns](#architectural-patterns)
  - [Choosing Between Local and Global State](#choosing-between-local-and-global-state)
  - [Anatomy of an Action: `quickJoin`](#anatomy-of-an-action-quickjoin)
- [Conclusion](#conclusion)

## Core Concepts

The game's state is managed using React's Context API combined with a `useReducer` pattern. This provides a predictable and centralized way to handle all game-related data.

- **`GameProvider`**: A React component that wraps the entire application (or the parts that need access to the game state). It initializes the state, creates the actions, and provides them to all its children.

- **`useGame()`**: The primary custom hook for components to access the game state and actions. It returns an object containing the entire `GameState` and the `actions` available to modify it.

- **`GameState`**: A single, large object that holds all the data for the application, including player information, room details, round status, UI state, and more. The structure is defined in `types.ts`.

- **`GameActions`**: An object containing all the functions that can be used to interact with the game and modify the state. These actions are the only way to change the `GameState`.

## Understanding the GameState

The `GameState` object is the single source of truth for the application. Here is a breakdown of its key properties:

- **`player`**: Holds information about the current user, including their ID, username, balance, and authentication status.
- **`currentView` / `previousView`**: Manages the application's navigation, allowing you to show different screens and implement back-button functionality.
- **`room` / `players` / `isInRoom` / `currentRoomKey`**: Contains all information about the game room the player is currently in, including its properties (tier, stake), a list of other players, and the full room key for API requests.
- **`round` / `currentRound`**: Holds the state for the active game round, including the adjective, nouns, and timer information.
- **`commitState`**: Tracks the local player's commit-reveal process for a round, including their choice, nonce, and hash.
- **`results`**: Stores the results of the most recently completed round.
- **`notifications` / `recentEmotes`**: Manages UI elements like pop-up notifications and temporary emotes sent by players.
- **`queueState`**: Tracks the player's position in the queue when waiting to join a full room as a player.
- **`settings`**: Stores player-specific preferences, which are persisted to local storage.
- **`isLoading` / `isConnecting` / `isRegistering`**: Boolean flags that indicate when an asynchronous operation is in progress.
- **`error`**: Stores any global error messages.

## File Breakdown

The `context` directory is organized into the following files:

- **`GameContext.tsx`**: The heart of the module. It sets up the `GameProvider`, initializes the reducer, creates the socket connection, and wires up all the actions and socket event handlers. It also provides numerous convenience hooks (`usePlayer`, `useRoom`, `useNavigation`, etc.) for components to subscribe to specific parts of the state.

- **`types.ts`**: The single source of truth for all data structures. It contains TypeScript interfaces for `GameState`, `Player`, `Room`, `Round`, `GameActions`, and all other important entities.

- **`initialState.ts`**: Defines the default state of the application. The `createInitialState` function is used to initialize the game when it first loads and to reset the state on logout.

- **`gameActions.ts`**: The command center for all state mutations. It contains functions for every possible user interaction, from authentication and room management to in-game actions like committing a choice. These functions handle the logic for making REST API calls and emitting WebSocket events. It also contains the handlers for all incoming WebSocket events.

- **`notificationManager.ts`**: A small utility module for creating and managing in-game notifications. It provides a consistent way to add and remove notifications from the state.

- **`emoteManager.ts`**: Similar to the notification manager, this module handles the creation and temporary display of player emotes.

- **`index.ts`**: The public interface for the `context` module. It exports the `GameProvider`, the `useGame` hook, and other key utilities, making them easy to import throughout the application.

## State Management Flow

The flow of data and state updates follows a clear, unidirectional pattern:

1.  **UI Interaction**: A user interacts with a component (e.g., clicks a "Join Room" button).
2.  **Action Call**: The component's event handler calls an action from the `useGame()` hook (e.g., `actions.joinRoom(roomId)`).
3.  **Action Execution**: The corresponding function in `gameActions.ts` is executed.
    - It might make a REST API call to the backend.
    - It might emit an event via the WebSocket connection.
4.  **State Update**: The action (or a WebSocket event handler) calls the `updateState` function with a partial state object.
5.  **Reducer**: The `gameReducer` in `GameContext.tsx` receives the update and merges it into the current state, producing a new state object.
6.  **Re-render**: React detects the state change and re-renders any components that subscribe to that part of the `GameState`.

This ensures that all state changes are explicit and flow through a single, controlled pipeline, making the application easier to debug and reason about.

## Usage

To use the game context, you first need to wrap your application's root component with the `GameProvider`.

**1. Wrap your app in `GameProvider`:**

```tsx
// In your main App.tsx or equivalent
import { GameProvider } from '@/components/context';

function App() {
  return (
    <GameProvider>
      {/* The rest of your application */}
    </GameProvider>
  );
}
```

**2. Accessing State and Actions in Components:**

Once the provider is set up, any child component can use the `useGame` hook to access the game state and actions.

```tsx
import { useGame } from '@/components/context';

function PlayerProfile() {
  const { player, actions } = useGame();

  if (!player.isAuthenticated) {
    return <button onClick={() => actions.register('NewPlayer')}>Register</button>;
  }

  return (
    <div>
      <h2>{player.username}</h2>
      <p>Balance: {player.balance}</p>
      <button onClick={() => actions.logout()}>Logout</button>
    </div>
  );
}
```

**3. Using Convenience Hooks:**

For components that only need a specific slice of the state, you can use the more targeted convenience hooks. This can improve performance by preventing re-renders when unrelated parts of the state change.

```tsx
import { usePlayer, useNotifications } from '@/components/context';

function Header() {
  const player = usePlayer();
  const notifications = useNotifications();

  return (
    <header>
      <span>Welcome, {player.username}</span>
      <span>({notifications.length} new notifications)</span>
    </header>
  );
}
```

**4. Using Operations Hooks:**

For components that are focused on a specific type of interaction, you can use the specialized operations hooks. These hooks provide both the relevant state and the actions needed for that domain.

*   **`useAuth()`**

    ```tsx
    import { useAuth } from '@/components/context';

    function AuthComponent() {
      const { register, logout, player, isAuthenticated, isRegistering } = useAuth();

      if (isAuthenticated) {
        return (
          <div>
            <p>Welcome, {player.username}!</p>
            <button onClick={() => logout()}>Logout</button>
          </div>
        );
      }

      return (
        <button onClick={() => register('new-user')} disabled={isRegistering}>
          {isRegistering ? 'Registering...' : 'Register'}
        </button>
      );
    }
    ```

*   **`useRoomOperations()`**

    ```tsx
    import { useRoomOperations } from '@/components/context';

    function JoinRoomButton() {
      const { quickJoin, leaveRoom, isLoading } = useRoomOperations();

      return (
        <div>
          <button onClick={() => quickJoin('casual')} disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join Casual Room'}
          </button>
          <button onClick={() => leaveRoom()} disabled={isLoading}>
            Leave Room
          </button>
        </div>
      );
    }
    ```

*   **`useGameOperations()`**

    ```tsx
    import { useGameOperations } from '@/components/context';

    function GameControls() {
      const { commitChoice, sendEmote, canCommit, round } = useGameOperations();

      return (
        <div>
          {round && round.nouns.map((noun, index) => (
            <button 
              key={index} 
              onClick={() => commitChoice(index)} 
              disabled={!canCommit}
            >
              {noun}
            </button>
          ))}
          <button onClick={() => sendEmote('👍')}>Send Emote</button>
        </div>
      );
    }
    ```

*   **`useNavigation()`**

    ```tsx
    import { useNavigation } from '@/components/context';

    function AppNavigation() {
      const { currentView, setCurrentView, goBack } = useNavigation();

      return (
        <nav>
          {currentView !== 'home' && <button onClick={() => goBack()}>Back</button>}
          <button onClick={() => setCurrentView('lobby')}>Lobby</button>
          <button onClick={() => setCurrentView('settings')}>Settings</button>
        </nav>
      );
    }
    ```

**5. Debugging (Development Only):**

For debugging purposes, you can use the `useGameDebug` hook. This will expose the entire game context on the `window` object (`window.gameContext`), allowing you to inspect the state in your browser's developer console.

## Best Practices

### Optimizing Performance with Selectors

If a component only needs a very specific, computed piece of data from the state, you can use the generic `useGameState` selector hook to prevent unnecessary re-renders.

```tsx
import { useGameState } from '@/components/context';

function PlayerCount() {
  // This component will only re-render when the number of players changes.
  const playerCount = useGameState(state => state.players.length);

  return <div>{playerCount} players in room</div>;
}
```

### Handling Asynchronous Actions

Many actions (like joining a room or registering) are asynchronous. The context provides loading flags (`isLoading`, `isRegistering`) to help you manage UI feedback.

```tsx
import { useAuth } from '@/components/context';

function LoginScreen() {
  const { register, isRegistering, error } = useAuth();

  const handleRegister = async () => {
    try {
      await register('my-username');
      // Navigate to home on success
    } catch (err) {
      // Error is already handled in the context, but you can add
      // component-specific logic here.
      console.error("Registration failed in component", err);
    }
  };

  return (
    <div>
      <button onClick={handleRegister} disabled={isRegistering}>
        {isRegistering ? 'Loading...' : 'Register'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Extending the Context

To add new state and actions:

1.  **Update `types.ts`**: Add the new property to the `GameState` interface and the new function signature to the `GameActions` interface.
2.  **Update `initialState.ts`**: Add the default value for your new state property in `createInitialState`.
3.  **Implement the action in `gameActions.ts`**: Create the new action function. It should take the `context` ({ state, updateState, socket }) and perform its logic, calling `updateState` to modify the game state.
4.  **Add to `createGameActions`**: Add your new action creator to the main `createGameActions` factory function at the bottom of `gameActions.ts`.
5.  **(Optional) Add a new hook**: If the new functionality is a major domain, you can create a new specialized hook (like `useAuth`) in `GameContext.tsx`.

## Advanced Topics

### Managing End-of-Round Behavior

The context includes a specific piece of state, `endOfRoundAction`, which can be `'continue'`, `'sit_out'`, or `'leave'`. This is not controlled by a standard action but by a dedicated `setEndOfRoundAction` function available on the `actions` object. This allows the UI to let the player decide what to do after a round finishes, and the backend will be notified of this choice.

```tsx
import { useGame } from '@/components/context';
import { EndOfRoundAction } from '@/components/context/types';

function EndOfRoundControls() {
  const { endOfRoundAction, actions } = useGame();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    actions.setEndOfRoundAction(event.target.value as EndOfRoundAction);
  };

  return (
    <select value={endOfRoundAction} onChange={handleChange}>
      <option value="continue">Continue to Next Round</option>
      <option value="sit_out">Sit Out Next Round</option>
      <option value="leave">Leave Room</option>
    </select>
  );
}
```

### Communication Strategy: REST vs. WebSockets

The application uses a hybrid approach for client-server communication:

-   **REST API**: Used for transactional, request-response interactions that change the state of a resource. Examples include registering a player, listing available rooms, or joining a specific room. These are typically one-off actions initiated by the user.
-   **WebSockets**: Used for real-time, bidirectional communication once a player is in a room. This is for events that can be pushed from the server at any time, such as a new round starting (`deal`), other players' actions (`player_emote`), or frequent state updates (`commits_update`).

In `gameActions.ts`, you will see that actions like `quickJoin` make a REST call and then, upon success, use a token to establish a real-time connection with the WebSocket server.

### Complex Component Example: A Game Round

This example shows how a single component can use the context to render different UI for each phase of a game round.

```tsx
import { useRound, useGameOperations, useResults } from '@/components/context';

function RoundComponent() {
  const round = useRound();
  const results = useResults();
  const { commitChoice, canCommit } = useGameOperations();

  if (!round) {
    return <div>Waiting for the next round...</div>;
  }

  switch (round.phase) {
    case 'selecting':
      return (
        <div>
          <h1>{round.adjective}</h1>
          <p>Time left: {Math.round(round.timeLeft / 1000)}s</p>
          <div>
            {round.nouns.map((noun, i) => (
              <button key={i} onClick={() => commitChoice(i)} disabled={!canCommit}>
                {noun}
              </button>
            ))}
          </div>
        </div>
      );

    case 'revealing':
      return <div>Revealing choices...</div>;

    case 'complete':
      if (!results) return <div>Loading results...</div>;
      return (
        <div>
          <h1>Round Over!</h1>
          <p>Your choice: {results.nouns[results.yourChoice]}</p>
          <p>Winnings: {results.winnings}</p>
        </div>
      );

    default:
      return <div>Waiting...</div>;
  }
}
```

## Architectural Patterns

### Choosing Between Local and Global State

A common question is when to use the component's local state (`useState`) versus the global `GameContext`.

-   **Use Local State (`useState`) for:**
    -   State that is not needed by any other component (e.g., form input values, toggling a local UI element like a dropdown).
    -   State that is highly specific to a single component's behavior and does not impact the overall game.

-   **Use Global State (`GameContext`) for:**
    -   State that needs to be shared across multiple components (e.g., `player` info, `room` details).
    -   State that represents the application's core domain (e.g., the current `round`, game `results`).
    -   State that is modified by one component and read by another.
    -   State that needs to be persisted or reset on major events like login/logout.

Following this principle keeps components self-contained when possible and makes the global state easier to manage.

### Anatomy of an Action: `quickJoin`

This is a step-by-step walkthrough of what happens when a user clicks a "Quick Join" button, tying all the concepts together.

1.  **Component Interaction**: A user clicks the button in the `JoinRoomButton` component. The `onClick` handler calls `quickJoin('casual')` from the `useRoomOperations` hook.

2.  **Action Execution (`gameActions.ts`)**: The `quickJoin` action is triggered.
    - It immediately calls `updateState({ isLoading: true })` to provide instant UI feedback.
    - It calls the `quickJoinRoom` function from `lib/rest.ts`.

3.  **API Call (`rest.ts`)**: The `quickJoinRoom` function makes a `POST` request to the `/api/v1/rooms/quick-join` endpoint on the backend, sending the player's ID and the desired tier.

4.  **Backend Processing**: The server finds or creates a suitable room, adds the player, and returns a response containing a `room_key` and a temporary `room_token`.

5.  **Action Resumes (`gameActions.ts`)**: The `quickJoin` action receives the successful response from the API.
    - It calls `updateState` again, this time with the new data: `isLoading: false`, `currentRoomKey: response.room_key`, and the player's updated balance.
    - It then calls `socket.joinRoom(response.room_token, false)`.

6.  **WebSocket Communication (`socket.ts`)**: The `joinRoom` method on the socket instance emits a `join_room` event to the WebSocket server, sending the temporary token.

7.  **Server-Side Event**: The server validates the token, adds the player's socket to the room's real-time channel, and broadcasts a `room_joined` event to all clients in that room.

8.  **Socket Handler (`gameActions.ts`)**: The `onRoomJoined` event handler (which was registered in `GameContext.tsx`) receives the event. It calls `updateState` one last time to populate the `room` object with the full details (player count, stake, etc.) and sets the `currentView` to `'waiting-room'`.

9.  **UI Re-renders**: The application, now with an updated `currentView` and `room` object, automatically navigates the user to the waiting room screen, completing the flow.

## Conclusion

This context module provides a robust and scalable foundation for the application. By keeping state management centralized and interactions predictable, it allows developers to build features confidently. When working with the context, remember to use the provided hooks, respect the unidirectional data flow, and leverage the specialized hooks and selectors to keep components clean and performant.
