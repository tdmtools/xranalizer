'use client';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          shouldRetryOnError: false,
        }}
      >
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </SWRConfig>
    </ThemeProvider>
  );
}
