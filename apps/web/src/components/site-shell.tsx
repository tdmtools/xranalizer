'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Building2, Webhook } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Dashboard', icon: Activity },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/webhooks', label: 'Webhooks', icon: Webhook },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
              XR
            </div>
            <span className="font-semibold tracking-tight">XRAnalizer</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
        <nav className="md:hidden border-t">
          <div className="container mx-auto flex items-center gap-1 px-2 py-1.5 overflow-x-auto">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap',
                    active
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-xs text-muted-foreground">
          XRAnalizer · webhook request analyzer
        </div>
      </footer>
    </div>
  );
}
