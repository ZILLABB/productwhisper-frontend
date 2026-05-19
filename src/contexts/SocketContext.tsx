import React, { createContext, useContext, useState } from 'react';

export const SocketEvent = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  UNAUTHORIZED: 'unauthorized',
  PRODUCT_UPDATED: 'product:updated',
  PRODUCT_MENTIONED: 'product:mentioned',
  PRODUCT_TRENDING: 'product:trending',
  USER_FAVORITE_ADDED: 'user:favorite:added',
  USER_FAVORITE_REMOVED: 'user:favorite:removed',
  USER_NOTIFICATION: 'user:notification',
  SEARCH_RESULTS: 'search:results',
  SEARCH_TRENDING: 'search:trending',
  SUBSCRIBE_PRODUCT: 'subscribe:product',
  UNSUBSCRIBE_PRODUCT: 'unsubscribe:product',
  SUBSCRIBE_SEARCH: 'subscribe:search',
  UNSUBSCRIBE_SEARCH: 'unsubscribe:search'
} as const;

export type SocketEvent = (typeof SocketEvent)[keyof typeof SocketEvent];

interface SocketContextType {
  socket: any | null;
  isConnected: boolean;
  subscribeToProduct: (productId: number) => void;
  unsubscribeFromProduct: (productId: number) => void;
  subscribeToSearch: (query: string) => void;
  unsubscribeFromSearch: (query: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  subscribeToProduct: () => {},
  unsubscribeFromProduct: () => {},
  subscribeToSearch: () => {},
  unsubscribeFromSearch: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected] = useState(false);

  const subscribeToProduct = (_productId: number) => {};
  const unsubscribeFromProduct = (_productId: number) => {};
  const subscribeToSearch = (_query: string) => {};
  const unsubscribeFromSearch = (_query: string) => {};

  return (
    <SocketContext.Provider
      value={{
        socket: null,
        isConnected,
        subscribeToProduct,
        unsubscribeFromProduct,
        subscribeToSearch,
        unsubscribeFromSearch,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
