# Refactoring Plan: Standardizing Data Fetching

**Problem**: Data fetching logic is currently inconsistent. Some components (`Lobby`, `Home`) fetch their own data directly from the `lib/rest.ts` client and manage it in local state. Other components rely on data being pushed into the global `GameContext`. This creates a confusing and unpredictable data flow for developers.

**Goal**: Establish a single, consistent pattern for all asynchronous data fetching. All API calls should be initiated from the state management layer (`gameActions.ts`), even if the resulting data is managed by a component's local state. This makes the data flow predictable and centralizes all interactions with the backend.

---

## Proposed Data Fetching Pattern

1.  **Actions as Initiators**: All API calls must be wrapped in an action function in `gameActions.ts`. Components should **never** import from `lib/rest.ts` directly.
2.  **Actions Return Data**: For data that is only needed by a single component (like the lobby room list), the action will `await` the API call and **return the response**. This allows the component to manage its own loading and error states.
3.  **Components Manage Local State**: The calling component will be responsible for calling the action and managing the returned data in its own local `useState` hooks. This keeps the global `GameContext` clean from ephemeral, view-specific data.

This pattern provides the best of both worlds: a centralized, traceable API layer and encapsulated component-level state.

---

## Step-by-Step Refactoring Plan

### Phase 1: Refactor `Lobby.tsx`

This is the most complex case and serves as the primary model for the new pattern.

1.  **Create New Action**:
    -   In `gameActions.ts`, create a new action: `fetchLobbyRooms: async (tier: string) => { ... }`.
    -   This action will call the `getRooms(tier)` function from `lib/rest.ts` and return the promise.

2.  **Update `Lobby.tsx`**:
    -   Remove the direct import of `getRooms` from `lib/rest.ts`.
    -   In the `fetchRooms` function, replace the direct API call with a call to the new context action: `const response = await actions.fetchLobbyRooms(filter);`
    -   The component will continue to use its local `useState` hooks (`allRooms`, `isLoading`, `error`) to manage the UI state based on the data returned from the action.

**Before:**
```tsx
// In Lobby.tsx
import { getRooms } from "@/lib/rest";

const fetchRooms = useCallback(async () => {
  const response = await getRooms(filter);
  setAllRooms(response.rooms);
}, [filter]);
```

**After:**
```tsx
// In Lobby.tsx
import { useGame } from "@/components/context";

const { actions } = useGame();

const fetchRooms = useCallback(async () => {
  const response = await actions.fetchLobbyRooms(filter);
  setAllRooms(response.rooms);
}, [actions, filter]);
```

### Phase 2: Refactor `Home.tsx`

This component fetches a summary of rooms.

1.  **Create New Action**: In `gameActions.ts`, create `fetchRoomSummary: async () => { ... }` that calls `getRooms()` with no arguments and returns the result.
2.  **Update `Home.tsx`**: In its `fetchQuickJoinData` function, replace the direct call to `getRooms()` with `actions.fetchRoomSummary()`.

### Phase 3: Refactor `Rewards.tsx`

This component fetches and claims quests.

1.  **Create New Actions**:
    -   Create `fetchQuests: async () => { ... }` that calls `getPlayerQuests()`.
    -   Create `claimQuestReward: async (questId: string) => { ... }` that calls the corresponding REST function.
2.  **Update `Rewards.tsx`**: Replace all direct API calls with the new actions. The `handleClaim` function will now `await actions.claimQuestReward(questId)` and then call `actions.fetchQuests()` again to refresh its data.

## Expected Outcome

-   **Single Source of Interaction**: Developers will know that `gameActions.ts` is the *only* file that should be interacting with the `lib/rest.ts` service layer. This makes the system much easier to reason about.
-   **Predictable Data Flow**: The flow of `Component -> Action -> Service` is enforced everywhere, making debugging more straightforward.
-   **Decoupled Components**: UI components are fully decoupled from the implementation details of the API, making them more resilient to changes in the backend services.
-   **Clean Global State**: The `GameContext` remains clean, as it is not polluted with data that is only relevant to a single screen.

This refactoring will create a clear, maintainable, and consistent pattern for data fetching across the entire application.
