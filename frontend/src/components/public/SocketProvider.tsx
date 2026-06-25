'use client';
// src/components/public/SocketProvider.tsx
import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocket(); // Establishes connection and sets up real-time listeners
  return <>{children}</>;
}
