# GameContext Module

This directory contains the split GameContext implementation, broken down into logical, manageable components.

## Structure

### Core Files

- **`GameContext.tsx`** - Main context provider and consumer hook
- **`types.ts`** - All TypeScript interfaces and type definitions
- **`initialState.ts`** - Initial state creation and localStorage utilities
- **`index.ts`** - Clean export interface for the module

### Feature Modules

- **`notificationManager.ts`** - Notification creation, auto-removal, and array management
- **`emoteManager.ts`** - Emote handling with auto-removal functionality
- **`socketHandlers.ts`** - WebSocket event handlers for all game events
- **`websocketManager.ts`** - WebSocket connection management and message routing
- **`gameActions.ts`** - All game actions and user interactions

## Usage

### Basic Setup

```tsx
import { GameProvider } from './components/context';

function App() {
  return (
    <GameProvider socketUrl="ws://localhost:8080" restApi={restApiModule}>
      {/* Your app components */}
    </GameProvider>
  );
}
```

### Using the Context

```tsx
import { useGame } from './components/context';

function MyComponent() {
  const { player, room, actions } = useGame();
  
  const handleJoinRoom = () => {
    actions.quickJoin('casual');
  };
  
  return (
    <div>
      <p>Welcome, {player.username}!</p>
      <button onClick={handleJoinRoom}>Quick Join</button>
    </div>
  );
}
```
