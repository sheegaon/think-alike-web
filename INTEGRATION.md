# Developer Guide: System Integration & Architecture

This document provides a holistic, end-to-end overview of the Think Alike web application. It describes how the different architectural layers—from the UI components to the state management and backend services—work together to create a cohesive user experience. It is intended to be the starting point for any developer looking to understand the complete system.

## Architectural Layers

The application is built on a clear, layered architecture that separates concerns, making the codebase more modular and maintainable.

1.  **View Layer (`/components`)**: The user-facing part of the application, built with React. This layer is responsible for rendering the UI and capturing user input. It is further divided into **Screens**, **Shared Components**, and **UI Primitives**.

2.  **State Management Layer (`/components/context`)**: The central nervous system of the application. It uses React's Context API to manage the global `GameState`. This layer is responsible for holding all shared data, orchestrating actions, and updating the UI in response to events.

3.  **Service Layer (`/lib`)**: The bridge between the frontend application and the outside world. This layer contains clients for communicating with the backend (both REST and WebSockets) and other core utilities. It is designed to be completely independent of the UI.

4.  **Application Entry (`/src`)**: The initialization layer. This is where the React application is mounted to the DOM and where the top-level context providers (like `GameProvider`) are wrapped around the main `App` component.

---

## The Core Data Flow: Anatomy of an Action

To understand how these layers interact, we can trace a single, common user action from start to finish. The `quickJoin` action is a perfect example as it touches every layer of the architecture.

**Goal**: A user clicks the "Quick Join" button on the `Home` screen and successfully enters a game room.

1.  **View Layer: UI Interaction**
    -   **File**: `components/Home.tsx`
    -   The user clicks a `Button` component.
    -   The `onClick` handler in `Home.tsx` calls `actions.quickJoin('casual')`, which it gets from the `useGame()` hook.

2.  **State Management Layer: Action Execution**
    -   **File**: `components/context/gameActions.ts`
    -   The `quickJoin` function is executed. Its first job is to provide immediate UI feedback by calling `updateState({ isLoading: true })`. This sets a global loading flag.

3.  **Service Layer: Backend Communication (REST)**
    -   **File**: `lib/rest.ts`
    -   The `quickJoin` action calls the `quickJoinRoom()` function from the REST client, passing the player's ID and the desired tier.
    -   The `quickJoinRoom` function constructs and sends a `POST` request to the `/api/v1/rooms/quick-join` endpoint.

4.  **State Management Layer: Handling the Response**
    -   **File**: `components/context/gameActions.ts`
    -   The `await` for the REST call completes, and the action receives a response containing the `room_key` and a temporary `room_token`.
    -   The action immediately calls `updateState` again to store this critical information: `isLoading: false`, `currentRoomKey: response.room_key`.

5.  **Service Layer: Backend Communication (WebSocket)**
    -   **File**: `lib/socket.ts`
    -   The `quickJoin` action now calls `socket.joinRoom(response.room_token)`, using the temporary token to authenticate for the real-time channel.
    -   The socket client emits a `join_room` event to the WebSocket server.

6.  **Server Push & Event Handling**
    -   The server validates the token and, upon success, broadcasts a `room_joined` event to all clients in that room, containing the full room state.
    -   The `onRoomJoined` event handler in `gameActions.ts` (which was registered when the context was initialized) catches this incoming event.

7.  **State Management Layer: Final State Update**
    -   **File**: `components/context/gameActions.ts`
    -   The `onRoomJoined` handler calls `updateState` one last time with the full room details: `isInRoom: true`, `room: { ... }`, and `currentView: 'waiting-room'`.

8.  **View Layer: Reactive UI Update**
    -   **File**: `components/App.tsx`
    -   The `RenderScreen` component, which is subscribed to `GameState`, detects the changes to `isInRoom` and `currentView`.
    -   It automatically unmounts the `<Home />` screen and mounts the `<WaitingRoom />` screen, completing the user's journey without any manual navigation logic.

This unidirectional and centralized flow is the foundational pattern for all interactions in the application.

---

## Critical Analysis & Opportunities for Improvement

While the current architecture is functional and follows many best practices, a critical review reveals several opportunities for improvement to enhance maintainability, performance, and robustness.

### Weakness 1: The "God" Context

-   **Observation**: The `GameContext` has become a "god object." It manages nearly every piece of shared state: authentication, navigation, room data, live gameplay, results, notifications, and settings. This violates the Single Responsibility Principle.
-   **Impact**: Low cohesion makes the file difficult to navigate and understand. More importantly, it can lead to performance issues, as a component that only needs one piece of state (e.g., `settings`) might be forced to re-render when a completely unrelated piece of state (e.g., `round.timeLeft`) is updated.
-   **Opportunity**: **Decompose the context.** Split the `GameContext` into smaller, more focused providers that can be composed together:
    -   `AuthContext`: Manages `player`, `isAuthenticated`, and the `register`/`logout` actions.
    -   `RoomContext`: Manages all live gameplay state (`isInRoom`, `room`, `round`, `results`) and the corresponding actions.
    -   `SettingsContext`: Manages local UI settings.
    This would improve performance by limiting re-renders and make the codebase significantly easier to maintain.

### Weakness 2: Inconsistent Data Fetching Patterns

-   **Observation**: Some screens, like `Home` and `Lobby`, fetch their own data directly from the `lib/rest.ts` client and manage it in local state. Other screens rely entirely on data being present in the `GameContext`.
-   **Impact**: This inconsistency can be confusing for new developers. It blurs the line of responsibility—should a component fetch its own data, or should it expect the context to provide it?
-   **Opportunity**: **Centralize data fetching within context actions.** A more robust pattern would be to have all API calls initiated from `gameActions.ts`. For the lobby, an `actions.fetchLobbyData()` could be created. The data would still be stored in a local state within the `Lobby` component, but the *initiation* of the fetch would be centralized, making the data flow more predictable.

### Weakness 3: Fragile Asynchronous Sequences

-   **Observation**: The multi-step process for joining a room (REST call -> state update -> socket event -> another state update) is a complex, asynchronous sequence. This manual orchestration is fragile and can be prone to race conditions or getting stuck in an inconsistent state if one of the steps fails.
-   **Impact**: If the `join_room` WebSocket event fails after the initial REST call succeeds, the user could be left in a broken state where the UI thinks they are in a room, but they are not receiving any game events.
-   **Opportunity**: **Adopt a more robust async management pattern.**
    -   **State Machine**: For critical flows like joining a room, using a small state machine (with a library like XState or even a simple reducer) would be ideal. The state could be explicitly defined as `'idle'`, `'fetching_token'`, `'joining_channel'`, `'success'`, or `'error'`, making the flow resilient and easy to debug.
    -   **Sagas/Epics**: Alternatively, patterns from libraries like Redux-Saga could be adopted to manage complex async flows in a more structured way.

By addressing these architectural weaknesses, the application can become more robust, performant, and easier for a growing team to maintain and extend.

## Other Ideas for Improvement

-   **Rules**: Create a dedicated `Rules` screen accessible from the `Home` screen to explain how to play the game. Load this screen automatically the first time a user visits the site.

-   **Error Handling & User Experience**: Implement a centralized error boundary system with more granular error handling for different failure scenarios (network timeouts, WebSocket disconnections, API errors). Provide actionable feedback to users with retry mechanisms, fallback UI states, and clear error messages.

-   **Feature Flags & Configuration Management**: Implement a feature flag system to enable/disable experimental features, conduct A/B tests, and manage different configurations for development, staging, and production environments without requiring code deployments.

-   **Monitoring & Analytics**: Integrate comprehensive monitoring solutions including client-side error tracking (Sentry), user analytics (Google Analytics, Mixpanel), performance monitoring (Web Vitals), and real-time application monitoring to track user behavior and system health.

-   **Security Hardening**: Review and strengthen security measures including authentication token management, XSS prevention, CSP headers, secure WebSocket connections, input sanitization, and audit logging for sensitive operations.

-   **State Persistence & Offline Support**: Implement state persistence using localStorage or IndexedDB to maintain user session across browser refreshes, and consider offline support for basic functionality when network connectivity is poor.

-   **Real-time Communication Reliability**: Enhance WebSocket reliability with automatic reconnection logic, message queuing for offline periods, heartbeat mechanisms to detect connection issues, and graceful degradation when real-time features fail.

-   **User Onboarding & Help System**: Create an interactive tutorial system for new users, implement contextual help tooltips, provide in-app guidance for complex features, and establish a comprehensive FAQ or help center.

-   **API Rate Limiting & DDoS Protection**: Implement client-side rate limiting, request throttling, and work with backend teams to establish proper API rate limits and DDoS protection mechanisms.

-   **Memory Management & Resource Cleanup**: Audit the application for memory leaks, implement proper cleanup in useEffect hooks, optimize image loading and caching, and ensure WebSocket connections are properly closed when components unmount.