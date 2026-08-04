import React from 'react';
import { AlertTriangle, Info, ShieldAlert, Sparkles } from 'lucide-react';
import type { Insight } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const STYLES: Record<Insight['level'], { icon: React.ElementType; className: string }> = {
  info: { icon: Info, className: 'border-border bg-card text-muted-foreground' },
  positive: { icon: Sparkles, className: 'border-primary/30 bg-primary/5 text-primary' },
  warning: { icon: AlertTriangle, className: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  critical: { icon: ShieldAlert, className: 'border-destructive/40 bg-destructive/10 text-destructive' },
};

export function InsightCard({ insight }: { insight: Insight }) {
  const style = STYLES[insight.level];
  const Icon = style.icon;
  return (
    <div className={cn('flex gap-3 rounded-2xl border p-4', style.className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{insight.title}</p>
        <p className="text-sm leading-relaxed">{insight.body}</p>
      </div>
    </div>
  );
}
