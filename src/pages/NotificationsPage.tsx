import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiTrash2, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useNotifications } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Notification } from '../types/notification';

const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(false);

  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await markAllAsRead();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center">
            <FiBell className="text-primary text-2xl mr-3" />
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  filter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 text-sm font-medium ${
                  filter === 'unread'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  filter === 'read'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Read
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <FiCheck className="mr-2" />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" text="Processing..." />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="flex justify-center mb-4">
              <FiBell className="text-gray-400 text-5xl" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">No notifications</h2>
            <p className="text-gray-500">
              {filter === 'all'
                ? "You don't have any notifications yet."
                : filter === 'unread'
                ? "You don't have any unread notifications."
                : "You don't have any read notifications."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {filteredNotifications.map((notification: Notification) => (
                <motion.li
                  key={notification.id}
                  className={`relative ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-blue-100">
                          <FiAlertCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                          <div className="text-sm text-gray-500">{notification.message}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                        <div className="ml-4 flex-shrink-0 flex">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="mr-2 bg-blue-100 text-blue-600 hover:bg-blue-200 p-1 rounded-full"
                              title="Mark as read"
                            >
                              <FiCheck className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-1 rounded-full"
                            title="Delete notification"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NotificationsPage;
