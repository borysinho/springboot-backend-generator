import { useState, useCallback, useRef } from "react";
import type { Notification } from "../components/NotificationSystem";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const counterRef = useRef(0);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, autoClose: false } : n))
    );

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 300); // Tiempo para la animación de fade out
  }, []);

  const addNotification = useCallback(
    (
      type: Notification["type"],
      title: string,
      message: string,
      autoClose: boolean = true,
      duration: number = 5000
    ) => {
      const id = `notification-${++counterRef.current}`;
      const notification: Notification = {
        id,
        type,
        title,
        message,
        timestamp: new Date(),
        autoClose,
        duration,
      };

      setNotifications((prev) => [notification, ...prev]);

      if (autoClose) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    [removeNotification]
  );

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };
}
