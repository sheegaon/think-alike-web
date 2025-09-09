# Refactoring Plan: Decomposing the "God" Context

**Problem**: The primary `GameContext` has become a "god object," managing too many unrelated pieces of state (authentication, room state, settings, etc.). This violates the Single Responsibility Principle, hurts performance due to unnecessary re-renders, and makes the codebase difficult to maintain.

**Goal**: Decompose the single `GameContext` into multiple, smaller, domain-focused contexts. This will improve performance, increase maintainability, and clarify the separation of concerns.

---

## Proposed Context Architecture

We will split the existing context into four new, independent contexts:

1.  **`NavigationContext`**: A lean, top-level context for managing the application's view state.
    -   **State**: `currentView`, `previousView`
    -   **Actions**: `setCurrentView`, `goBack`

2.  **`SettingsContext`**: Manages local, client-side UI preferences.
    -   **State**: `settings` (sound, haptics, etc.)
    -   **Actions**: `updateSetting`

3.  **`AuthContext`**: Manages user authentication and player data.
    -   **State**: `player`, `isAuthenticated`, `isRegistering`
    -   **Actions**: `register`, `logout`

4.  **`RoomContext`**: Manages all live gameplay and room-related state. This context will have a dependency on `AuthContext` to access the `playerId`.
    -   **State**: `room`, `players`, `isInRoom`, `currentRoomKey`, `round`, `commitState`, `results`, `queueState`
    -   **Actions**: `quickJoin`, `joinRoom`, `leaveRoom`, `spectateRoom`, `commitChoice`, `toggleSpectatorQueue`

These will be wrapped in a single `AppProvider` in `App.tsx` to keep the root component clean.

---

## Step-by-Step Refactoring Plan

This refactoring can be done incrementally to minimize disruption.

### Phase 1: Create the `SettingsContext` (Low-Risk)

This is the most isolated piece of state and is the easiest to extract.

1.  **Create New Files**: Create `components/context/SettingsContext.tsx` and `components/context/settingsTypes.ts`.
2.  **Define Types**: Move the `GameSettings` type from `types.ts` to `settingsTypes.ts`.
3.  **Define Context**: In `SettingsContext.tsx`, create a new `SettingsContext` with a provider that manages only the `settings` state and the `updateSetting` action. The logic can be moved directly from `gameActions.ts` and `GameContext.tsx`.
4.  **Update App Provider**: In `App.tsx`, wrap the existing `GameProvider` with the new `SettingsProvider`.
5.  **Refactor Component**: Update `Settings.tsx` to use the new `useSettings()` hook from `SettingsContext` instead of `useGame()`.
6.  **Remove Old Code**: Once verified, remove the `settings` state and `updateSetting` action from the main `GameContext` and `gameActions.ts`.

### Phase 2: Create the `AuthContext`

This is a more critical but still well-defined domain.

1.  **Create New Files**: Create `components/context/AuthContext.tsx` and `components/context/authTypes.ts`.
2.  **Define Types**: Move the `Player` type and related auth types to `authTypes.ts`.
3.  **Define Context**: Create the `AuthProvider`. It will manage `player`, `isAuthenticated`, and `isRegistering`.
4.  **Extract Logic**: Move the `register` and `logout` actions from `gameActions.ts` into the `AuthContext`. The `createOrGetPlayer` service call will now be initiated from here. The `logout` action will need to call a reset function on the `RoomContext` (to be created in Phase 3).
5.  **Update App Provider**: Nest the providers correctly in `App.tsx`. The `GameProvider` will depend on `AuthContext`, so `AuthProvider` must be outside it.
    ```tsx
    <AuthProvider>
      <GameProvider>
        <SettingsProvider>{/* ... */}</SettingsProvider>
      </GameProvider>
    </AuthProvider>
    ```
6.  **Refactor Components**: Update `Login.tsx`, `Home.tsx`, and `StatusBar.tsx` to get player data from `useAuth()` instead of `useGame()`.

### Phase 3: Refactor `GameContext` into `RoomContext` and `NavigationContext`

This is the final and most significant step.

1.  **Create `NavigationContext`**: Create `NavigationContext.tsx`. Extract the `currentView`, `previousView`, `setCurrentView`, and `goBack` logic from `GameContext` into this new, lean context.
2.  **Rename and Refactor `GameContext`**: Rename `GameContext.tsx` to `RoomContext.tsx`. This context will now only manage state directly related to being in a game room (`room`, `round`, `results`, etc.).
3.  **Establish Dependency**: The `RoomContext` will now *depend* on the `AuthContext`. It will use the `useAuth()` hook internally to get the `playerId` needed for its actions (like `quickJoin`). This is a key pattern for inter-context dependency.
    ```tsx
    // Inside RoomContext.tsx
    const { player } = useAuth();
    const playerId = player.id;
    // Now use this playerId in actions like quickJoin
    ```
4.  **Update App Provider**: Finalize the provider nesting in `App.tsx`.
    ```tsx
    <AppProvider> // A simple component that composes all the providers
      <NavigationProvider>
        <AuthProvider>
          <RoomProvider>
            <SettingsProvider>{/* ... */}</SettingsProvider>
          </RoomProvider>
        </AuthProvider>
      </NavigationProvider>
    </AppProvider>
    ```
5.  **Update Component Hooks**: Refactor all remaining screens (`RoundSelect`, `WaitingRoom`, `Lobby`, etc.) to use the new, more specific hooks: `useNavigation()`, `useAuth()`, and `useRoom()`. The `useGame()` hook will be deprecated and removed.

## Expected Outcome

-   **Improved Performance**: Components will only re-render when the specific slice of state they care about changes. Toggling a setting will no longer re-render the `RoundSelect` screen.
-   **Enhanced Maintainability**: The codebase will be much easier to navigate. A developer working on an authentication bug will know to look directly in `AuthContext.tsx`.
-   **Clearer Data Flow**: The dependencies between different domains of the application will be explicit (e.g., `RoomContext` depends on `AuthContext`).
-   **Developer-Friendly**: The new structure will be more intuitive for new developers and will make adding new features a more isolated and less risky process.

This refactoring will result in a more robust, scalable, and professional architecture.
