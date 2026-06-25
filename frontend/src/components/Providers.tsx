'use client';
// src/components/Providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0A1628',
            color: '#F5C842',
            border: '1px solid rgba(232,160,32,0.3)',
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#E8A020', secondary: '#0A1628' } },
          error: { iconTheme: { primary: '#D94F3B', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
