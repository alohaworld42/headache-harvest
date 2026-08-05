import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/store/app-store';
import { cn } from '@/lib/utils';

interface ProGateProps {
  onUpgrade: () => void;
  children: React.ReactNode;
  className?: string;
  /** 'paid' excludes the trial — used for the doctor report. */
  require?: 'pro' | 'paid';
}

/**
 * Locked sections render a placeholder instead of the real content. Blurring the
 * children would still ship them to the page, where anyone could read them by
 * removing a CSS class — and on the report it would also blur the printout.
 */
export function ProGate({ onUpgrade, children, className, require = 'pro' }: ProGateProps) {
  const { t, pro } = useApp();
  const unlocked = require === 'paid' ? pro.paid : pro.active;
  if (unlocked) return <>{children}</>;

  // During the trial the generic "unlock Pro" wording would be confusing, since
  // Pro already appears active everywhere else.
  const title = require === 'paid' && pro.active ? t('pro.paidOnly') : t('pro.locked');
  const body = require === 'paid' && pro.active ? t('pro.paidOnlyBody') : t('pro.lockedBody');

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-dashed bg-muted/20 print-hidden',
        className,
      )}
    >
      {/* A hint of structure so the section still reads as content, not an error. */}
      <div aria-hidden className="space-y-2.5 p-5 opacity-40">
        {[100, 82, 64, 88, 70].map((width, index) => (
          <div key={width} className="h-3 rounded-full bg-muted-foreground/25" style={{ width: `${width}%`, marginLeft: index % 2 ? '0' : undefined }} />
        ))}
      </div>

      <div className="flex flex-col items-center justify-center gap-3 px-6 pb-7 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-4 w-4 text-primary" />
        </span>
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
        </div>
        <Button size="sm" onClick={onUpgrade}>
          {require === 'paid' && pro.active ? t('pro.buyNow') : t('action.upgrade')}
        </Button>
      </div>
    </div>
  );
}
