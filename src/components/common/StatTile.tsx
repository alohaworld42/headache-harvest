import React from 'react';
import { cn } from '@/lib/utils';

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: 'default' | 'warning' | 'positive';
  icon?: React.ReactNode;
}

export function StatTile({ label, value, hint, accent = 'default', icon }: StatTileProps) {
  return (
    <div className="surface flex flex-col gap-1 p-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && <span className="ml-auto text-muted-foreground">{icon}</span>}
      </div>
      <span
        className={cn(
          'text-2xl font-semibold tabular tracking-tight',
          accent === 'warning' && 'text-destructive',
          accent === 'positive' && 'text-primary',
        )}
      >
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
