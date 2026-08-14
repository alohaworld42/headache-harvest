import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Activity, BarChart3, CalendarDays, Coffee, FileText, Moon, Plus, Settings, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KOFI_URL } from '@/lib/pro';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/app-store';
import type { TranslationKey } from '@/lib/i18n';

interface NavItem {
  to: string;
  label: TranslationKey;
  /** Shorter wording for the mobile tab bar. */
  shortLabel?: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { to: '/', label: 'nav.dashboard', icon: Activity },
  { to: '/calendar', label: 'nav.calendar', icon: CalendarDays },
  { to: '/insights', label: 'nav.insights', icon: BarChart3 },
  { to: '/report', label: 'nav.report', shortLabel: 'nav.reportShort', icon: FileText },
  { to: '/settings', label: 'nav.settings', shortLabel: 'nav.settingsShort', icon: Settings },
];

function ThemeToggle() {
  const { settings, updateSettings } = useApp();
  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Light mode' : 'Dark mode'}
      onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
    >
      {isDark ? <Sun className="h-[1.15rem] w-[1.15rem]" /> : <Moon className="h-[1.15rem] w-[1.15rem]" />}
    </Button>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M3 13h3.2l2-5.5 3.2 11 2.6-8 1.7 4h5.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

interface AppShellProps {
  children: React.ReactNode;
  onNewEntry: () => void;
}

export function AppShell({ children, onNewEntry }: AppShellProps) {
  const { t, pro } = useApp();
  const location = useLocation();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur print-hidden">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight">{t('app.name')}</span>
            {pro.active && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {t('pro.badge')}
              </span>
            )}
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                  )
                }
              >
                {t(item.label)}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {/* Deliberately quiet: the app is usable for free, so the ask stays a footnote. */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <a href={KOFI_URL} target="_blank" rel="noopener noreferrer" aria-label={t('pro.donate')} title={t('pro.donate')}>
                <Coffee className="h-[1.05rem] w-[1.05rem]" />
              </a>
            </Button>
            <ThemeToggle />
            {/* The label collapses to an icon on phones, so it needs an explicit name. */}
            <Button size="sm" className="gap-1.5" onClick={onNewEntry} aria-label={t('action.addLong')}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('action.add')}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 md:pb-12">{children}</main>

      <footer className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4 text-xs text-muted-foreground md:pb-8 print-hidden">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4">
          <span>
            {t('app.name')} · {t('app.tagline')}
          </span>
          <span className="ml-auto flex flex-wrap gap-x-4 gap-y-1">
            {/* Aimed at the people who hand the app out, so it stays out of the tab bar. */}
            <Link className="hover:text-foreground" to="/clinicians">
              {t('nav.clinicians')}
            </Link>
            <Link className="hover:text-foreground" to="/legal/privacy">
              {t('legal.privacy')}
            </Link>
            <Link className="hover:text-foreground" to="/legal/terms">
              {t('legal.terms')}
            </Link>
            <Link className="hover:text-foreground" to="/legal/imprint">
              {t('legal.imprint')}
            </Link>
          </span>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print-hidden">
        <div className="flex items-stretch justify-around">
          {NAV.map((item) => {
            const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {t(item.shortLabel ?? item.label)}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
