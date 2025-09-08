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

## Key Improvements

### 1. Enhanced Commit-Reveal State
Added comprehensive `commitState` object with:
- `hasCommitted` - Whether player has committed their choice
- `hasRevealed` - Whether the reveal phase has completed
- `choice` - The actual choice made
- `nonce` - Random nonce for commit-reveal scheme
- `hash` - Cryptographic hash of choice + nonce

### 2. Notification Management
- Auto-removal after 5 seconds
- Limited to 10 notifications maximum
- Type-safe notification creation and management

### 3. Emote Management
- Auto-removal after 5 seconds
- Limited to 10 recent emotes
- Clean emote creation and array management

### 4. Enhanced Settings
Added additional settings from the old context:
- `showTimers` - Show/hide countdown timers
- `dataSaver` - Enable data saving mode
- `allowSpectators` - Allow spectator mode

### 5. Robust WebSocket Management
- Automatic reconnection on disconnect
- Proper error handling with specific error codes
- Clean separation of event handling logic

### 6. Queue State Management
- Full queue state tracking
- Toggle spectator queue functionality
- Position and wait time estimation

## Error Handling

The context includes comprehensive error handling:
- Authentication failures clear localStorage and redirect to login
- Network errors show user-friendly notifications
- WebSocket disconnections trigger automatic reconnection

## LocalStorage Integration

- Settings are automatically saved/loaded
- Player data persists across sessions
- Preferred stakes and other preferences are maintained

## Type Safety

All components are fully typed with TypeScript, providing:
- IntelliSense support
- Compile-time error checking
- Clear interface contracts

## Migration from Old Context

This new structure includes all functionality from the old GameContext with improvements:
- Better state organization
- Enhanced error handling
- More granular state management
- Improved type safety
- Cleaner separation of concerns
