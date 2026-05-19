export const NotificationType = {
  PRODUCT_MENTION: 'product_mention',
  PRODUCT_TRENDING: 'product_trending',
  PRODUCT_PRICE_DROP: 'product_price_drop',
  PRODUCT_REVIEW: 'product_review',
  FAVORITE_UPDATE: 'favorite_update',
  SYSTEM: 'system'
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority: NotificationPriority;
  read: boolean;
  created_at: string;
}
