import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket, SocketEvent } from './SocketContext';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types/notification';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);
export const useNotification = useNotifications;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocket();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (socket && isConnected && isAuthenticated) {
      socket.on(SocketEvent.USER_NOTIFICATION, (notification: Notification) => {
        setNotifications((prev: Notification[]) => [notification, ...prev]);
        setUnreadCount((prev: number) => prev + 1);
      });

      return () => {
        socket.off(SocketEvent.USER_NOTIFICATION);
      };
    }
  }, [socket, isConnected, isAuthenticated]);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const response = await notificationService.getNotifications();
      setNotifications(response.notifications);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const markAsRead = async (notificationId: number) => {
    if (!isAuthenticated) return;

    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev: Notification[]) =>
        prev.map((notification: Notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    if (!isAuthenticated) return;

    try {
      await notificationService.markAllAsRead();
      setNotifications((prev: Notification[]) =>
        prev.map((notification: Notification) => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  };

  const deleteNotification = async (notificationId: number) => {
    if (!isAuthenticated) return;

    try {
      await notificationService.deleteNotification(notificationId);
      const deletedNotification = notifications.find((n: Notification) => n.id === notificationId);
      setNotifications((prev: Notification[]) => prev.filter((n: Notification) => n.id !== notificationId));
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount((prev: number) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
