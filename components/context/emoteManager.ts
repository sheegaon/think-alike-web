import { Emote } from './types';
import { generateId, limitArrayLength } from './initialState';

export const createEmote = (
  playerId: string,
  playerName: string,
  emote: string
): Emote => ({
  id: generateId(),
  playerId,
  playerName,
  emote,
  timestamp: Date.now(),
});

export const addEmoteToArray = (
  emotes: Emote[],
  playerId: string,
  playerName: string,
  emote: string
): Emote[] => {
  const newEmote = createEmote(playerId, playerName, emote);
  const updatedEmotes = [...emotes, newEmote];
  return limitArrayLength(updatedEmotes, 10);
};

export const setupEmoteAutoRemoval = (
  emoteId: string,
  removeCallback: (id: string) => void
): void => {
  setTimeout(() => {
    removeCallback(emoteId);
  }, 5000);
};
