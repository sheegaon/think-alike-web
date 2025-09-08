import { Notification } from './types';
import { generateId, limitArrayLength } from './initialState';

export const createNotification = (
  message: string,
  type: Notification['type'] = 'info'
): Notification => ({
  id: generateId(),
  message,
  type,
  timestamp: Date.now(),
});

export const addNotificationToArray = (
  notifications: Notification[],
  message: string,
  type: Notification['type'] = 'info'
): Notification[] => {
  const newNotification = createNotification(message, type);
  const updatedNotifications = [...notifications, newNotification];
  return limitArrayLength(updatedNotifications, 10);
};

export const removeNotificationFromArray = (
  notifications: Notification[],
  id: string
): Notification[] => {
  return notifications.filter(notification => notification.id !== id);
};

export const setupNotificationAutoRemoval = (
  notificationId: string,
  removeCallback: (id: string) => void
): void => {
  setTimeout(() => {
    removeCallback(notificationId);
  }, 5000);
};
