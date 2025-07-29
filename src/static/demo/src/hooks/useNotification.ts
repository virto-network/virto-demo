import { useState, useCallback } from 'react';

export interface NotificationData {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = useCallback((type: 'success' | 'error', title: string, message: string) => {
    const id = Date.now().toString();
    const newNotification: NotificationData = {
      id,
      type,
      title,
      message
    };

    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccessNotification = useCallback((title: string, message: string) => {
    showNotification('success', title, message);
  }, [showNotification]);

  const showErrorNotification = useCallback((title: string, message: string) => {
    showNotification('error', title, message);
  }, [showNotification]);

  return {
    notifications,
    showSuccessNotification,
    showErrorNotification,
    removeNotification
  };
}; 