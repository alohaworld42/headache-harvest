import React from 'react';
import { BarChart3, FileText, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BrandMark } from '@/components/layout/AppShell';
import { useApp } from '@/store/app-store';
import { cn } from '@/lib/utils';

export function Onboarding({ open, onDone }: { open: boolean; onDone: () => void }) {
  const { t, settings, updateSettings } = useApp();

  const steps = [
    { icon: Zap, label: t('onboard.step1') },
    { icon: BarChart3, label: t('onboard.step2') },
    { icon: FileText, label: t('onboard.step3') },
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDone()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <BrandMark className="mb-1 h-10 w-10" />
          <DialogTitle>
            {t('onboard.title')} · {t('app.name')}
          </DialogTitle>
          <DialogDescription>{t('onboard.body')}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 py-1">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-3 text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <step.icon className="h-4 w-4 text-primary" />
              </span>
              {step.label}
            </li>
          ))}
        </ul>

        <div className="flex gap-2 rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          {t('settings.privacyNote')}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            {(['de', 'en'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => updateSettings({ language: code })}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  settings.language === code
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <Button className="ml-auto" onClick={onDone}>
            {t('onboard.start')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
