import React, { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PRO_FEATURES, fetchPricing, startCheckout, verifyToken, type PricingResponse } from '@/lib/pro';
import { useApp } from '@/store/app-store';

interface ProDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProDialog({ open, onOpenChange }: ProDialogProps) {
  const { t, pro, startTrial, applyLicense } = useApp();
  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [busy, setBusy] = useState<'lifetime' | 'yearly' | 'restore' | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [showRestore, setShowRestore] = useState(false);

  useEffect(() => {
    if (!open || pricing) return;
    void fetchPricing().then(setPricing);
  }, [open, pricing]);

  const buy = async (plan: 'lifetime' | 'yearly') => {
    setBusy(plan);
    const url = await startCheckout(plan);
    setBusy(null);
    if (!url) {
      toast.error(t('pro.checkoutUnavailable'));
      return;
    }
    window.location.href = url;
  };

  const restore = async () => {
    if (!licenseKey.trim()) return;
    setBusy('restore');
    const license = await verifyToken(licenseKey.trim());
    setBusy(null);
    if (!license) {
      toast.error(t('pro.restoreFail'));
      return;
    }
    applyLicense(license);
    toast.success(t('pro.restoreOk'));
    onOpenChange(false);
  };

  const checkoutEnabled = pricing?.enabled ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>{t('pro.title')}</DialogTitle>
          <DialogDescription>{t('pro.subtitle')}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 py-1">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{t(feature)}</span>
            </li>
          ))}
        </ul>

        {pro.active ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
            {pro.source === 'trial' ? t('pro.trialActive', pro.trialDaysLeft) : t('pro.manageNote')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {checkoutEnabled && pricing?.lifetime?.available && (
              <Button className="h-12 w-full justify-between" disabled={busy !== null} onClick={() => buy('lifetime')}>
                <span className="flex flex-col items-start">
                  <span>{t('pro.buyLifetime')}</span>
                  <span className="text-[11px] font-normal opacity-80">{t('pro.lifetimeNote')}</span>
                </span>
                <span className="text-base font-semibold">
                  {busy === 'lifetime' ? <Loader2 className="h-4 w-4 animate-spin" /> : pricing.lifetime.label}
                </span>
              </Button>
            )}
            {checkoutEnabled && pricing?.yearly?.available && (
              <Button
                variant="outline"
                className="h-12 w-full justify-between"
                disabled={busy !== null}
                onClick={() => buy('yearly')}
              >
                <span className="flex flex-col items-start">
                  <span>{t('pro.buyYearly')}</span>
                  <span className="text-[11px] font-normal text-muted-foreground">{t('pro.yearlyNote')}</span>
                </span>
                <span className="text-base font-semibold">
                  {busy === 'yearly' ? <Loader2 className="h-4 w-4 animate-spin" /> : pricing.yearly.label}
                </span>
              </Button>
            )}

            {!checkoutEnabled && pricing !== null && (
              <p className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
                {t('pro.checkoutUnavailable')}
              </p>
            )}

            {!pro.trialUsed && (
              <Button
                variant={checkoutEnabled ? 'ghost' : 'default'}
                className="w-full"
                onClick={() => {
                  startTrial();
                  toast.success(t('pro.trialStarted'));
                  onOpenChange(false);
                }}
              >
                {t('pro.trialStart')}
              </Button>
            )}
            {pro.trialUsed && pro.trialDaysLeft === 0 && (
              <p className="text-center text-xs text-muted-foreground">{t('pro.trialOver')}</p>
            )}
          </div>
        )}

        <div className="border-t pt-3">
          {showRestore ? (
            <div className="space-y-2">
              <Label htmlFor="license-key">{t('pro.licenseKey')}</Label>
              <p className="text-xs text-muted-foreground">{t('pro.restoreHint')}</p>
              <div className="flex gap-2">
                <Input
                  id="license-key"
                  value={licenseKey}
                  onChange={(event) => setLicenseKey(event.target.value)}
                  placeholder="eyJ…"
                  autoComplete="off"
                />
                <Button variant="secondary" disabled={busy !== null} onClick={restore}>
                  {busy === 'restore' ? <Loader2 className="h-4 w-4 animate-spin" /> : t('action.save')}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              onClick={() => setShowRestore(true)}
            >
              {t('pro.restore')}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
