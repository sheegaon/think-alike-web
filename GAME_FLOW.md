# Game Flow Analysis

This document provides a thorough analysis of the game flow in the Think Alike project, comparing the command-line interface (CLI) with the web user interface (UI).

## CLI Game Flow

The CLI game flow is defined in `/Users/tfish/PycharmProjects/think-alike-cli/cli.py`. It operates on a command-based system where the user manually enters commands to interact with the game.

### Key Components

*   **`UserContext`**: A dataclass that holds the user's session data, including player ID, username, room information, and round state.
*   **`REST`**: A class for making calls to the backend REST API for actions like player creation, room management, and fetching game stats.
*   **`AsyncWS`**: A class that manages the WebSocket connection for real-time gameplay events.

### Flow of Interaction

1.  **Initialization**:
    *   The application loads its configuration and initializes the `REST` and `AsyncWS` clients.
    *   A `UserContext` instance is created to store session state.
    *   The WebSocket client automatically connects to the server.

2.  **Player Creation**:
    *   The user runs `p get <username>` to create or retrieve a player profile.
    *   This action makes a REST API call, and the returned player data is stored in the `UserContext`.

3.  **Room Management**:
    *   The user can list available rooms with `r list`.
    *   To join a room, the user runs `r join c|o|h|<key>`, which makes a REST API call.
    *   Upon joining, the `UserContext` is updated with the room key and token, and a `join_room` event is sent over the WebSocket.

4.  **Gameplay Loop**:
    *   The game progresses through a series of WebSocket events:
        *   `deal`: The server sends the round's adjective and nouns.
        *   The user submits their choice with `ws commit <idx>`, which sends a hashed commitment to the server.
        *   `request_reveal`: The server prompts for the reveal, and the client automatically responds with the choice and a nonce.
        *   `round_results`: The server sends the results, and the client updates the player's balance in the `UserContext`.
        *   `next_round_info`: The server provides information about the upcoming round.

5.  **Leaving a Room**:
    *   The user leaves a room by running `r leave`, which triggers a REST API call and a `leave_room` WebSocket event.

## Web UI Game Flow

The web UI game flow is built on a reactive, component-based architecture using React and a global state management system.

### Key Components

*   **`GameContext.tsx`**: The central hub for state management. It provides a global `GameState` and a set of actions that components can use to interact with the game. It also manages the WebSocket connection and handles all real-time events.
*   **`RenderScreen`**: A component that determines which screen to display based on the current game state (e.g., `currentView`, `phase`).
*   **UI Components**: A set of React components for different screens, such as `Login`, `Home`, `Lobby`, `RoundSelect`, and `RoundReveal`.

### Flow of Interaction

1.  **Initialization**:
    *   The application entry point (`page.tsx`) wraps the root `App` component with a `GameProvider`.
    *   `GameContext` initializes the `GameState` and establishes a WebSocket connection.

2.  **Player Creation**:
    *   The user is presented with the `Login` screen.
    *   Upon entering a username, the `register` action in `GameContext` is called, which in turn calls the REST API to create or retrieve a player.
    *   The player's data is stored in the global `GameState`.

3.  **Room Management**:
    *   After logging in, the user sees the `Home` screen, which displays quick join options.
    *   Alternatively, the user can navigate to the `Lobby` to see a full list of rooms.
    *   Clicking a "Join" button triggers an action in `GameContext` (e.g., `quickJoin`), which handles the REST API call.
    *   The `GameState` is updated with the room information, and the UI automatically navigates the user to the `WaitingRoom`.

4.  **Gameplay Loop**:
    *   The `GameContext` listens for WebSocket events and updates the `GameState` accordingly.
    *   The UI is reactive, so components re-render automatically based on state changes:
        *   `onDeal`: The `GameState` is updated with the round data, and the `RoundSelect` screen is displayed.
        *   The user clicks on a noun card, which calls the `commitChoice` action in `GameContext`. This sends the `commit` event over the WebSocket.
        *   `onRoundResults`: The `GameState` is updated with the results, and the `RoundReveal` screen is displayed, often with animations to reveal the outcome.

5.  **Leaving a Room**:
    *   The user can click a "Leave" button, which calls the `leaveRoom` action in `GameContext` to handle the necessary API calls and state updates.

## Comparison of Game Flows

| Feature               | CLI                                                              | Web UI                                                              |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| **User Interaction**  | Command-based; manual user input for every action.               | Graphical and event-driven; UI components trigger actions.          |
| **State Management**  | A simple `UserContext` dataclass.                                | A comprehensive `GameContext` with a global `GameState` and actions. |
| **Flow Control**      | Manual; the user dictates the flow by entering commands.         | Reactive and automated; the UI changes based on the `GameState`.    |
| **Real-time Updates** | Updates are printed to the console.                              | Updates are visually represented through reactive UI components.    |
| **Architecture**      | Procedural script with classes for handling REST and WebSockets. | Component-based architecture with a centralized state management hub. |

### Summary

The CLI provides a minimalist, developer-oriented interface that is excellent for testing and direct interaction with the game's backend services. Its flow is linear and controlled entirely by the user's commands.

The web UI, in contrast, offers a rich, user-friendly experience with a reactive and automated game flow. It abstracts away the direct API and WebSocket interactions, allowing the user to interact with the game through a dynamic and intuitive graphical interface. The `GameContext` serves as the core of the web application, orchestrating the flow of data between the UI and the backend, and ensuring that the UI always reflects the current state of the game.

---

## Deep Dive Analysis: Web UI Implementation (`think-alike-web`)

This section provides a detailed technical analysis of the web UI's communication layer, focusing on potential bugs, architectural weaknesses, and areas for improvement. It is intended for developers working on the `think-alike-web` project.

### I. REST API Implementation (`lib/rest.ts`)

The web UI's REST client is more structured and robust than the CLI's, but its interaction with the `GameContext` creates specific challenges.

#### Finding 1: Structured vs. Unstructured Error Handling

-   **Web UI (`lib/rest.ts`):** The core `call` function uses modern `fetch` and standard JavaScript error handling. If an HTTP response is not `ok` (e.g., status 404, 500), it **throws a new `Error`**. This is a robust pattern that forces the calling code in `GameContext.tsx` to handle the failure explicitly within a `try...catch` block.

    '''typescript
    // In lib/rest.ts - This is good, robust error handling.
    if (!response.ok) {
      // ... logic to parse a detailed error message from the JSON response
      throw new Error(errorMessage); // Halts execution and forces a `catch`
    }
    '''

-   **CLI (`cli.py`):** The `REST.call` method simply prints error status codes to the console and returns the (often empty or invalid) response. It does not raise exceptions on HTTP errors, meaning the main command loop must manually check the validity of the returned data.

-   **Developer Impact:** When debugging a failed API call in the web UI, a developer's focus should be on the `catch` block within the corresponding action in `GameContext.tsx` (e.g., `catch (err: any)` in the `quickJoin` function). This is where the application decides how to update its state in response to the failure.

#### Finding 2: Encapsulated Business Logic

-   **Web UI (`lib/rest.ts`):** The library contains convenience functions like `createOrGetPlayer`, which encapsulates a "get-or-create" pattern. It first tries to fetch a player and, upon receiving a "not found" error, automatically retries by creating one.

    '''typescript
    // In lib/rest.ts - This abstracts away a business rule.
    export async function createOrGetPlayer(username: string): Promise<PlayerResponse> {
      try {
        return await getPlayerByUsername(username);
      } catch (error: any) {
        if (error.message.toLowerCase().includes("not found")) {
          return await createPlayer(username); // The retry logic is hidden here
        }
        throw error;
      }
    }
    '''

-   **Developer Impact:** This is a strong architectural choice. It simplifies the `GameContext` and makes the REST layer more reusable. A developer debugging the login flow must be aware that this file, `lib/rest.ts`, contains part of the core business logic.

### II. WebSocket Implementation (`lib/socket.ts`)

The WebSocket implementation is highly sophisticated, designed to be resilient in a web environment, but its complexity can hide subtle issues.

#### Finding 1: Resilient Reconnection and Event Handling

-   **Web UI (`lib/socket.ts`):** The `createGameSocket` factory uses a **handler queue**. When `GameContext` registers an event listener (e.g., `socket.on('deal', ...)`), the handler is first added to an internal queue. The handlers are only attached to the actual socket instance *after* a connection is established.
-   **Key Feature:** This mechanism ensures that if the socket disconnects and later reconnects, all the application's event listeners are **automatically re-registered**.
-   **Developer Impact:** This is a huge win for stability and solves a classic class of race conditions and bugs related to transient network failures. A developer can trust that event listeners will persist across reconnections without any extra effort. If an event seems to be missed, the issue is almost certainly in the `GameContext`'s handler logic itself, not in the socket layer.

#### Finding 2: Type-Safe, Abstracted Emitters

-   **Web UI (`lib/socket.ts`):** The `GameSocket` interface returned by the factory does not expose a generic `emit` function. Instead, it provides specific, type-safe methods like `joinPlayer(playerId: number)` and `commit(hash: string)`.

    '''typescript
    // In lib/socket.ts - A clean, type-safe public interface.
    return {
      // ...
      joinPlayer: (playerId) => emit("join_player", { player_id: playerId }),
      commit: (hash) => emit("commit", { hash }),
      // ...
    }
    '''

-   **Developer Impact:** This is a best practice that significantly reduces the risk of bugs. It prevents typos in event names and ensures the payload structure is correct at compile time. It makes the code in `GameContext.tsx` cleaner and easier to reason about.

### III. Potential Issues & Areas for Improvement in `think-alike-web`

This deep dive reveals several areas where the web application could be improved for robustness and maintainability.

#### **Critical Issue 1: Fragile Room Join Flow**

The sequence of events for joining a room is the most significant point of failure in the application.

-   **The Flow:**
    1.  **REST Call:** The user action triggers `quickJoin` or `joinRoom` in `GameContext.tsx`. This makes a REST API call.
    2.  **State Update & Pending Token:** The API returns a `room_token`. This token is stored in a `useRef` called `pendingRoomJoin.current`, and the UI state is optimistically updated to `inRoom: true`.
    3.  **Player Join Event:** A completely separate `useEffect` hook, triggered by `playerId` and `isConnected`, emits the `join_player` WebSocket event.
    4.  **Room Join Event:** Only after the server acknowledges the player join (`on('player_joined_game')`) does the client *finally* emit the `join_room` event using the token from `pendingRoomJoin.current`.

-   **Potential Bugs:**
    -   **Race Condition:** If the `join_player` acknowledgment is slow or fails, the user is stuck in a state where the UI shows them "in a room," but they have not actually joined it on the WebSocket server. They will not receive any game events.
    -   **Inconsistent State:** If the `quickJoin` REST call succeeds but any subsequent WebSocket event fails, the UI state becomes inconsistent with the backend state. The `pendingRoomJoin` ref is a classic sign of state being managed outside of React's declarative model, which is prone to errors.

-   **Recommendation for Improvement:**
    -   **Orchestrate with a State Machine:** This entire flow should be managed by a dedicated state machine (e.g., using a library like XState or Zustand) or encapsulated within a single, robust async "saga" function.
    -   **Define Clear States:** The state should not be a simple boolean (`inRoom`). It should be more descriptive: `"joining_room_api"`, `"joining_player_socket"`, `"joining_room_socket"`, `"in_room_active"`, `"join_failed"`.
    -   **Avoid Optimistic UI:** Do not set `inRoom: true` until the final `on('room_joined')` event is received from the server. Until then, the UI should show a dedicated loading state (e.g., "Joining room...").

#### **Major Issue 2: Optimistic UI Updates on Critical Failures**

The application sometimes updates the UI before an action is confirmed by the server, leading to a desynchronized state if the action fails.

-   **The Flow (`leaveRoom` function):**
    1.  The `leaveRoom` function is called.
    2.  It makes a REST API call to `/rooms/leave`.
    3.  Crucially, the `try...catch` block's `catch` and `finally` clauses will reset the UI state (`updateState({ inRoom: false, ... })`) regardless of whether the server actually processed the request.

-   **Potential Bug:** If the `leaveRoom` API call fails due to a network error or server issue, the user's UI will show them as having left the room (returning them to the Home screen), but they may still be in the room on the backend. They might even lose their stake if a new round starts.

-   **Recommendation for Improvement:**
    -   **Adopt Non-Optimistic Updates:** For critical actions, the UI state should only be updated upon successful confirmation from the server.
    -   **Use Toast Notifications for Errors:** If an API call like `leaveRoom` fails, the UI should *not* change. Instead, a non-intrusive notification (a "toast") should appear, informing the user "Failed to leave the room. Please try again." This keeps the UI truthful to the last known server state.

#### **Architectural Issue 3: The "God" Context (`GameContext.tsx`)**

`GameContext.tsx` is a "god object." It manages authentication, player data, navigation, room state, live game logic, round results, and local UI settings.

-   **The Problem:**
    -   **Low Cohesion:** The file is massive (over 400 lines) and mixes unrelated concerns, making it difficult to navigate and understand.
    -   **Unnecessary Re-renders:** Any component that uses the `useGame()` hook will be subscribed to *all* state changes. This means a component might re-render when a completely unrelated piece of state is updated (e.g., toggling a sound setting could cause the `Lobby` component to re-evaluate).
    -   **Maintenance Overhead:** Modifying one part of the state (e.g., adding a new setting) requires careful consideration of its impact on the entire context.

-   **Recommendation for Improvement:**
    -   **Decompose the Context:** Split the context into logical, focused providers that can be composed together.
        -   **`AuthContext`:** Manages `playerId`, `username`, `balance`, and the `register`/`logout` functions.
        -   **`RoomContext`:** Manages all live gameplay state (`inRoom`, `roomKey`, `gamePhase`, `round`, `results`) and the corresponding actions (`commitChoice`, `leaveRoom`).
        -   **`SettingsContext`:** Manages local UI settings (`sound`, `haptics`, etc.).
    -   **Benefits:** This separation of concerns would make the application easier to reason about, improve performance by limiting re-renders, and make the codebase significantly more maintainable for a development team.
