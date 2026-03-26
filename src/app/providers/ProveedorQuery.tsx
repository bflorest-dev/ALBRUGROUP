import React from 'react';
import type { ReactNode } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();

interface ProveedorQueryProps {
  children: ReactNode;
}

export const ProveedorQuery: React.FC<ProveedorQueryProps> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
