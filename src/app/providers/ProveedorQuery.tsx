import React from 'react';
import type { ReactNode } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

/**
 * Query Client with optimized settings for the application
 * 
 * Cache Strategy:
 * - staleTime: 5 minutes (data is fresh for 5 min)
 * - gcTime: 10 minutes (cache gc after 10 min of not being used)
 * - retry: 2 times on failure
 * - retryDelay: exponential backoff
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

interface ProveedorQueryProps {
  children: ReactNode;
}

/**
 * Query Provider Component
 * 
 * Wraps the application with React Query infrastructure
 * Should be placed in App.tsx after authentication but before other providers
 */
export const ProveedorQuery: React.FC<ProveedorQueryProps> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
