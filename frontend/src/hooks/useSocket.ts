// src/hooks/useSocket.ts
'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socketInstance: Socket | null = null;

export function useSocket() {
  const queryClient = useQueryClient();
  const connected = useRef(false);

  const connect = useCallback(() => {
    if (socketInstance?.connected) return;

    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      connected.current = true;
      console.log('🔌 Socket connected');
    });

    socketInstance.on('disconnect', () => {
      connected.current = false;
    });

    // Real-time content updates — invalidate relevant query caches
    socketInstance.on('content:update', (event: { type: string; action: string; data: unknown }) => {
      const { type, action, data } = event;

      // Invalidate the relevant list query
      queryClient.invalidateQueries({ queryKey: [type + 's'] });

      // Show toast notification on public site
      if (action === 'create') {
        const title = (data as Record<string, string>)?.titre;
        if (title) {
          toast(`✦ Nouveau ${type}: ${title}`, {
            duration: 4000,
            style: { background: '#0A1628', color: '#E8A020', border: '1px solid rgba(232,160,32,0.3)' },
          });
        }
      }
    });
  }, [queryClient]);

  useEffect(() => {
    connect();
    return () => {
      // Don't disconnect on component unmount — keep global connection
    };
  }, [connect]);

  return { socket: socketInstance, connected: connected.current };
}

// Disconnect when user leaves
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    socketInstance?.disconnect();
  });
}
