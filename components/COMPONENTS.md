# Developer Guide: Component Architecture

This document provides a detailed breakdown of the React component architecture for the Think Alike web application. It is intended for developers to understand the role of each component, its data dependencies, and how it fits into the overall UI and state management system.

## Component Philosophy

The component architecture is designed to be modular and maintainable, following a clear hierarchy that separates concerns. Understanding this hierarchy is key to knowing where to find or place code.

1.  **Root Component (`App.tsx`)**: The main application shell. Its single responsibility is to act as a router, rendering the correct screen based on the global state.
2.  **Screen Components**: These are the top-level components that represent a full view or screen (e.g., `Home`, `Lobby`, `RoundSelect`). They are the primary consumers of the `GameContext`, reading state and dispatching actions.
3.  **Shared Components (`/shared`)**: These are reusable components that contain application-specific logic and styling (e.g., `StatusBar`, `WireCard`). They are "dumb" components that receive all their data and functions as props from their parent Screen Component.
4.  **UI Primitives (`/ui`)**: These are generic, reusable UI elements like `Button` and `Input`, with no application-specific logic. They form the base of the design system.

---

## The Core: Application Shell & Layout

### `App.tsx`

This is the master router of the application. It contains the `RenderScreen` component which determines the single active screen based on the global `GameState`.

| State Dependency | Logic | Rendered Component | Developer Notes |
| :--- | :--- | :--- | :--- |
| `!player.isAuthenticated` | If the user is not logged in, nothing else matters. | `<Login />` | This is the first check, acting as a hard gate. |
| `isInRoom` | If the player is in a room, the UI is dictated by the round's state. | *(Switches on `round.phase`)* | This check takes precedence over `currentView`. |
| `round.phase === 'selecting'` | The round is active and waiting for player input. | `<RoundSelect />` | The main gameplay screen. |
| `round.phase === 'revealing'` or `'complete'` | The round is over, and results are being shown. | `<RoundReveal />` | Handles both the reveal animation and the final results display. |
| `!round` or `round.phase === 'waiting'` | The player is in a room, but no round is active. | `<WaitingRoom />` | The default state when inside a room. |
| `!isInRoom` | If not in a room, navigation is controlled by `currentView`. | *(Switches on `currentView`)* | This is the main navigation for the "lobby" part of the app. |

### `shared/StatusBar.tsx`

This is a persistent header displayed on most screens. It provides the user with at-a-glance information about their status.

| Data from Context | Displayed Information | Developer Notes |
| :--- | :--- | :--- |
| `player.username`, `player.balance` | The user's identity and current token balance. | Uses the `usePlayer` hook for optimized re-renders. |
| `room.player_count`, `room.max_players`, `prizePool` | Live player count and prize pool. | Uses the `useRoom` hook. This data is only shown if `isInRoom` is true. |

---

## Screen Components

Each screen is a top-level component responsible for a distinct view in the application. They are the primary consumers of the `GameContext`.

*(For brevity, only key screens are detailed below. Others like `Leaderboard`, `Rewards`, and `Settings` follow a similar pattern.)*

### `Login.tsx`

| Aspect | Details | Developer Notes |
| :--- | :--- | :--- |
| **Purpose** | The initial screen for unauthenticated users to register a username. | |
| **Data from Context** | `isLoading`, `error` | Reads the global loading and error states to provide real-time feedback during registration. |
| **Actions Triggered** | `actions.register(username)` | Called on form submission. The component offloads all async logic and state management to the context. |
| **Local State Mgmt** | `useState` for `username` input. | The form input state is kept local as no other component needs it until submission. This is a key pattern: use local state for ephemeral UI state. |

### `Home.tsx`

| Aspect | Details | Developer Notes |
| :--- | :--- | :--- |
| **Purpose** | The main dashboard and navigation hub for authenticated users. | |
| **Data from Context** | `lastTier`, `lastStake`, `isLoading` | Reads `lastTier` to enable the "Quick Rejoin" button. `isLoading` is used to disable all buttons while a join action is in progress. |
| **Actions Triggered** | `actions.setCurrentView(screen)`, `actions.quickJoin(tier)`, `actions.logout()` | Handles all primary navigation and room-joining intents from the main menu. |
| **Local State Mgmt** | `useState` for `quickJoinOptions`, `isLoading`, `error` | This component fetches its own data for the "Join a Room" list. **Rationale**: This keeps lobby summary data, which is only needed here, out of the global state. |

### `RoundSelect.tsx`

| Aspect | Details | Developer Notes |
| :--- | :--- | :--- |
| **Purpose** | The primary gameplay screen where the player makes their choice for the round. | |
| **Data from Context** | `round`, `commitState`, `players`, `endOfRoundAction` | Reads all critical live game data to render the adjective, nouns, timers, and player lock-in status. |
| **Actions Triggered** | `actions.commitChoice(index)`, `actions.setEndOfRoundAction(action)` | `commitChoice` is the most critical gameplay action. `setEndOfRoundAction` allows the user to configure their intent for the next round. |
| **Local State Mgmt** | `useState` and `useEffect` for `timeLeft`. | A timer is managed locally via `setInterval`. **Rationale**: This avoids flooding the global state with rapid-fire timer updates, which would cause unnecessary re-renders across the app. |

---

## Shared & UI Components

### Key Shared Components (`/shared`)

These are the most important custom, reusable building blocks. They are always "dumb" components that receive data and functions via props.

-   **`Frame.tsx`**: A simple container with a styled border and background. It provides visual grouping for sections of content. It accepts a `className` prop to allow for layout adjustments.
-   **`SectionHeader.tsx`**: Provides a consistent heading style (`h2`) with an optional right-aligned slot for action buttons (e.g., a refresh icon). This enforces visual consistency for all section titles.
-   **`ProgressBar.tsx`**: A visual bar that fills based on a `progress` prop (a number from 0 to 100). It is used in `RoundSelect` for the timer and in `Rewards` for quest progress.
-   **`WireCard.tsx`**: The clickable noun card. This is a highly specialized component for the `RoundSelect` screen. It has a `selected` variant to show visual feedback and is disabled via props after the user has committed their choice.

### UI Primitives (`/ui`)

These are generic UI elements, often adapted from a library like `shadcn/ui`. They form the base of the design system and have no application logic.

-   **`button.tsx`**: The base for all buttons. It uses `cva` (class-variance-authority) to provide multiple variants (`default`, `destructive`, `outline`, `ghost`) and sizes, making it highly versatile.
-   **`input.tsx`**: A standard, styled text input field.
-   **`select.tsx`**: A full suite of accessible dropdown components used for filtering in the `Lobby` and setting options in `RoundSelect`.

---

## How to Build a New Screen: A Tutorial

This guide walks through the process of creating a new, hypothetical **Player Profile** screen.

**1. Define the Screen Type:**

First, add the new screen to the `Screen` type alias in `components/context/types.ts` to make the navigation system aware of it.

```typescript
// in types.ts
export type Screen =
  | 'login'
  | 'home'
  // ... other screens
  | 'profile'; // Add the new screen here
```

**2. Create the Component File:**

Create a new file `components/Profile.tsx`. This will be the top-level screen component.

**3. Build the Basic Component:**

In `Profile.tsx`, create a basic component that connects to the `GameContext` to read the necessary data and access navigation actions.

```tsx
"use client"

import { useGame } from "@/components/context";
import { usePlayer } from "@/components/context"; // Use a specific hook for performance
import { Button } from "@/components/ui/button";
import { StatusBar } from "./shared/StatusBar";

export default function Profile() {
  const { actions } = useGame();
  const player = usePlayer();

  return (
    <div>
      <StatusBar />
      <div className="p-4">
        <h1 className="text-2xl font-bold">{player.username}</h1>
        <p>Rating: {player.rating}</p>
        <p>Balance: {player.balance}</p>
        <Button onClick={() => actions.setCurrentView('home')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
```

**4. Add Navigation to It:**

To be able to get to the new screen, add a button or link in another component, like `Home.tsx`.

```tsx
// in Home.tsx
<Button onClick={() => game.actions.setCurrentView('profile')}>
  View Profile
</Button>
```

**5. Add it to the Router:**

Finally, add the new component to the `RenderScreen` function in `components/App.tsx`.

```tsx
// in App.tsx
// ... inside RenderScreen, in the `!game.isInRoom` switch statement
  switch (game.currentView) {
    case "home":
      return <Home />;
    case "lobby":
      return <Lobby />;
    case "profile": // Add the new case here
      return <Profile />;
    // ... other cases
  }
```

By following this pattern—defining the type, creating the component, connecting to the context, and adding it to the router—you can build new features that are perfectly integrated into the application's architecture.

## Conclusion

This component architecture creates a clear separation of concerns, making the application more scalable and maintainable. By understanding the distinction between Screens, Shared Components, and UI Primitives, developers can quickly identify where to make changes and how to build new features that integrate seamlessly into the existing data flow.
