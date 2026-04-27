import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { SiteShell } from '@/components/site-shell';

export const metadata: Metadata = {
  title: 'XRAnalizer — Webhook request analyzer',
  description: 'Capture, inspect and replay webhook requests in real time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
