# Developer Guide: End-to-End Game Flow

This document provides a highly detailed, technical trace of the Think Alike web application's game flow. It is designed to give developers a concrete, step-by-step understanding of the entire sequence of events, from UI interaction to backend communication and state management.

## Core Architecture

The application follows a reactive, centralized state management pattern.

-   **State Hub (`GameContext.tsx`)**: Manages the entire application state (`GameState`) and exposes it to all components via React hooks. It is the single source of truth for the UI.
-   **Action Layer (`gameActions.ts`)**: Contains all functions that modify the state. These actions orchestrate UI updates, API calls, and WebSocket events.
-   **Communication Channels**:
    -   **REST API (`lib/rest.ts`)**: For transactional operations (login, join room). These are stateless, request-response calls.
    -   **WebSockets (`lib/socket.ts`)**: For real-time, stateful communication during gameplay (receiving deals, sending choices, getting results).

---

## Anatomy of a Player Session

This trace follows a single player through the most common application path: **Login -> Join Room -> Play One Round -> Leave Room**.

### Stage 1: Player Login

**Goal**: The user authenticates and establishes a player session.

| Step | Actor & Action | File & Function | Backend Interaction | GameState Changes & UI Impact |
| :--- | :--- | :--- | :--- | :--- |
| 1 | User enters `username` and clicks "Login" | `Login.tsx` -> `onClick` | *(None)* | Triggers the `register` action. |
| 2 | Action is executed | `gameActions.ts` -> `createAuthActions.register()` | *(None)* | `isRegistering: true`. UI shows a loading spinner. |
| 3 | API call is made | `lib/rest.ts` -> `createOrGetPlayer()` | `GET /api/v1/players/username/{username}` | The app first tries to fetch an existing player. |
| 4 | Player not found, API call retries | `lib/rest.ts` -> `createPlayer()` | `POST /api/v1/players` (Body: `{ "username": "..." }`) | If the GET fails with a 404, the client automatically tries to create a new player. |
| 5 | Backend responds | *(Server)* | `200 OK` (Payload: `{ "id": 123, "username": "...", "balance": 1000 }`) | The server returns the full player object. |
| 6 | State is updated with player data | `gameActions.ts` -> `register()` -> `updateState()` | *(None)* | `player`: populated, `isAuthenticated: true`, `isRegistering: false`, `currentView: 'home'`. The UI navigates to the Home screen. |
| 7 | Player session is registered on WebSocket | `GameContext.tsx` -> `useEffect` | `emit('join_player', { "player_id": 123 })` | An effect hook, seeing `isAuthenticated` is now true, tells the server to associate this socket connection with the player ID. |

### Stage 2: Joining a Room

**Goal**: The user transitions from the lobby into an active game room.

| Step | Actor & Action | File & Function | Backend Interaction | GameState Changes & UI Impact |
| :--- | :--- | :--- | :--- | :--- |
| 1 | User clicks "Quick Join" | `Home.tsx` -> `onClick` | *(None)* | Triggers the `quickJoin` action. |
| 2 | Action is executed | `gameActions.ts` -> `createRoomActions.quickJoin()` | *(None)* | `isLoading: true`. UI shows a loading state. |
| 3 | API call is made to find a room | `lib/rest.ts` -> `quickJoinRoom()` | `POST /api/v1/rooms/quick-join` (Body: `{ "player_id": 123, "tier": "casual" }`) | The client requests to join a room. |
| 4 | Backend responds with credentials | *(Server)* | `200 OK` (Payload: `{ "room_key": "xyz-abc", "room_token": "temp-token-123", ... }`) | The server returns the **full room key** and a **temporary, single-use token** for WebSocket authentication. |
| 5 | State is updated with room key | `gameActions.ts` -> `quickJoin()` -> `updateState()` | *(None)* | `isLoading: false`, `currentRoomKey: "xyz-abc"`. The full key is now stored for future API calls (like leaving). |
| 6 | Client authenticates for the room channel | `lib/socket.ts` -> `joinRoom()` | `emit('join_room', { "room_token": "temp-token-123" })` | The client sends the temporary token to the WebSocket server to prove it's authorized to join. |
| 7 | Server confirms room entry | *(Server)* | `broadcast('room_joined')` (Payload: `{ "tier": "casual", "stake": 10, ... }`) | The server adds the player to the room's broadcast channel and sends a confirmation with the full room details. |
| 8 | Final state update | `gameActions.ts` -> `onRoomJoined()` -> `updateState()` | *(None)* | `isInRoom: true`, `room`: populated, `currentView: 'waiting-room'`. The UI navigates to the Waiting Room screen. |

### Stage 3: Playing a Round

**Goal**: The user participates in a full commit-reveal game round, driven entirely by WebSockets.

| Step | Actor & Action | File & Function | Backend Interaction | GameState Changes & UI Impact |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Server starts the round | *(Server)* | `broadcast('deal')` (Payload: `{ "round_key": "r-456", "adjective": "Spicy", "nouns": [...] }`) | The server pushes the round data to all clients in the room. |
| 2 | Client receives the deal | `gameActions.ts` -> `onDeal()` | *(None)* | `round`: populated, `commitState`: reset, `currentView: 'round-select'`. The UI displays the adjective and noun choices. |
| 3 | User clicks a noun card | `RoundSelect.tsx` -> `onClick` | *(None)* | Triggers the `commitChoice` action. |
| 4 | Client sends its **commit** | `gameActions.ts` -> `commitChoice()` | `emit('commit', { "hash": "sha256(...)" })` | The client generates a secret `nonce`, hashes it with the choice, and sends **only the hash** to the server. |
| 5 | Local state is updated | `gameActions.ts` -> `commitChoice()` -> `updateState()` | *(None)* | `commitState`: `{ hasCommitted: true, choice: 2, nonce: "secret-nonce" }`. The UI shows the choice is locked in. |
| 6 | Server requests reveals | *(Server)* | `broadcast('request_reveal')` | After the timer ends, the server asks all clients to reveal their choices. |
| 7 | Client automatically reveals | `gameActions.ts` -> `onRequestReveal()` | `emit('reveal', { "choice": 2, "nonce": "secret-nonce", ... })` | The client sends the original choice and nonce. The server verifies it against the stored hash. |
| 8 | Server sends results | *(Server)* | `broadcast('round_results')` (Payload: `{ "winnings": 50, "new_balance": 1050, ... }`) | The server sends the outcome to all players. |
| 9 | Client receives results | `gameActions.ts` -> `onRoundResults()` | *(None)* | `results`: populated, `player.balance`: updated. The UI displays the results screen. |

### Stage 4: Leaving the Room

**Goal**: The user exits the room and returns to the lobby.

| Step | Actor & Action | File & Function | Backend Interaction | GameState Changes & UI Impact |
| :--- | :--- | :--- | :--- | :--- |
| 1 | User clicks "Leave Room" | `WaitingRoom.tsx` -> `onClick` | *(None)* | Triggers the `leaveRoom` action. |
| 2 | Action is executed | `gameActions.ts` -> `createRoomActions.leaveRoom()` | `POST /api/v1/rooms/leave` (Body: `{ "room_key": "xyz-abc", "player_id": 123 }`) | The action makes a REST call using the stored `currentRoomKey` to formally exit. |
| 3 | Client leaves the socket channel | `gameActions.ts` -> `leaveRoom()` | `emit('leave_room')` | The client tells the WebSocket server it no longer wants to receive events for this room. |
| 4 | Server confirms exit | *(Server)* | `broadcast('room_left')` | The server can optionally confirm the exit. |
| 5 | State is reset | `gameActions.ts` -> `onRoomLeft()` -> `updateState()` | *(None)* | `isInRoom: false`, `room: null`, `currentRoomKey: null`, `round: null`, `currentView: 'home'`. The UI navigates back to the Home screen. |

---

This detailed flow provides a clear map for debugging and development. By understanding which part of the system is responsible for each step, developers can more easily locate bugs and build new features that align with the established architecture.
