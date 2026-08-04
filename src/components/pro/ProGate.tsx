import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/store/app-store';
import { cn } from '@/lib/utils';

interface ProGateProps {
  onUpgrade: () => void;
  children: React.ReactNode;
  /** Renders the locked content blurred behind the overlay instead of hiding it. */
  preview?: boolean;
  className?: string;
}

export function ProGate({ onUpgrade, children, preview = true, className }: ProGateProps) {
  const { t, pro } = useApp();
  if (pro.active) return <>{children}</>;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      {preview && (
        <div aria-hidden className="pointer-events-none select-none blur-[6px] saturate-50">
          {children}
        </div>
      )}
      <div
        className={cn(
          'inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-background/70 p-6 text-center backdrop-blur-[2px]',
          preview ? 'absolute' : 'relative',
        )}
      >
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
