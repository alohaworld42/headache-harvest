import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/store/app-store';
import { cn } from '@/lib/utils';

interface ProGateProps {
  onUpgrade: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Locked sections render a placeholder instead of the real content. Blurring the
 * children would still ship them to the page, where anyone could read them by
 * removing a CSS class — and on the report it would also blur the printout.
 */
export function ProGate({ onUpgrade, children, className }: ProGateProps) {
  const { t, pro } = useApp();
  if (pro.active) return <>{children}</>;

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
          <p className="font-medium">{t('pro.locked')}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t('pro.lockedBody')}</p>
        </div>
        <Button size="sm" onClick={onUpgrade}>
          {t('action.upgrade')}
        </Button>
      </div>
    </div>
  );
}
